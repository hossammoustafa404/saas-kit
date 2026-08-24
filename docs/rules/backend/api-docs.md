# API Documentation: Swagger + Better Auth Open API

Documentation is a **first-class deliverable**. **Every endpoint** — private (authenticated) and public (`@AllowAnonymous()`) — must be fully described with the same richness: operation details, typed request/response bodies, meta examples, params, and applicable error codes. Auth level changes which error responses apply, not how thoroughly the endpoint is documented.

API docs are split into two sources:

| Source         | Technology                       | URL (default)                  | Covers                        |
| -------------- | -------------------------------- | ------------------------------ | ----------------------------- |
| Application    | `@nestjs/swagger` + `nestjs-zod` | `/api/docs` + `/api/docs-json` | Feature module REST endpoints |
| Authentication | better-auth `openAPI()` plugin   | `/api/auth/reference`          | Auth routes, plugins, models  |

See [Better Auth Open API plugin](https://better-auth.com/docs/plugins/open-api).

## Directory Structure

```text
src/
├── shared/
│   └── swagger/
│       └── setup-swagger.ts        # DocumentBuilder + cleanupOpenApiDoc + SwaggerModule.setup
└── modules/
    ├── auth/
    │   └── lib/
    │       └── auth.ts             # betterAuth({ plugins: [openAPI()] })
    └── user/
        ├── user.controller.ts
        └── dto/
            ├── create-user.dto.ts  # createZodDto(CreateUserSchema)
            └── user-response.dto.ts # createZodDto(UserSchema) — for @ApiOkResponse
```

- **ALWAYS** keep Swagger setup in `shared/swagger/setup-swagger.ts`.
- **NEVER** create `shared/docs/`.
- **NEVER** create `shared/swagger/index.ts`.
- **NEVER** split DocumentBuilder into `swagger.config.ts` or any second file.
- **NEVER** put error envelopes, Scalar, or other documentation products in `shared/swagger/`.
- Import `setupSwagger` from `shared/swagger/setup-swagger` in `main.ts` — nowhere else.

## Global Swagger Setup

**`shared/swagger/setup-swagger.ts`** — DocumentBuilder metadata and `SwaggerModule.setup` in the same file:

```ts
import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('SaaS Kit API')
    .setDescription(
      'REST API for application resources. Health is a process-up signal only.',
    )
    .setVersion('1.0')
    .addServer('http://localhost:9000', 'Local')
    .addTag(
      'health',
      'Health signal that the API process is accepting HTTP. Does not report whether PostgreSQL or other dependencies are reachable.',
    )
    .build();

  const document = SwaggerModule.createDocument(app, config, {
    operationIdFactory: (controllerKey, methodKey) =>
      `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
  });

  SwaggerModule.setup('docs', app, cleanupOpenApiDoc(document), {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
    },
  });
}
```

Do **not** add a cookie security scheme or a better-auth `/api/auth/reference` link until an auth module exists. When auth lands, add `.addCookieAuth("better-auth.session_token", …)` and document auth routes via better-auth Open API — not in Nest Swagger.

- Call `setupSwagger(app)` from `main.ts` in **every** environment — development, staging, and production. Do **not** gate on `NODE_ENV` or any other flag. See `security.md`.
- Nest mounts Swagger outside the global prefix unless `useGlobalPrefix: true`. Docs must live at `/api/docs` and `/api/docs-json`.
- `jsonDocumentUrl` exposes `/api/docs-json` (same spec, machine-readable) for generators and future UIs.
- **NEVER** duplicate Zod shapes in `@ApiProperty()` — schemas flow from `createZodDto`. See `validation.md`.

## Request & Response Meta Examples

**Every request body and every response body must have a root-level meta example** — a complete, realistic JSON object exported alongside the schema. Field-level `.meta({ example })` alone is not sufficient.

### Convention (`@saas-kit/schemas`)

Co-locate schema, types, and examples in the same file:

| Export                 | Purpose                | Naming                             |
| ---------------------- | ---------------------- | ---------------------------------- |
| `*Schema`              | Zod schema             | `CreateUserSchema`                 |
| `*Input` / domain noun | Inferred type          | `CreateUserInput`, `User`          |
| `*Example`             | Full JSON meta example | `CreateUserExample`, `UserExample` |

```ts
// packages/schemas/src/user/user.schema.ts
import { z } from 'zod';

// 1. Define meta example first (used by schema + controllers)
export const CreateUserExample = {
  email: 'jane@example.com',
  name: 'Jane Doe',
} as const;

