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
      withCredentials: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
    },
  });
}
```

Do **not** add a cookie security scheme or a better-auth `/api/auth/reference` link until an auth module exists. When auth lands, add `.addCookieAuth("better-auth.session_token", …)` and document auth routes via better-auth Open API — not in Nest Swagger.

- Call `setupSwagger(app)` from `main.ts` in **every** environment — development, staging, and production. Do **not** gate on `NODE_ENV` or any other flag.
- Try it out is a live API call. It **must** send the session cookie (`swaggerOptions.withCredentials: true`) and is subject to the same AuthGuard and CASL checks as any other client. Unauthenticated callers cannot execute protected actions. See `security.md`.
- **NEVER** hardcode an absolute server URL in DocumentBuilder (e.g. `http://localhost:9000`). Omit `.addServer()` so Swagger UI "Try it out" uses the origin that served `/api/docs`.
- Nest mounts Swagger outside the global prefix unless `useGlobalPrefix: true`. Docs must live at `/api/docs` and `/api/docs-json`.
- `jsonDocumentUrl` exposes `/api/docs-json` (same spec, machine-readable) for generators and future UIs.
- **NEVER** duplicate Zod shapes in `@ApiProperty()` — schemas flow from `createZodDto`. See `validation.md`.

## Request & Response Meta Examples

**Every request body and every response body must have a root-level `.meta({ example })`** — a complete, realistic JSON object on the Zod schema. That example flows into OpenAPI through `createZodDto`. Do **not** export a separate `*Example` constant from `@saas-kit/schemas`.

### Convention (`@saas-kit/schemas`)

Co-locate schema and inferred type in the same file. Put the example only on `.meta({ example })`:

| Export                 | Purpose       | Naming                    |
| ---------------------- | ------------- | ------------------------- |
| `*Schema`              | Zod schema    | `CreateUserSchema`        |
| `*Input` / domain noun | Inferred type | `CreateUserInput`, `User` |

```ts
// packages/schemas/src/user/user.schema.ts
import { z } from 'zod';

export const CreateUserSchema = z
  .object({
    email: z.string().email().describe("User's login email address"),
    name: z.string().min(1).describe('Display name shown in the UI'),
  })
  .describe('Payload for creating a new user')
  .meta({
    example: { email: 'jane@example.com', name: 'Jane Doe' },
  });

export type CreateUserInput = z.infer<typeof CreateUserSchema>;

export const UserSchema = z
  .object({
    id: z.string().uuid().describe('User UUID'),
    email: z.string().email(),
    name: z.string(),
    createdAt: z.string().datetime(),
  })
  .describe('User resource')
  .meta({
    example: {
      id: '550e8400-e29b-41d4-a716-446655440000',
      email: 'jane@example.com',
      name: 'Jane Doe',
      createdAt: '2026-01-15T10:30:00.000Z',
    },
  });

export type User = z.infer<typeof UserSchema>;
```

### Paginated / list responses

List response examples must include a `meta` object (`page`, `limit`, `total`, `totalPages`) inside `.meta({ example })`:

```ts
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
  .meta({
    example: {
      data: [
        {
          id: '550e8400-e29b-41d4-a716-446655440000',
          email: 'jane@example.com',
          name: 'Jane Doe',
          createdAt: '2026-01-15T10:30:00.000Z',
        },
      ],
      meta: { page: 1, limit: 20, total: 142, totalPages: 8 },
    },
  });
```

### Wiring in controllers

Use the DTO from `createZodDto`. OpenAPI picks up the schema's `.meta({ example })` — do **not** re-declare examples on the controller and do **not** import `*Example` from `@saas-kit/schemas`.

```ts
@Post()
@ApiBody({ type: CreateUserDto })
@ApiCreatedResponse({ type: UserResponseDto })
create(@Body() body: CreateUserDto) { ... }

@Get()
@ApiOkResponse({ type: UserListResponseDto })
findAll() { ... }
```

- Request bodies: `@ApiBody({ type: CreateUserDto })`.
- Success responses: `@ApiOkResponse` / `@ApiCreatedResponse` with `type` DTO only.
- Error responses: document status and description on the controller (`@ApiBadRequestResponse`, `@ApiUnauthorizedResponse`, etc.). Do **not** invent a shared error DTO under `shared/swagger/`.
- **NEVER** export `*Example` constants from `@saas-kit/schemas`.
- **NEVER** duplicate example JSON in controllers.

## Zod Schema Metadata (Shared Package)

Rich docs start in `@saas-kit/schemas`. Every field gets `.describe()`; every schema gets a root `.meta({ example })`:

```ts
// packages/schemas/src/health/health.schema.ts — template for later schemas
export const HealthSchema = z
  .object({
    status: z.literal('ok').describe('Process is accepting HTTP requests'),
  })
  .describe('Health signal that the API process is accepting HTTP')
  .meta({ example: { status: 'ok' } });

export type Health = z.infer<typeof HealthSchema>;
```

- **ALWAYS** attach `.meta({ example })` on the **root** schema object with a complete JSON example.
- **ALWAYS** add `.describe()` on every field and on the root schema.
- **NEVER** export a `*Example` constant from `@saas-kit/schemas` (schema, type, and barrel).
- List/collection responses **ALWAYS** include `meta` (pagination) in the root example.

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

