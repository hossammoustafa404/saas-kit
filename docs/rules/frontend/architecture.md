# Architecture: Feature-Based

All domain logic lives inside `features/`. The `app/` directory is exclusively for routing, layout composition, and page shells that compose one or more views.

## Directory Structure

```text
app/
├── (routes)/         # Route groups, layouts, loading.tsx, error.tsx
├── globals.css
├── layout.tsx
└── page.tsx          # Thin shell: composes views from features/{name}
features/
├── feature-name/
│   ├── index.ts          # Public API — sole entry point for external imports
│   ├── components/
│   │   ├── index.ts      # Barrel — import from here within the feature
│   │   └── user-card.tsx
│   ├── hooks/
│   │   ├── index.ts
│   │   └── use-feature-form.ts
│   ├── services/
│   │   ├── index.ts      # Re-exports api, keys, queries, mutations
│   │   ├── api.ts
│   │   ├── keys.ts
│   │   ├── queries.ts
│   │   └── mutations.ts
│   ├── store/
│   │   ├── index.ts
│   │   └── use-feature-store.ts
│   ├── views/
│   │   └── users-view.tsx
│   ├── interfaces/
│   │   └── index.ts          # Object-shape interfaces — `{name}.interface.ts`
│   ├── constants.ts
│   ├── types.ts          # Unions, aliases, schema re-exports — not object shapes
│   └── utils.ts
components/ui/        # shadcn/ui components (auto-generated)
lib/
├── index.ts          # Barrel — re-exports public lib utilities
├── auth-client.ts    # better-auth client → NestJS backend
└── fetcher.ts        # axios — privateFetcher / publicFetcher
```

## Enforcement Rules

- **ALWAYS** put feature-level object-shape contracts in `features/{name}/interfaces/{name}.interface.ts` as `interface`. Import from `../interfaces`.
- **NEVER** use `type` for an object shape. `type` is only for unions, intersections, mapped types, function types, and Zod `z.infer`.
- **NEVER** declare feature-level object-shape interfaces in services, hooks, or views. Component-local props interfaces may stay colocated in the component file.
- **ALWAYS** put feature-level `SCREAMING_SNAKE_CASE` constants in `features/{name}/constants.ts`.
- **NEVER** declare `SCREAMING_SNAKE_CASE` constants in components, hooks, views, or services.
- **NEVER** create a `constants/` folder.
- **NEVER** write business logic, data fetching, or state management directly in `app/`.
- **NEVER** create a component in `app/` that could live in `features/`.
- `app/page.tsx` and `app/**/page.tsx` must be thin shells: compose and render views from `features/{name}` only.
- A single page may import views from multiple features when the route needs cross-domain UI.
- `app/layout.tsx` files may only compose shared layouts, providers, and metadata.

## Public API (Strict)

Every feature exposes a controlled surface through `features/{name}/index.ts`. Everything else is internal.

- **NEVER** deep-import across feature boundaries. No `@/features/{other}/components/...`, `@/features/{other}/services/...`, etc.
- **ONLY** import from `features/{name}` (or its path alias) in `app/` and in other features.
- **ONLY** re-export symbols that are intentionally public in `index.ts`. Do not export internal helpers by default.
- Keep private by default: internal components, `api.ts`, `keys.ts`, `utils.ts`, `constants.ts`, `interfaces/`, and store internals stay unexported unless another feature or `app/` genuinely needs them.
- Typical public exports: views and query/mutation hooks needed by `app/` or sibling features.
- Cross-feature communication goes through the other feature's `index.ts`, never its internal files.
- If something is imported from outside the feature, it **must** be added to `index.ts` first — no exceptions.

## Internal API (Folder Barrels)

Each subfolder has an `index.ts` that re-exports its contents. Use these barrels for imports **within** the feature.

- **ALWAYS** import from folder barrels: `@/features/{name}/components`, `@/features/{name}/services`, `@/features/{name}/hooks`, `@/features/{name}/interfaces`, etc.
- Import root files directly: `from "../constants"`, `from "../types"`. Do not duplicate those values in other files.
- **NEVER** import individual files from sibling folders when a barrel exists. Use `from "../components"`, not `from "../components/user-card"`.
- Each folder's `index.ts` re-exports everything that folder shares with the rest of the feature.
- Root `index.ts` composes from folder barrels and root files (`constants.ts`, `types.ts`, etc.) for the public API only.
- **NEVER** import another feature's folder barrels directly. Cross-feature imports go through `features/{other}/index.ts` only.

```ts
// features/users/views/users-view.tsx
import { UserCard } from "../components";
import { useUsers } from "../services";
import type { User } from "../types";

// app/(dashboard)/users/page.tsx — thin shell, may compose multiple views
import { UsersView } from "@/features/users";
import { RecentActivityView } from "@/features/activity";

export default function UsersPage() {
  return (
    <>
      <UsersView />
      <RecentActivityView />
    </>
  );
}

// features/users/index.ts — public subset
export { UsersView } from "./views";
export type { User } from "./types";
```