// 2. Schema with field descriptions + root example
export const CreateUserSchema = z
  .object({
    email: z
      .string()
      .email()
      .describe("User's login email address")
      .meta({ example: CreateUserExample.email }),
    name: z
      .string()
      .min(1)
      .describe('Display name shown in the UI')
      .meta({ example: CreateUserExample.name }),
  })
  .describe('Payload for creating a new user')
  .meta({ example: CreateUserExample });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UserExample = {
  id: '550e8400-e29b-41d4-a716-446655440000',
  email: 'jane@example.com',
  name: 'Jane Doe',
  createdAt: '2026-01-15T10:30:00.000Z',
} as const;

export const UserSchema = z
  .object({
    id: z.string().uuid().describe('User UUID'),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.string().datetime(),
  })
  .describe('User resource')
  .meta({ example: UserExample });

export type User = z.infer<typeof UserSchema>;
```

### Paginated / list responses

List responses must include a `meta` object in the example:

```ts
export const UserListExample = {
  data: [UserExample],
  meta: {
    page: 1,
    limit: 20,
    total: 142,
    totalPages: 8,
  },
} as const;

export const UserListSchema = z
  .object({
    data: z.array(UserSchema),
    meta: z.object({
      page: z.number().int().positive(),
      limit: z.number().int().positive(),
      total: z.number().int().nonnegative(),
      totalPages: z.number().int().nonnegative(),
    }),
  })
  .meta({ example: UserListExample });
```

### Wiring in controllers

Reference the shared example in Swagger decorators — **import from `@saas-kit/schemas`, never inline**:

```ts
import {
  CreateUserExample,
  UserExample,
  UserListExample,
} from "@saas-kit/schemas";

@Post()
@ApiBody({ type: CreateUserDto, examples: { default: { value: CreateUserExample } } })
@ApiCreatedResponse({
  type: UserResponseDto,
  content: { "application/json": { example: UserExample } },
})
create(@Body() body: CreateUserDto) { ... }

@Get()
@ApiOkResponse({
  type: UserListResponseDto,
  content: { "application/json": { example: UserListExample } },
})
findAll() { ... }
```

- Request bodies: `@ApiBody` with `examples.default.value` from `*Example`.
- Success responses: `@ApiOkResponse` / `@ApiCreatedResponse` with `content["application/json"].example`.
- Error responses: document status and description on the controller (`@ApiBadRequestResponse`, `@ApiUnauthorizedResponse`, etc.). Do **not** invent a shared error DTO under `shared/swagger/`.
- **NEVER** inline example JSON in controllers — single source of truth is the shared package.

## Zod Schema Metadata (Shared Package)

Rich docs start in `@saas-kit/schemas`. Every field gets `.describe()`; every schema gets a root `.meta({ example: *Example })`:

```ts
// packages/schemas/src/user/user.schema.ts — see "Request & Response Meta Examples" above for full pattern
export const CreateUserExample = {
  email: 'jane@example.com',
  name: 'Jane Doe',
} as const;

export const CreateUserSchema = z
  .object({
    email: z.string().email().describe("User's login email address"),
    name: z.string().min(1).describe('Display name shown in the UI'),
  })
  .meta({ example: CreateUserExample });
```

- **ALWAYS** export a `*Example` constant for every request and response schema.
- **ALWAYS** attach `.meta({ example: *Example })` on the **root** schema object.
- **ALWAYS** add `.describe()` on every field and on the root schema.
- List/collection responses **ALWAYS** include `meta` (pagination) in the example.

## DTOs for Swagger

Create DTO classes from shared schemas — one per request/response shape:

```ts
// modules/user/dto/create-user.dto.ts
import { createZodDto } from 'nestjs-zod';
import { CreateUserSchema } from '@saas-kit/schemas';
export class CreateUserDto extends createZodDto(CreateUserSchema) {}

