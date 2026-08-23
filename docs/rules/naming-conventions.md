# Naming Conventions

Strict naming rules for **all packages** — frontend, backend, shared libraries, and tests. When in doubt, match existing names in the same feature or module.

## Universal (TypeScript)

| Kind | Case | Example |
|---|---|---|
| Variables, functions, methods | `camelCase` | `getUser`, `isActive` |
| Types, interfaces, classes, enums | `PascalCase` | `User`, `CreateUserInput` |
| Constants (module-level immutable) | `SCREAMING_SNAKE_CASE` | `MAX_RETRY_COUNT` |
| Enum members | `PascalCase` | `OrderStatus.Pending` |
| Private class fields | `camelCase` with `#` or `private` | `#cache`, `private logger` |
| Boolean variables | prefix `is`, `has`, `can`, `should` | `isLoading`, `hasAccess` |
| Event handlers (internal) | prefix `handle` | `handleSubmit`, `handleClick` |
| Callback props | prefix `on` | `onSubmit`, `onChange` |
| Async functions | verb-first, no `async` prefix in name | `fetchUser`, not `asyncFetchUser` |

- **NEVER** use abbreviations unless universally known (`id`, `url`, `api`).
- **NEVER** use Hungarian notation or type suffixes (`strName`, `userArray`).
- **NEVER** mix vocabulary for the same concept within a feature (`getUser` vs `fetchUserInfo` — pick one).

## Files & Directories

| Kind | Case | Example |
|---|---|---|
| Directories / feature folders | `kebab-case` | `features/user-profile/` |
| React components | `kebab-case.tsx` | `user-card.tsx` |
| Views (page-level components) | `kebab-case` + `-view` suffix | `users-view.tsx`, `sign-in-view.tsx` |
| Hooks | `kebab-case` + `use-` prefix | `use-user-form.ts` |
| Stores (Zustand) | `kebab-case` + `use-` prefix + `-store` | `use-user-store.ts` |
| Utilities, services, config | `kebab-case.ts` | `define-ability.ts`, `auth-client.ts` |
| Barrel files | `index.ts` | `components/index.ts` |
| Test files | same as source + `.test` or `.spec` | `user.service.spec.ts` |
| E2E tests | `kebab-case.spec.ts` | `login-flow.spec.ts` |

- **NEVER** use `index.tsx` for components — only `index.ts` for barrels.
- **NEVER** mix cases in a single filename (`userCard.tsx`, `User-card.tsx`).

## Frontend (Next.js / React)

### Features

- Feature folder: `kebab-case` matching the domain — `features/users/`, `features/order-items/`.
- Root files inside a feature: `constants.ts`, `types.ts`, `utils.ts` — fixed names, lowercase.

### Components & Views

- Filenames are `kebab-case`. Export names are `PascalCase`.
- Component: `user-card.tsx` → `export function UserCard`.
- View: `users-view.tsx` → `export function UsersView`. Always use `-view` suffix in the filename. Views live in `features/{name}/views/` and are composed by `app/**/page.tsx`.
- Provider: `ability-provider.tsx` → `export function AbilityProvider`.

### Hooks

- Hook name === `use` + `PascalCase` descriptor: file `use-users.ts` → `useUsers`.
- Query hooks: `use` + resource — `useUser`, `useUsers`, `useUserList`.
- Mutation hooks: `use` + verb + resource — `useCreateUser`, `useDeletePost`.
- Form hooks: `use` + feature + `Form` — `useLoginForm`.

### Services (`features/{name}/services/`)

- Fixed filenames: `api.ts`, `keys.ts`, `queries.ts`, `mutations.ts`, `index.ts`.
- Raw fetch functions in `api.ts`: verb + resource — `getUser`, `createUser`, `deletePost`.
- Query key factory in `keys.ts`: resource + `Keys` — `userKeys`, `postKeys`.
- Query key segments: lowercase strings — `"list"`, `"detail"`.

### State (Zustand)

- Store hook: `use` + `Feature` + `Store` — `useUserStore`, `useSidebarStore`.
- Store actions: verb-first — `setTheme`, `openModal`, `resetFilters`.

### Lib & App Router

- Shared utilities in `lib/` — `kebab-case.ts` (`fetcher.ts`, `auth-client.ts`).
- App Router special files: Next.js conventions — `page.tsx`, `layout.tsx`, `loading.tsx`, `error.tsx`.
- Route groups: `(kebab-case)` — `(auth)`, `(dashboard)`.

