# Engineering Rules

This repository is a production application, not a code-generation sandbox. Prefer simple, explicit code with clear ownership over generic abstractions.

## Agent onboarding

For the first non-trivial task in a fresh agent session, build the project mental model before editing code:

1. read this `AGENTS.md` completely
2. read `README.md` completely
3. read `docs/architecture.md` completely
4. inspect the repository tree and the existing implementation relevant to the task
5. trace the current request/data flow across every boundary the task will touch

Do not start a broad refactor while still guessing how the existing flow works. For a small, isolated change, do not manufacture a large planning ceremony; inspect the local implementation and proceed.

Before introducing a new helper, abstraction, dependency, state container, validation layer, or naming convention, search the repository for the existing concept first.

## Source of truth and current documentation

- `package.json` is the source of truth for the versions this project currently targets.
- `docs/architecture.md` describes the intended current system shape. Keep it synchronized when an intentional architectural change makes it stale.
- Existing working behavior and database invariants must be understood before they are changed.
- For version-sensitive framework/library behavior, consult current official documentation, official release notes, or the official source repository. Do not rely on remembered APIs when the installed version matters.
- Prefer primary sources over blog posts, snippets, Stack Overflow answers, or generated summaries.
- Do not upgrade a dependency merely because a newer version exists unless the task includes dependency maintenance or the current version has a concrete problem such as a security fix.

## Working protocol

For work that crosses multiple domains, affects auth/security/data integrity, changes database schema, or changes upload/email lifecycle behavior, make a concise plan before editing and identify the authoritative boundaries involved.

While implementing:

- make the smallest coherent change that fully solves the requested problem
- preserve unrelated working behavior
- prefer modifying the existing path over creating a parallel implementation
- run focused checks while iterating when useful
- review the final diff for accidental complexity, duplicated logic, stale copy/comments, dead code, and generated-looking abstractions

Do not create commits, push branches, open or merge pull requests, rewrite history, or switch branches unless the user explicitly asks. Treat unrelated dirty-worktree changes as user-owned and do not overwrite them.

## Before changing code

- Read the existing implementation and preserve working behavior unless the task explicitly changes it.
- Reuse existing domain concepts and naming. Do not introduce a second pattern for the same problem.
- Do not add a dependency when the platform, framework, or existing dependency already solves the problem adequately.
- Do not introduce speculative infrastructure, generic service/repository layers, or abstractions with only one concrete use case.
- Distinguish hand-written feature code from generated or vendored code before deciding that something should be rewritten.

## Boundaries

- `app/` owns routing, request/response concerns, Server Actions, redirects, and presentation composition.
- Server Actions are trust boundaries: authorize the caller, validate untrusted input, call domain operations, then map expected domain failures to user-facing state.
- `lib/catalog/` owns catalog invariants and persistence behavior. Domain operations should not depend on React or route modules.
- `lib/db/` owns database connection and schema infrastructure.
- `lib/auth/` owns Better Auth configuration and authoritative session/role checks.
- `lib/storage/` owns R2/S3 mechanics and file policy. Catalog code may orchestrate product-specific upload state, but must not duplicate storage configuration rules.
- `lib/email/` owns tracked transactional email delivery.
- `components/ui/` contains shared UI primitives. Feature-specific components belong with their feature, not in `components/ui/`.

Do not add a new architectural layer simply to move code into more files. A boundary needs an independent responsibility and a stable reason to exist.

## Next.js and React

- Use Server Components by default. Add `"use client"` only for browser APIs, event handlers, subscriptions, or client state.
- Do not use Client Components as a shortcut around server/data boundaries.
- Prefer framework primitives over custom wrappers when the wrapper adds no domain meaning.
- Do not add `useEffect` to derive state that can be calculated during render. Prefer `useSyncExternalStore` for subscriptions to external browser state.
- Keep authorization authoritative at sensitive data/write boundaries. Proxy cookie checks are only an early redirect optimization.
- Use generated Next.js route types where the repository already relies on them rather than maintaining parallel manual route prop types.

## TypeScript

- Keep `strict` TypeScript clean. Do not use `any`, `@ts-ignore`, or unsafe assertions to silence errors.
- Prefer inference for local implementation details; add explicit types at public/module boundaries when they improve the contract.
- Distinguish raw/untrusted input types from normalized domain values.
- Do not duplicate types that can be derived safely from a schema or existing domain type.
- Do not widen types merely to make an error disappear; fix the contract or the caller.

## Validation and errors

- Validate untrusted data once at the trust boundary. Do not repeatedly parse the same value in every layer.
- Business invariants still belong in the domain/database layer even when transport validation has already succeeded.
- Do not swallow unexpected errors. Expected domain failures should be typed/mapped; unexpected failures should be logged and allowed to surface as an operation failure.
- Best-effort cleanup may fail without failing the primary operation only when that behavior is intentional; such failures must remain observable with useful non-secret context.
- Error messages shown to users must not expose secrets, SQL details, storage keys, or internal stack traces.

## Database and storage

- Use database constraints for invariants that must remain true under concurrency.
- Use transactions when multiple writes form one logical state transition.
- Preserve row locking where concurrent catalog lifecycle operations can conflict.
- Treat uploaded files as untrusted. Keep MIME/signature/size/integrity verification and image sanitization intact unless replacing them with a stronger mechanism.
- Do not make public objects from unverified private uploads.
- Do not replace streaming verification of large assets with full-buffer reads without a demonstrated reason.

## Auth and security

- Use Better Auth rather than creating a second session/authentication system.
- Admin operations require an authoritative admin session and configured two-factor authentication.
- Do not trust the presence of the session cookie as authorization.
- Never expose server secrets to Client Components or `NEXT_PUBLIC_*` variables.
- Redirect targets derived from user input must remain same-origin paths.
- Preserve tracked/idempotent auth email delivery and verified/idempotent webhook processing when changing email behavior.
- Security changes require evidence from current primary documentation and regression tests when the behavior can be tested locally.

## Generated and vendored artifacts

- Treat generated files as generator output, not as a convenient place for manual fixes.
- Change dependency and package metadata in `package.json`, then regenerate `bun.lock` with the repository's pinned Bun version and review the diff.
- Change database definitions in `lib/db/schema/`, then generate and review the corresponding Drizzle migration and metadata. Do not hand-edit Drizzle snapshots to imitate a migration.
- Never update a dependency manifest without keeping its generated lockfile in sync.
- `components/ui/` is largely shadcn/Base UI vendor output. Keep it close to upstream unless the application has a concrete reason to diverge.

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
- no fake configurability for behavior the product does not actually support
- no UI copy that promises an unimplemented capability
- no refactor whose only justification is line count, personal style, or making the code look more sophisticated

Use domain language in names. Prefer names that reveal the actual operation or state over generic technical nouns.

Split large files by coherent responsibility, not arbitrary line count. A larger cohesive module is preferable to many tiny files with indirection and no independent concept.

## Verification

Before considering a code change complete, run:

```bash
bun run verify
```

`verify` is the repository quality gate: lint, Next.js route type generation, TypeScript, tests, and production build must all pass.

Add or update tests when changing validation, security rules, lifecycle invariants, parsing, redirect behavior, file policy, or other behavior that can regress without visual evidence.

If the environment prevents a required verification step, state exactly which command was not run and why. Never claim a build/test/check is green without running it.

A successful quality gate does not make an accidental behavior change acceptable. Review the final diff against the requested outcome before declaring the task complete.