// modules/user/dto/user-response.dto.ts
import { createZodDto } from 'nestjs-zod';
import { UserSchema } from '@saas-kit/schemas';
export class UserResponseDto extends createZodDto(UserSchema) {}
```

Re-export from `dto/index.ts`. Use response DTOs in `@ApiOkResponse({ type: UserResponseDto })`.

## Private & Public Endpoints — Same Standard

Rich documentation applies **equally** to all routes regardless of auth:

| Auth level        | Decorator              | Documentation requirement                                                                                                                                                        |
| ----------------- | ---------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Private (default) | — (global `AuthGuard`) | Full docs + `@ApiUnauthorizedResponse` + `@ApiForbiddenResponse` when CASL applies                                                                                               |
| Public            | `@AllowAnonymous()`    | **Same full docs** — `@ApiOperation`, typed response, `*Example`, params/queries. State "No authentication required" in description. Omit `401`/`403` only when truly impossible |
| Optional          | `@OptionalAuth()`      | Full docs for both modes. Document differing response shapes with separate examples if they differ                                                                               |

- **NEVER** give public endpoints a lighter documentation pass — they are often the first integration point for new clients.
- **NEVER** skip `@ApiBody`, `*Example`, or typed `@ApiOkResponse` on `@AllowAnonymous()` routes that accept a body or return data.
- `@ApiCookieAuth` on the controller documents the default; `@AllowAnonymous()` routes are still fully described — auth decorators on the class do not excuse sparse method-level docs.

## Controller Documentation Standard

Every endpoint must include the decorators below. Omitting them is incomplete work — **private and public alike**.

### Required per endpoint

| Decorator                                                 | Purpose                                                                           |
| --------------------------------------------------------- | --------------------------------------------------------------------------------- |
| `@ApiOperation`                                           | `summary` (short) + `description` (behavior, side effects, auth requirements)     |
| `@ApiBody`                                                | Request body with `examples.default.value` from shared `*Example`                 |
| `@ApiResponse` / `@ApiOkResponse` / `@ApiCreatedResponse` | Success response with `type` DTO **and** `content.example` from shared `*Example` |
| `@ApiBadRequestResponse`                                  | Validation failures (`400`)                                                       |
| `@ApiUnauthorizedResponse`                                | Missing/invalid session (`401`) — **private endpoints only**                      |
| `@ApiForbiddenResponse`                                   | Insufficient permissions (`403`) — **private endpoints with CASL only**           |
| `@ApiNotFoundResponse`                                    | Resource not found (`404`) — when applicable                                      |
| `@ApiParam` / `@ApiQuery`                                 | Every non-obvious path param and query param                                      |

### Required per controller

| Decorator                                     | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `@ApiTags("{module}")`                        | Singular module name — `user`, `order-item`          |
| `@ApiCookieAuth("better-auth.session_token")` | When routes require session (default — global guard) |

### Auth visibility in docs

| Route type          | Swagger note                                                                                                                                                                               |
| ------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Private (default)   | Full docs + `@ApiUnauthorizedResponse`; add `@ApiForbiddenResponse` when CASL applies                                                                                                      |
| `@AllowAnonymous()` | **Full docs required** — typed response, `*Example`, params. State "No authentication required" in `@ApiOperation` description. Skip `401`/`403` unless the endpoint can still return them |
| `@OptionalAuth()`   | Full docs; document both authenticated and anonymous response examples if shapes differ                                                                                                    |

### Full example

```ts
import {
  ApiTags,
  ApiOperation,
  ApiBody,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiBadRequestResponse,
  ApiUnauthorizedResponse,
  ApiForbiddenResponse,
  ApiNotFoundResponse,
  ApiParam,
  ApiCookieAuth,
} from '@nestjs/swagger';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import {
  CreateUserExample,
  UserExample,
  UserStatsExample,
} from '@saas-kit/schemas';
import { CreateUserDto, UserResponseDto, UserStatsResponseDto } from './dto';