## Backend (NestJS)

| Kind | Case | Example |
|---|---|---|
| Module | `PascalCase` + `Module` (singular) | `UserModule` |
| Controller | `PascalCase` + `Controller` (singular) | `UserController` |
| Action service | `PascalCase` verb + resource + `Service` | `FindOneUserService` |
| Guard / Interceptor / Pipe | `PascalCase` + kind | `CanUpdateUserGuard` |
| Module file | `kebab-case.module.ts` (singular) | `user.module.ts` |
| Controller file | `kebab-case.controller.ts` (singular) | `user.controller.ts` |
| Action service folder | `{verb}-{resource}/` | `find-one-user/` |
| Action service file | `{verb}-{resource}.service.ts` | `find-one-user/find-one-user.service.ts` |
| Controller spec | colocated beside controller | `user.controller.spec.ts` |
| DTO file | `kebab-case.dto.ts` or verb-based | `create-user.dto.ts` |
| DTO class | `PascalCase` + `Dto` | `CreateUserDto` |

- Feature/module folder: `kebab-case`, **singular** — `user/`, `order-item/`.
- REST route paths: `kebab-case`, plural nouns — `/users`, `/order-items` (route plural, module singular).
- Route handler methods: match HTTP verb intent — `findAll`, `findOne`, `create`, `update`, `remove`.
- Action service method: `execute()` — one public entry point per service.
- Unit test file: colocated in the same folder as source — `find-one-user/find-one-user.service.spec.ts`, `user.controller.spec.ts`.
- Shared infra: `shared/config/`, `shared/prisma/` — not inside feature modules.

## Shared Schemas (Zod)

| Kind | Case | Example |
|---|---|---|
| Schema export | `PascalCase` + `Schema` suffix | `LoginSchema`, `UserSchema` |
| Meta example export | `PascalCase` + `Example` suffix | `CreateUserExample`, `UserExample` |
| Inferred type export | `PascalCase` + `Input` / domain noun | `LoginInput`, `User` |
| Partial/update schemas | verb or context prefix | `UpdateUserSchema`, `UpdateUserInput` |

- Schema, inferred type, and `*Example` export live in the **same file**.
- **NEVER** use `camelCase` for schema names — `LoginSchema`, not `loginSchema`.
- **NEVER** suffix types with `Schema` — `LoginInput`, not `LoginSchemaType`.
- **NEVER** define parallel interfaces for the same shape as a schema.
- **NEVER** ship a request/response schema without a `*Example` meta object. See `api-docs.md`.

## Database

| Kind | Case | Example |
|---|---|---|
| Tables | `snake_case`, singular | `user`, `order_item` |
| Columns | `camelCase` | `createdAt`, `userId` |
| Primary keys | `id` | `id` |
| Foreign keys | `{relatedTable}Id` | `userId`, `orderId` |
| Indexes | `idx_{table}_{column}` | `idx_user_email` |
| Enums (DB) | `snake_case` type, `camelCase` values | `order_status.pending` |

- Table names are **singular** — `user`, not `users`.
- Column names are **camelCase** in the database and in TypeScript entities/DTOs.

## Environment Variables

| Kind | Case | Example |
|---|---|---|
| Server secrets | `SCREAMING_SNAKE_CASE` | `BETTER_AUTH_SECRET` |
| Next.js public vars | `NEXT_PUBLIC_` prefix | `NEXT_PUBLIC_API_URL` |
| NestJS config keys | `SCREAMING_SNAKE_CASE` | `DATABASE_URL` |

- **NEVER** prefix server-only secrets with `NEXT_PUBLIC_`.

## Tests

- Unit/integration: `{source-name}.spec.ts` colocated beside source. Backend: **always** colocated — no `__tests__/`.
- E2E: `e2e/{feature}/{flow}.spec.ts` — `e2e/auth/login-flow.spec.ts`.
- Test description: behavior-driven — `it("should reject invalid email")`, not `it("test 1")`.
- Factory/fixture helpers: `create` + noun — `createUser`, `createMockSession`.

## Imports & Exports

- Path aliases: `@/` for app root (per-app, not workspace-wide). Workspace packages use `@<scope>/{package}` — e.g. `@stack/schemas`. See `monorepo.md`.
- **NEVER** use generic scopes like `@repo/`.
- Named exports by default. Default exports only for Next.js `page.tsx` / `layout.tsx` requirements.
- Barrel re-exports use named exports — `export { UserCard } from "./user-card"`.
