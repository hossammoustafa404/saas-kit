# Authorization: CASL

Authorization controls **what** an authenticated user can do. Use **`@casl/ability`** and **`@casl/react`** for frontend permission checks. See `security.md` for enforcement boundaries.

## Directory Structure

```text
features/
└── auth/
    ├── ability/
    │   ├── index.ts            # Barrel — AbilityProvider, Can, useAppAbility
    │   ├── define-ability.ts   # Builds Ability from user permissions
    │   └── types.ts            # AppAbility, Actions, Subjects
    └── providers/
        └── AbilityProvider.tsx
```

Export the provider and hooks from `features/auth/index.ts`.

## Ability Definition

- Define `Actions` and `Subjects` types in `features/auth/ability/types.ts`.
- Build abilities in `define-ability.ts` using `AbilityBuilder` from `@casl/ability`.
- Create a factory (e.g. `defineAbilityFor(user)`) from the user's permissions payload.
- Permissions come from the backend — **never** hardcode roles in components.

## Provider & Hooks

- Wrap the app (or authenticated layout) with a Client Component `AbilityProvider`.
- Export a typed `useAppAbility` hook wrapping `useAbility` from `@casl/react`.
- Re-export `Can` from the ability barrel for consistent imports.

## Usage in Components

```tsx
"use client";

import { Can, useAppAbility } from "../ability";

<Can I="update" a="Post">
  <EditButton />
</Can>

const ability = useAppAbility();
if (ability.can("delete", "Post")) { /* ... */ }
```

- Permission-dependent components are **Client Components**.

## Syncing with Session

- Update the ability on sign-in, sign-out, or session change via `ability.update(rules)`.
- On logout, reset to a guest ability.
- Prefer `packRules` / `unpackRules` from `@casl/ability/extra` when transferring rules from the backend.
- Resolve the session first (`authentication.md`), then build the ability.

## Rules

- **NEVER** define permission rules inline in components. Centralize in `define-ability.ts`.
- **NEVER** hide sensitive actions only with CSS. Remove unauthorized UI with `Can` or conditional rendering.
- Use `ability.rules` (not the ability object reference) as a dependency when memoizing permission-derived data.
