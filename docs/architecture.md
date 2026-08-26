# Architecture

This document describes the current architecture of Toko Myrex. It is a map of the system that exists today, not a roadmap and not a mandate to add more layers.

`package.json` is the source of truth for exact dependency versions. The application currently uses Bun, Next.js App Router, React, TypeScript, Better Auth, PostgreSQL/Drizzle, Resend, Cloudflare R2 through the S3 API, Sharp, file-type, Tailwind CSS, shadcn/Base UI, and Zod.

## Architectural shape

The application intentionally has a small number of explicit boundaries:

```text
Browser
  |
  v
Next.js routes, pages, layouts, Server Actions
  |
  +--> lib/auth/       authentication and authoritative authorization
  |
  +--> lib/catalog/    catalog rules, reads, mutations, upload lifecycle
  |       |
  |       +--> lib/db/       PostgreSQL/Drizzle
  |       +--> lib/storage/  R2/S3 mechanics and file policy
  |
  +--> lib/email/      tracked transactional email delivery
```

Do not turn this into a generic controller/service/repository architecture. Add a boundary only when the code has an independent responsibility that cannot be expressed cleanly inside an existing one.

## Directory ownership

### `app/`

Owns routing and web-facing concerns:

- App Router pages and layouts
- route handlers
- Server Actions
- redirects and navigation composition
- conversion of domain failures into user-facing action state

Server Actions are trust boundaries. They authorize the caller and validate raw input before calling domain operations.

### `components/`

Owns presentation and browser interaction.

- feature components stay with their feature
- `components/ui/` contains shared shadcn/Base UI primitives
- Server Components are preferred by default
- Client Components are used only when browser APIs, event handlers, subscriptions, or local interactive state require them

Do not rewrite shadcn primitives merely to make generated vendor code look hand-written. Patch them only for a demonstrated application need or an upstream incompatibility.

### `lib/auth/`

Owns Better Auth configuration and authoritative session/role rules.

Important files include:

- `config.ts`: Better Auth configuration and plugins
- `session.ts`: cached session reads and authoritative admin/2FA guards
- `safe-redirect.ts`: same-origin post-auth navigation rules
- `origin.ts`: configured auth-origin validation
- `validation/`: credential normalization and validation

The session cookie checked by `proxy.ts` is only an optimistic early redirect. It is never an authorization decision.

### `lib/catalog/`

Owns product/catalog domain behavior:

- validated domain values
- authenticated admin reads and narrow unauthenticated public read models
- catalog DTOs
- create/update/publish/archive/restore state transitions
- product upload orchestration
- publication requirements
- product-specific upload verification

Catalog domain modules do not depend on React or route modules.

### `lib/db/`

Owns PostgreSQL/Drizzle infrastructure and schema.

Database constraints remain the final concurrency-safe enforcement for invariants that must always hold. Transactions and row locks are intentional where product lifecycle operations can race.

### `lib/storage/`

Owns R2/S3 mechanics and storage/file-policy configuration.

It does not decide product lifecycle state. Catalog code may orchestrate a product upload, while storage code performs storage operations and enforces storage-level policy.

### `lib/email/`

Owns tracked transactional email delivery.

Auth callbacks schedule email delivery after the response. The delivery subsystem retains database tracking, Resend idempotency, failure recording, webhook verification, duplicate-event protection, and event-order protection.

## Authentication and authorization

Authentication uses Better Auth. Do not introduce a second authentication/session system.

### Session reads

`lib/auth/session.ts` caches the request session with React `cache()` and Better Auth's server API.

### Admin authorization

Admin access requires all of the following at the authoritative boundary:

1. an authenticated session
2. the `admin` role
3. two-factor authentication enabled for admin operations

`requireAdmin()` is authoritative. Proxy/session-cookie checks are not.

### Two-factor authentication

The existing Better Auth TOTP flow is deliberate. Admin users without 2FA are sent through enrollment before entering the admin application. Post-challenge navigation is resolved after Better Auth returns the verified user rather than assuming that every 2FA user is an admin.

### Redirects

Redirect targets influenced by user input must remain same-origin application paths. Reuse `lib/auth/safe-redirect.ts`; do not create a second redirect sanitizer.

### Auth email

Verification and password-reset emails are scheduled with Next.js post-response work rather than making the auth request wait for Resend. Delivery itself remains tracked by the email subsystem.

## Catalog lifecycle

The current product lifecycle is intentionally explicit:

```text
create -> draft

draft -> published   when publication requirements are complete
published -> archived
archived -> draft     through restore
```

Updates to archived products are rejected until the product is restored to draft. Publication uses a transaction and row locking so lifecycle checks and writes remain coherent under concurrency.

The current product editor manages one default active variant. The schema still contains a broader variant model; do not delete or redesign it incidentally while implementing an unrelated feature.

A publishable product currently requires the domain data checked by `getProductPublicationIssues()`, including usable product metadata, an active default variant/price, a ready cover, and a ready downloadable asset.

Unique slug and SKU conflicts are enforced by the database and mapped into domain errors for the UI.

## Public storefront

The public storefront is a read-only projection of the existing catalog. The
homepage lists public products and `/produk/[slug]` renders product detail.
These routes do not introduce carts, orders, payments, entitlements,
categories, or customer downloads.

`lib/catalog/public-data.ts` is the unauthenticated public data boundary. A
product is visible only when it is published and its query projection can find
an active default variant, a ready cover with dimensions, a non-empty
description, a publication timestamp, and a ready asset. Inconsistent
published rows fail closed: they are omitted from the homepage and resolve to
404 on detail.

