# Next.js App Router Discipline

## Server Components by Default

- **All components are Server Components unless proven otherwise.**
- Use `"use client"` only when you genuinely need:
  - Browser APIs (`window`, `document`, `localStorage`)
  - React hooks (`useState`, `useEffect`, `useContext`)
  - Event handlers (`onClick`, `onSubmit`)
  - React Query hooks (`useQuery`, `useMutation`)
  - react-hook-form hooks (`useForm`, `useFieldArray`, `useWatch`)
- **NEVER** mark a component as a Client Component just to pass props. Lift data fetching up or use Server Components for static props.

## Data Fetching Hierarchy

1. **Server Components first** — initial data via `services/api.ts` or `queryClient.prefetchQuery`.
2. **React Query second** — interactive reads/writes in Client Components. See `state-management.md`.
3. **Zustand third** — global UI state only. See `state-management.md`.

## No Server Actions

This stack talks to a **separate NestJS backend**. Do not use Server Actions for standard CRUD.

- **NEVER** use `<form action={serverAction}>` or `"use server"` for reads, writes, or form submission.
- Use React Query mutations and better-auth client instead. See `state-management.md`, `forms-validation.md`, and `authentication.md`.

## Hydration & Boundaries

- Place the `"use client"` boundary as low in the tree as possible.
- Pass serializable props (plain objects, arrays, strings) from Server to Client Components. Never pass functions or class instances.
- Use `React.Suspense` + `loading.tsx` for streaming boundaries.
- Avoid `useEffect` + `useState` loading patterns in Server Components.