@ApiTags('user')
@ApiCookieAuth('better-auth.session_token')
@Controller('users')
export class UserController {
  @Get(':id')
  @ApiOperation({
    summary: 'Get user by ID',
    description:
      'Returns a single user by UUID. Requires an authenticated session. ' +
      'Returns 403 if the caller lacks read permission on this user.',
  })
  @ApiParam({
    name: 'id',
    description: 'User UUID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @ApiOkResponse({
    type: UserResponseDto,
    description: 'User found',
    content: { 'application/json': { example: UserExample } },
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  @ApiNotFoundResponse({ description: 'User does not exist' })
  findOne(@Param('id') id: string) {
    return this.findOneUser.execute(id);
  }

  @Post()
  @ApiOperation({
    summary: 'Create user',
    description:
      'Creates a new user account. Returns the created user with 201 status.',
  })
  @ApiCreatedResponse({
    type: UserResponseDto,
    description: 'User created successfully',
    content: { 'application/json': { example: UserExample } },
  })
  @ApiBody({
    type: CreateUserDto,
    examples: { default: { value: CreateUserExample } },
  })
  @ApiBadRequestResponse({
    description: 'Invalid request body — see validation errors',
  })
  @ApiUnauthorizedResponse({ description: 'No valid session' })
  @ApiForbiddenResponse({ description: 'Insufficient permissions' })
  create(@Body() body: CreateUserDto) {
    return this.createUser.execute(body);
  }

  @Get('public/stats')
  @AllowAnonymous()
  @ApiOperation({
    summary: 'Public user statistics',
    description:
      'No authentication required. Returns aggregate user counts only — no PII. ' +
      'Safe to call from unauthenticated clients and health dashboards.',
  })
  @ApiOkResponse({
    type: UserStatsResponseDto,
    description: 'Aggregate statistics',
    content: { 'application/json': { example: UserStatsExample } },
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  stats() {
    return this.getUserStats.execute();
  }
}
```

## Error Response Shape

Document a consistent Nest HTTP exception envelope on endpoints that can fail (`statusCode`, `message`, `error`). Keep that schema with the exception filter when one exists — **NEVER** in `shared/swagger/`.

## Query Params & Pagination

Document list endpoints fully:

```ts
@ApiQuery({ name: "page", required: false, type: Number, description: "Page number (1-based)", example: 1 })
@ApiQuery({ name: "limit", required: false, type: Number, description: "Items per page (max 100)", example: 20 })
@ApiQuery({ name: "search", required: false, type: String, description: "Filter by name or email" })
@ApiOkResponse({ type: UserListResponseDto, description: "Paginated user list" })
findAll(@Query() query: ListUsersDto) { ... }
```

- Pagination, sorting, and filter params each get `@ApiQuery` with description and example.
- Create `ListUsersSchema` / `ListUsersDto` in the shared package for complex query validation.

## Better Auth Open API

Configure in `modules/auth/lib/auth.ts`:

```ts
import { betterAuth } from 'better-auth';
import { openAPI } from 'better-auth/plugins';

export const auth = betterAuth({
  basePath: '/api/auth',
  trustedOrigins: [process.env.CLIENT_URL!],
  plugins: [
    openAPI({
      // path defaults to /reference — served at /api/auth/reference
      // theme: "default",
      // disableDefaultReference: false,
    }),
  ],
});
```

| Resource                | URL                                      |
| ----------------------- | ---------------------------------------- |
| Scalar UI (interactive) | `/api/auth/reference`                    |
| OpenAPI JSON            | `/api/auth/open-api/generate-schema`     |
| Programmatic            | `await auth.api.generateOpenAPISchema()` |

- Endpoints grouped by plugin name; core routes under `Default`, models under `Models`.
- Adding a better-auth plugin (admin, organization, etc.) auto-updates the auth reference.
- **NEVER** document auth routes in NestJS Swagger — better-auth owns them.
- Link to `/api/auth/reference` from the main Swagger description so clients find auth docs.

## Unified Documentation (Scalar)

Combine app + auth docs in one Scalar UI with multiple sources:

```ts
// optional — not in shared/swagger/
import { apiReference } from '@scalar/nestjs-api-reference';

app.use(
  '/reference',
  apiReference({
    pageTitle: 'API Reference',
    sources: [
      { url: '/api/docs-json', title: 'Application API' },
      {
        url: '/api/auth/open-api/generate-schema',
        title: 'Authentication API',
      },
    ],
  }),
);
```

- Application source: NestJS Swagger JSON at `/api/docs-json`.
- Auth source: better-auth generated schema.
- When using Scalar, set `disableDefaultReference: true` on the `openAPI()` plugin if you want a single entry point.

## Endpoint Checklist

Before marking an endpoint complete (applies to **private and public** routes):

- [ ] `@ApiOperation` with summary **and** description
- [ ] Success response typed with `createZodDto` response DTO
- [ ] All applicable error responses documented (`400`, `401`, `403`, `404`)
- [ ] Request body has `@ApiBody` with shared `*Example` as `examples.default.value`
- [ ] Success response has `content["application/json"].example` from shared `*Example`
- [ ] List responses include `meta` in the example (`page`, `limit`, `total`, `totalPages`)
- [ ] Zod schemas export `*Example` with root `.meta({ example })` on every request/response schema
- [ ] Auth requirement stated (`protected`, `@AllowAnonymous`, `@OptionalAuth`)
- [ ] Error responses documented when the endpoint can return them
- [ ] `/api/docs-json` regenerates without manual schema edits

## Rules

- **NEVER** hand-write OpenAPI schemas that duplicate shared Zod schemas.
- **NEVER** create `shared/docs/`, `shared/swagger/index.ts`, or a separate `swagger.config.ts`. Swagger setup is `shared/swagger/setup-swagger.ts` only.
- **ALWAYS** serve `/api/docs` and `/api/docs-json` in development, staging, and production. Do **not** disable or gate them.
- **NEVER** document sign-in/sign-up/session endpoints in NestJS Swagger — use `/api/auth/reference`.
- **NEVER** ship an endpoint with only `@ApiTags` — partial docs are not acceptable on any route.
- **NEVER** document private endpoints richly while leaving public endpoints sparse.
- **ALWAYS** update docs when changing request/response shapes, status codes, or auth requirements.
- **NEVER** ship a request or response schema without an exported `*Example` meta object.
- **NEVER** inline example JSON in controllers — import `*Example` from `@saas-kit/schemas`.