Public DTOs expose only storefront fields such as name, canonical slug,
summary, description, default price, publication date, and the verified public
cover representation. They do not expose SKU, storage keys, asset records,
rejection state, or audit-user fields. Invalid, non-canonical, draft, archived,
and unknown slugs are intentionally indistinguishable at the route boundary.

Public catalog reads are request-time reads. The homepage and sitemap call
Next.js `connection()` before querying. The product detail route uses a
page-local React-cached loader that calls `connection()` so its metadata and
page render share one request-time database result. Cross-request caching and
cache-tag invalidation are intentionally deferred until the application adopts
a coherent persistent storefront cache policy.

## Product upload trust boundary

Uploaded files are untrusted until verification finishes.

The high-level lifecycle is:

```text
Server Action authorizes request and creates upload intent
  |
  v
browser receives presigned PUT target
  |
  v
browser uploads directly to private R2 staging
  |
  v
server verifies the staged object
  |
  +--> reject + best-effort cleanup on failure
  |
  v
mark ready / publish the verified representation
```

### Cover images

Cover verification checks upload metadata, supported MIME/signature, size, dimensions/pixel limits, and checksum. The image is re-encoded with Sharp before the verified representation is exposed.

### Downloadable assets

Large assets are verified as streams rather than loaded fully into memory. Integrity is calculated while streaming, and only the small leading portion needed for file-signature detection is retained.

Do not weaken this flow for convenience. In particular:

- do not make unverified staging objects public
- do not trust browser `Content-Type` alone
- do not remove checksum/signature verification without a stronger replacement
- do not silently swallow failed cleanup operations

Browser presigned uploads require the R2 CORS configuration documented in `README.md`.

## Database rules

Prefer database enforcement for invariants that must survive concurrent requests.

Current patterns to preserve include:

- unique indexes for identifiers such as product slug and variant SKU
- check constraints for valid numeric/state values
- transactions for multi-write state transitions
- row locks where concurrent lifecycle changes can conflict

A Zod schema at the request boundary does not replace a database constraint when concurrency matters.

Schema source lives under `lib/db/schema/`. Generated migrations and Drizzle metadata live under `drizzle/`.

Never hand-edit generated Drizzle snapshots to imitate a migration.

## Read models and DTOs

Catalog DTOs are intentional application contracts, not generic enterprise ceremony. They provide a client-safe/read-model shape and normalize values such as dates where needed.

Admin product detail currently reads the data the UI actually uses: the default variant, covers, and downloadable assets. Do not reintroduce category/gallery overfetch merely because those tables exist in the schema.

Public catalog DTOs are separate from admin DTOs. Keep their projection narrow
and fail closed rather than reusing an admin object and removing fields in the
route.

## UI and React rules

Use Server Components unless interactivity requires a Client Component.

For Client Components:

- derive values during render when possible
- avoid `useEffect` for derived state
- use subscriptions such as `useSyncExternalStore` for external browser state when appropriate
- keep browser transport concerns separate when they are independently meaningful, as with upload progress transport
- do not split a cohesive state machine only to reduce file length

Feature code should use product/domain language. Avoid generic names such as `Manager`, `Service`, `Repository`, `Factory`, or catch-all `utils` unless the concept genuinely exists.

## Email lifecycle

Transactional auth email is not a fake queue.

The request schedules delivery after the response. `lib/email/` performs the real send and tracks it. Resend webhook processing verifies signatures, deduplicates event IDs, and prevents an older webhook event from overwriting a newer delivery state.

Do not replace this with fire-and-forget promise handling that loses tracking or failure visibility.

## Generated and vendored code

Treat these differently from hand-written feature code.

Generated artifacts include Bun lockfile and Drizzle migration metadata. Change their source inputs and regenerate them with the owning tool.

`components/ui/` is largely vendored/generated shadcn code. Keep it close to upstream unless the application has a concrete reason to diverge.

## Deferred schema scope

The database still contains future-facing category/gallery structures and a broader variant model. Their unused read-path was intentionally removed, but physical schema deletion was deferred.

Do not delete these tables/columns as incidental cleanup. Any physical schema change must be an explicit task with a generated, reviewed, and tested Drizzle migration.

## How to approach a change

Before editing a non-trivial feature, locate the existing flow rather than inventing a parallel one.

- authentication/session/role change: start with `lib/auth/`, then the relevant auth page/component
- catalog write: start with the Server Action, validation, then `lib/catalog/mutations.ts`
- authenticated catalog read: start with `lib/catalog/data.ts` and DTOs
- public catalog read: start with `lib/catalog/public-data.ts` and public DTOs
- product upload: inspect the Server Action, `lib/catalog/uploads.ts`, `upload-verification.ts`, and `lib/storage/`
- database change: inspect schema source, existing constraints, migration history, then generate a migration
- email change: inspect Better Auth callback configuration, `lib/email/delivery.ts`, and the Resend webhook route
- UI primitive change: confirm whether the behavior comes from shadcn upstream before creating local drift

For framework/library behavior that may have changed, consult current official documentation or the library's official source/release notes. Do not rely on remembered APIs when the version matters.

## Verification

Use targeted checks while iterating, then run the repository gate before considering work complete:

```bash
bun run verify
```

It runs lint, Next.js route type generation, TypeScript, Bun tests, and the production Next.js build.

Changes to validation, security rules, lifecycle behavior, parsers, file policy, redirect rules, or other non-visual invariants should add or update regression tests.
