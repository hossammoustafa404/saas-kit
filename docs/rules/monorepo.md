# Monorepo: Nx

The codebase is an **Nx monorepo**. Nx orchestrates builds, tests, and lint across apps and packages with caching and [module boundary enforcement](https://nx.dev/docs/features/enforce-module-boundaries). See the [Nx docs](https://nx.dev/docs/getting-started/intro).

## Workspace Layout

```text
/
├── apps/
│   ├── web/           # Next.js — public/client-facing UI — see frontend/
│   ├── admin/            # Next.js — internal admin dashboard — see frontend/
│   └── server/           # NestJS — REST API — see backend/
├── packages/
│   └── schemas/              # @stack/schemas — shared Zod schemas, types, *Example
├── nx.json
├── package.json              # Root workspace scripts only — no app logic
└── tsconfig.base.json        # Path mappings for all projects
```

| Path               | Nx project           | Import name         | Purpose                       |
| ------------------ | -------------------- | ------------------- | ----------------------------- |
| `apps/web`         | `@saas-kit/web`      | `@/` (app-internal) | Client-facing Next.js app     |
| `apps/admin`       | `@saas-kit/admin`    | `@/` (app-internal) | Admin dashboard Next.js app   |
| `apps/server`      | `@saas-kit/server`   | `@/` (app-internal) | NestJS API server             |
| `packages/schemas` | `@stack/schemas`     | `@stack/schemas`    | Shared contracts for all apps |

- **NEVER** put application code at the workspace root.
- **NEVER** create `libs/` at root unless matching an existing Nx layout — prefer `packages/` for shared code.
- Add new shared code as `packages/{name}` — not duplicated inside `apps/`.
- `web` and `admin` are separate Next.js apps — **NEVER** merge them into one project.

## Apps Overview

| App          | Stack   | Rule files  | Talks to                    |
| ------------ | ------- | ----------- | --------------------------- |
| `web` | Next.js | `frontend/` | `server` over HTTP      |
| `admin`  | Next.js | `frontend/` | `server` over HTTP      |
| `server` | NestJS  | `backend/`  | Database, external services |

- Both frontends share the same stack conventions (`frontend/`) but have independent codebases, routes, and deployments.
- `admin` is for internal operators — stricter auth/authorization expectations; still follows `frontend/authentication.md` and `frontend/authorization.md`.
- **NEVER** share feature code between `web` and `admin` via direct imports — extract to `packages/` if truly shared.

## Dependency Direction

```text
web  ──┐
admin   ──┼──► packages/schemas
server  ──┘

web  ──X──► server     (HTTP only — no source imports)
admin   ──X──► server     (HTTP only)
web  ──X──► admin      (no cross-frontend imports)
admin   ──X──► web
packages    ──X──► apps           (libs never import apps)
```

- Apps communicate over HTTP — never import source from another app.
- Shared types, Zod schemas, and `*Example` meta objects live in `@stack/schemas` only. See `naming-conventions.md`, `backend/validation.md`, `backend/api-docs.md`.
- **NEVER** duplicate a schema or API contract inside any app when it belongs in `packages/schemas`.

## Nx Tags & Module Boundaries

Every project declares tags in `project.json`. Enforce via `@nx/eslint-plugin` `enforce-module-boundaries`:

| Tag            | Projects                                | May depend on                       |
| -------------- | --------------------------------------- | ----------------------------------- |
| `type:app`     | `web`, `admin`, `server` | `type:lib`                          |
| `type:lib`     | `schemas`, …                            | `type:lib` with `scope:shared` only |
| `scope:client` | `web`                            | `scope:shared`                      |
| `scope:admin`  | `admin`                             | `scope:shared`                      |
| `scope:server` | `server`                            | `scope:shared`                      |
| `scope:shared` | `schemas`, …                            | `scope:shared`                      |

```json
// apps/web/project.json
{ "tags": ["type:app", "scope:client"] }

// apps/admin/project.json
{ "tags": ["type:app", "scope:admin"] }

// apps/server/project.json
{ "tags": ["type:app", "scope:server"] }

// packages/schemas/project.json
{ "tags": ["type:lib", "scope:shared"] }
```

- **NEVER** add a dependency that violates tags — fix the architecture instead of disabling the lint rule.
- **NEVER** use generic scopes like `@org/` or `@repo/` — apps use `@saas-kit/{app}`; shared packages use `@stack/{package}`. See `naming-conventions.md`.
- Frontends (`scope:client`, `scope:admin`) **cannot** depend on each other or on `scope:server`.

## Shared Package: `@stack/schemas`

```text
packages/schemas/
├── src/
│   ├── index.ts              # Public barrel — sole entry for consumers
│   ├── user.ts               # UserSchema, User, UserExample, CreateUserSchema, …
│   └── auth.ts
├── project.json
└── package.json              # "name": "@stack/schemas"
```

- Export **HTTP** schemas, inferred types, and `*Example` meta objects from `src/index.ts`. This package is API contracts shared by `web`, `admin`, and `server`.
- **NEVER** export internals — one barrel, named exports only.
- **NEVER** put server env, secrets, or Prisma config schemas here (`DATABASE_URL`, `BETTER_AUTH_SECRET`, …). Those live in `apps/server/src/shared/config/` only. See `backend/validation.md`, `backend/security.md`.
- All three apps depend on `@stack/schemas` via workspace dependency — not relative paths like `../../packages/schemas`.
- When changing a schema, verify **web**, **admin**, and **server** still build and test before merging.

## TypeScript Path Mapping

- App-internal aliases (`@/`) are configured per app — point to that app's `src/`.
- Cross-project imports use the package name: `import { UserSchema } from "@stack/schemas"`.
- Register workspace paths in root `tsconfig.base.json` — **NEVER** deep-link across projects with relative `../../` paths.

## Running Tasks

Use `nx` — not raw `npm run` inside app folders (except when debugging a single script intentionally).

```bash
# Single project
nx build @saas-kit/web
nx build @saas-kit/admin
nx serve @saas-kit/server
nx test @stack/schemas

# All apps
nx run-many -t lint test build -p @saas-kit/web,@saas-kit/admin,@saas-kit/server

# Only what changed (CI and pre-push)
nx affected -t lint test build
```

| Task                                               | When to run                                    |
| -------------------------------------------------- | ---------------------------------------------- |
| `nx affected -t lint`                              | Every commit — fast feedback                   |
| `nx affected -t test`                              | Before PR — unit tests for touched projects    |
| `nx affected -t build`                             | Before PR — compile all affected apps and libs |
| `nx build @saas-kit/web` / `@saas-kit/admin` / `@saas-kit/server` | When verifying a full app build |

- Configure `targetDefaults` in `nx.json` for shared `inputs`, `cache`, and `dependsOn` (e.g. `build` depends on `^build`).
- **NEVER** skip `nx affected` in CI — run only what changed to keep pipelines fast.

## Generators

Use Nx generators to scaffold — match existing structure, do not hand-roll project layout:

```bash
nx g @nx/next:app web
nx g @nx/next:app admin
nx g @nx/nest:application server
nx g @nx/js:lib schemas --directory=packages/schemas --importPath=@stack/schemas
```

- After generating, add correct tags to `project.json` immediately.
- Align `web` and `admin` with `frontend/architecture.md`.
- Align `server` with `backend/architecture.md`.

## Adding Dependencies

This workspace uses a **single version policy** ([Nx: Dependency Management Strategies](https://nx.dev/docs/kb/dependency-management)): versions live in the **root** `package.json`. `npm install` at the repo root.

- **Runtime package** (Prisma, Zod, Nest, Next, React, …): add it to the **root** `package.json` first, with one version for the whole repo.
- The app that **imports** it also lists the **same version** in that app's `package.json` (`web` already does this for `next`/`react`). That keeps `nx graph` and `@nx/js:prune-lockfile` accurate. Do not invent a second version.
- **Shared dev tooling** (`nx`, `eslint`, `typescript`, `jest`): root `package.json` only — never on an app.
- **Workspace lib** (`@stack/schemas`): `"@stack/schemas": "*"` on each consuming app, package itself lists its runtime deps (e.g. `zod`) at the version pinned in root.

- **NEVER** add a package only to an app and skip the root.
- **NEVER** add a backend-only dependency to `web` or `admin`.
- **NEVER** add a frontend-only dependency to `server` unless genuinely shared (rare).
- UI libraries needed by both frontends belong in root + each frontend's `package.json`, or a future shared `packages/ui`.

## CI

```bash
nx affected -t lint test build --base=origin/main
```

- Use [remote caching](https://nx.dev/docs/features/ci-features/remote-cache) (Nx Cloud or self-hosted) when available.
- Fail CI if module boundary lint fails.
- E2E runs per frontend app (`web-e2e`, `admin-e2e`) on affected projects — see `frontend/testing.md`, `backend/testing.md`.

## Rules

- **NEVER** import from another app's `src/` — use `@stack/*` packages or HTTP.
- **NEVER** bypass Nx project graph with ad-hoc relative imports across `apps/` or `packages/`.
- **NEVER** commit changes to `packages/schemas` without verifying `web`, `admin`, and `server` still build and test.
- **ALWAYS** use `nx affected` locally before opening a PR.
- **ALWAYS** add new shared contracts to `packages/schemas` first, then consume in apps.
- `frontend/` rules apply to **both** `web` and `admin`. `backend/` rules apply to `server`. This file governs workspace structure and cross-project boundaries only.
