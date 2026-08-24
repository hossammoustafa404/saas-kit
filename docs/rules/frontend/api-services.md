# API & Services

## Service Layer (`features/{name}/services/`)

- All HTTP logic is centralized here. No HTTP calls scattered in components.
- Use `privateFetcher` and `publicFetcher` from `lib/fetcher.ts` — axios instances configured once. See `tech-stack.md`.
- **NEVER** import `axios` outside `lib/fetcher.ts`. **NEVER** use native `fetch`.
- `publicFetcher` — unauthenticated backend endpoints.
- `privateFetcher` — authenticated backend endpoints (forwards session cookies). See `authentication.md`.
- Parse every response with a shared schema. Throw typed errors for React Query to catch.

## Shared Schemas

- Response schemas and their exported types live in the shared schemas package (e.g. `UserSchema`, `User`).
- Request payload types also come from the shared schemas package (e.g. `CreateUserInput`).
- **NEVER** define response schemas or parallel TypeScript interfaces in `features/`.
- Validate responses with `.parse()` / `.safeParse()` before returning data to React Query.

## Example Pattern

```ts
// features/users/services/api.ts
import { privateFetcher } from "@/lib/fetcher";
import { UserSchema, type CreateUserInput, type User } from "@saas-kit/schemas";

export async function getUser(id: string): Promise<User> {
  const { data } = await privateFetcher.get(`/users/${id}`);
  return UserSchema.parse(data);
}

export async function createUser(data: CreateUserInput): Promise<User> {
  const { data } = await privateFetcher.post("/users", data);
  return UserSchema.parse(data);
}
```
