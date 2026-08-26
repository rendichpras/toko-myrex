# Engineering Rules

This repository is a production application, not a code-generation sandbox. Prefer simple, explicit code with clear ownership over generic abstractions.

## Before changing code

- Read the existing implementation and preserve working behavior unless the task explicitly changes it.
- Reuse existing domain concepts and naming. Do not introduce a second pattern for the same problem.
- Do not add a dependency when the platform, framework, or existing dependency already solves the problem adequately.
- Do not introduce speculative infrastructure, generic service/repository layers, or abstractions with only one concrete use case.

## Boundaries

- `app/` owns routing, request/response concerns, Server Actions, redirects, and presentation composition.
- Server Actions are trust boundaries: authorize the caller, validate untrusted input, call domain operations, then map expected domain failures to user-facing state.
- `lib/catalog/` owns catalog invariants and persistence behavior. Domain operations should not depend on React or route modules.
- `lib/db/` owns database connection and schema infrastructure.
- `lib/auth/` owns Better Auth configuration and authoritative session/role checks.
- `lib/storage/` owns R2/S3 mechanics and file policy. Catalog code may orchestrate product-specific upload state, but must not duplicate storage configuration rules.
- `components/ui/` contains shared UI primitives. Feature-specific components belong with their feature, not in `components/ui/`.

## Next.js and React

- Use Server Components by default. Add `"use client"` only for browser APIs, event handlers, or client state.
- Do not use Client Components as a shortcut around server/data boundaries.
- Prefer framework primitives over custom wrappers when the wrapper adds no domain meaning.
- Do not add `useEffect` to derive state that can be calculated during render. Prefer `useSyncExternalStore` for subscriptions to external browser state.
- Keep authorization authoritative at sensitive data/write boundaries. Proxy cookie checks are only an early redirect optimization.

## TypeScript

- Keep `strict` TypeScript clean. Do not use `any`, `@ts-ignore`, or unsafe assertions to silence errors.
- Prefer inference for local implementation details; add explicit types at public/module boundaries when they improve the contract.
- Distinguish raw/untrusted input types from normalized domain values.
- Do not duplicate types that can be derived safely from a schema or existing domain type.

## Validation and errors

- Validate untrusted data once at the trust boundary. Do not repeatedly parse the same value in every layer.
- Business invariants still belong in the domain/database layer even when transport validation has already succeeded.
- Do not swallow unexpected errors. Expected domain failures should be typed/mapped; unexpected failures should be logged and allowed to surface as an operation failure.
- Error messages shown to users must not expose secrets, SQL details, storage keys, or internal stack traces.

## Database and storage

- Use database constraints for invariants that must remain true under concurrency.
- Use transactions when multiple writes form one logical state transition.
- Preserve row locking where concurrent catalog lifecycle operations can conflict.
- Treat uploaded files as untrusted. Keep MIME/signature/size verification and image sanitization intact unless replacing them with a stronger mechanism.
- Do not make public objects from unverified private uploads.

## Auth and security

- Use Better Auth rather than creating a second session/authentication system.
- Admin operations require an authoritative admin session and configured two-factor authentication.
- Do not trust the presence of the session cookie as authorization.
- Never expose server secrets to Client Components or `NEXT_PUBLIC_*` variables.
- Redirect targets derived from user input must remain same-origin paths.

## Generated artifacts

- Treat generated files as generator output, not as a convenient place for manual fixes.
- Change dependency and package metadata in `package.json`, then regenerate `bun.lock` with the repository's pinned Bun version and review the diff.
- Change database definitions in `lib/db/schema/`, then generate and review the corresponding Drizzle migration and metadata. Do not hand-edit Drizzle snapshots to imitate a migration.
- Never update a dependency manifest without keeping its generated lockfile in sync.

## Code quality

Avoid generated-code habits:

- no one-line wrapper functions without semantic value
- no catch-and-return-null for infrastructure failures unless `null` is the documented domain result
- no duplicated validation/auth checks caused only by unclear ownership
- no barrel files by default
- no giant `utils` modules
- no placeholder abstractions (`Manager`, `Service`, `Repository`, `Factory`) without a concrete architectural need
- no lint-rule disabling when the underlying code can reasonably be fixed
- no comments that merely restate the code
- no dead code or speculative feature scaffolding

Split large files by coherent responsibility, not arbitrary line count. A larger cohesive module is preferable to many tiny files with indirection and no independent concept.

## Verification

Before considering a change complete, run:

```bash
bun run verify
```

`verify` is the repository quality gate: lint, Next.js route type generation, TypeScript, tests, and production build must all pass.

Add or update tests when changing validation, security rules, lifecycle invariants, parsing, file policy, or other behavior that can regress without visual evidence.

Do not merge a refactor that changes behavior accidentally just because lint and TypeScript pass.
