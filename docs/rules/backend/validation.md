# Validation: Zod + nestjs-zod

HTTP input/output validation uses Zod schemas from `@stack/schemas`. **NEVER** duplicate those API contracts in any app.

Process env is **not** an API contract. Server env schemas live in `apps/server/src/shared/config/` only. **NEVER** put `DATABASE_URL`, `BETTER_AUTH_SECRET`, or any other server secret/config schema in `@stack/schemas`. Frontends must not be able to import them.

## Setup

- Install `nestjs-zod` and register `ZodValidationPipe` globally in `main.ts`.
- Import **HTTP** schemas and types from `@stack/schemas` — e.g. `CreateUserSchema`, `CreateUserInput`.
- Import **env** schemas from `shared/config/env.schema.ts` — never from `@stack/schemas`. **NEVER** use `env.ts`.
- **NEVER** use `class-validator` / `class-transformer` DTOs when a shared Zod schema exists.

## DTO Pattern

- For NestJS pipe integration, create DTO classes with `createZodDto(Schema)` when needed:

```ts
// modules/user/dto/create-user.dto.ts
import { createZodDto } from "nestjs-zod";
import { CreateUserSchema } from "@stack/schemas";

export class CreateUserDto extends createZodDto(CreateUserSchema) {}
```

- Prefer importing `CreateUserInput` type directly for service method signatures.
- Re-export DTOs from `dto/index.ts` barrel.

## Validation Rules

- Validate **all** external input: body, query, and route params where non-trivial.
- Use `.safeParse()` in services only when you need custom error handling; prefer pipe-level validation at the controller.
- Output validation: parse service results with response schemas before returning when fields are filtered or transformed.

## OpenAPI Metadata & Meta Examples

Every request and response schema in the shared package **must** export a co-located `*Example` constant and attach it to the root schema via `.openapi({ example })`. See `api-docs.md`.

```ts
export const CreateUserExample = { email: "jane@example.com", name: "Jane Doe" } as const;

export const CreateUserSchema = z
  .object({ email: z.string().email(), name: z.string().min(1) })
  .openapi({ example: CreateUserExample });
```

- Add `.describe()` on every field and on the root schema.
- List responses must include a `meta` object in `*Example` (`page`, `limit`, `total`, `totalPages`).
- Create response DTOs with `createZodDto(ResponseSchema)` for `@ApiOkResponse({ type })`.
- Controllers wire examples via `@ApiBody({ examples })` and `@ApiOkResponse({ content: { example } })` — import `*Example`, never inline JSON.

## Shared Schema Contract

| Schema suffix | Purpose              | Example              |
| ------------- | -------------------- | -------------------- |
| `*Schema`     | Zod schema export    | `CreateUserSchema`   |
| `*Input`      | Inferred request type| `CreateUserInput`    |
| Domain noun   | Inferred response type | `User`           |

- Schema and its inferred type export live in the **same file** in the shared package.
- **NEVER** suffix types with `Schema` — `CreateUserInput`, not `CreateUserSchemaType`.
- **NEVER** define parallel interfaces or class-validator DTOs for the same shape.
