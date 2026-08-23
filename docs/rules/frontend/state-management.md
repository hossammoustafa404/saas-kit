# State Management: React Query + Zustand

## React Query (TanStack Query)

- All API calls live in `features/{name}/services/`:
  - `api.ts` — raw fetch functions (no React)
  - `keys.ts` — typed query key factory
  - `queries.ts` — `useQuery` hooks
  - `mutations.ts` — `useMutation` hooks, cache invalidation, and error/toast side effects
- Define query keys as **typed constants** in `keys.ts`:

```ts
const userKeys = {
  all: ["users"] as const,
  detail: (id: string) => [...userKeys.all, id] as const,
  list: (filters: string) => [...userKeys.all, "list", filters] as const,
};
```

- Use `queryClient.prefetchQuery` in Server Components for SSR hydration.
- Keep reads in `queries.ts` and writes in `mutations.ts`. Both import from `api.ts` and `keys.ts`.
- Handle errors in `mutations.ts` with toast notifications via Zustand. Never swallow errors.
- Set `staleTime` and `gcTime` explicitly per feature.
- Do not refetch on the client data already fetched on the server unless interactivity requires it.

## Zustand

- Store files live in `features/{name}/store/` or `lib/stores/` for global UI.
- Use Zustand only for:
  - Global UI state (theme, sidebar, modal open/close)
  - Client-side filters that don't belong in URL
  - Cross-feature ephemeral state
- **NEVER** use Zustand as a cache for server data. React Query owns that.
- Prefer shallow equality for selector hooks to prevent re-renders.
- Actions must be defined in the store, never mutate state directly from components.