| Auth level        | Decorator              | Documentation requirement                                                                                                                                                |
| ----------------- | ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| Private (default) | — (global `AuthGuard`) | Full docs + `@ApiUnauthorizedResponse` + `@ApiForbiddenResponse` when CASL applies                                                                                       |
| Public            | `@AllowAnonymous()`    | **Same full docs** — `@ApiOperation`, typed response DTO, params/queries. State "No authentication required" in description. Omit `401`/`403` only when truly impossible |
| Optional          | `@OptionalAuth()`      | Full docs for both modes. Document differing response shapes with separate examples if they differ                                                                       |

- **NEVER** give public endpoints a lighter documentation pass — they are often the first integration point for new clients.
- **NEVER** skip `@ApiBody` or typed `@ApiOkResponse` on `@AllowAnonymous()` routes that accept a body or return data.
- `@ApiCookieAuth` on the controller documents the default; `@AllowAnonymous()` routes are still fully described — auth decorators on the class do not excuse sparse method-level docs.

## Controller Documentation Standard

Every endpoint must include the decorators below. Omitting them is incomplete work — **private and public alike**.

### Required per endpoint

| Decorator                                                 | Purpose                                                                            |
| --------------------------------------------------------- | ---------------------------------------------------------------------------------- |
| `@ApiOperation`                                           | `summary` (short) + `description` (behavior, side effects, auth requirements)      |
| `@ApiBody`                                                | Request body via `type` DTO (`createZodDto`) — example comes from schema `.meta()` |
| `@ApiResponse` / `@ApiOkResponse` / `@ApiCreatedResponse` | Success response with `type` DTO — example comes from schema `.meta()`             |
| `@ApiBadRequestResponse`                                  | Validation failures (`400`)                                                        |
| `@ApiUnauthorizedResponse`                                | Missing/invalid session (`401`) — **private endpoints only**                       |
| `@ApiForbiddenResponse`                                   | Insufficient permissions (`403`) — **private endpoints with CASL only**            |
| `@ApiNotFoundResponse`                                    | Resource not found (`404`) — when applicable                                       |
| `@ApiParam` / `@ApiQuery`                                 | Every non-obvious path param and query param                                       |

### Required per controller

| Decorator                                     | Purpose                                              |
| --------------------------------------------- | ---------------------------------------------------- |
| `@ApiTags("{module}")`                        | Singular module name — `user`, `order-item`          |
| `@ApiCookieAuth("better-auth.session_token")` | When routes require session (default — global guard) |

### Auth visibility in docs

| Route type          | Swagger note                                                                                                                                                                       |
| ------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Private (default)   | Full docs + `@ApiUnauthorizedResponse`; add `@ApiForbiddenResponse` when CASL applies                                                                                              |
| `@AllowAnonymous()` | **Full docs required** — typed response DTO, params. State "No authentication required" in `@ApiOperation` description. Skip `401`/`403` unless the endpoint can still return them |
| `@OptionalAuth()`   | Full docs; document both authenticated and anonymous response examples if shapes differ                                                                                            |

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
  })
  @ApiBody({
    type: CreateUserDto,
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
  })
  @ApiBadRequestResponse({ description: 'Invalid query parameters' })
  stats() {
    return this.getUserStats.execute();
  }
}
```

## Error Response Shape

Document a consistent Nest HTTP exception envelope on endpoints that can fail (`statusCode`, `message`, `error`). Keep that schema with the exception filter in the owning module (`shared/observability/filters/`) when one exists — **NEVER** in `shared/swagger/`. **NEVER** `shared/filters/`.

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
- [ ] Success response typed with `createZodDto` DTO (`@ApiOkResponse` / `@ApiCreatedResponse`)
- [ ] All applicable error responses documented (`400`, `401`, `403`, `404`)
- [ ] Request body uses `@ApiBody({ type })` when the endpoint accepts a body
- [ ] List responses include `meta` in the schema root `.meta({ example })` (`page`, `limit`, `total`, `totalPages`)
- [ ] Zod request/response schemas have root `.meta({ example })` — **no** exported `*Example` constant
- [ ] Auth requirement stated (`protected`, `@AllowAnonymous`, `@OptionalAuth`)
- [ ] Error responses documented when the endpoint can return them
- [ ] `/api/docs-json` regenerates without manual schema edits

## Rules

- **NEVER** hand-write OpenAPI schemas that duplicate shared Zod schemas.
- **NEVER** create `shared/docs/`, `shared/swagger/index.ts`, or a separate `swagger.config.ts`. Swagger setup is `shared/swagger/setup-swagger.ts` only.
- **ALWAYS** serve `/api/docs` and `/api/docs-json` in development, staging, and production. Do **not** disable or gate them.
- **ALWAYS** set `swaggerOptions.withCredentials: true` so Try it out sends the session cookie. Protected actions require authentication — see `security.md`.
- **NEVER** hardcode an absolute OpenAPI server URL. Omit `.addServer()` so "Try it out" uses the serving origin.
- **NEVER** document sign-in/sign-up/session endpoints in NestJS Swagger — use `/api/auth/reference`.
- **NEVER** ship an endpoint with only `@ApiTags` — partial docs are not acceptable on any route.
- **NEVER** document private endpoints richly while leaving public endpoints sparse.
- **ALWAYS** update docs when changing request/response shapes, status codes, or auth requirements.
- **ALWAYS** put a complete JSON example on the schema with root `.meta({ example })`.
- **NEVER** export a `*Example` constant from `@saas-kit/schemas`.
- **NEVER** duplicate example JSON on controllers (`content.example`, `@ApiBody({ examples })`).
