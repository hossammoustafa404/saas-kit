# Architecture: Feature-Based Modules

`src/` has two top-level areas: **`modules/`** (domain features) and **`shared/`** (cross-cutting infrastructure). App bootstrap lives at `src/` root only.

## Directory Structure

```text
src/
├── main.ts
├── app.module.ts
├── shared/
│   ├── config/                   # Env Zod schema + ConfigModule — not @saas-kit/schemas
│   │   ├── env.schema.ts         # DATABASE_URL, PORT, secrets — server-only; no spec
│   │   └── config.module.ts
│   ├── prisma/
│   │   ├── prisma.module.ts
│   │   └── prisma.service.ts
│   ├── observability/
│   │   ├── observability.module.ts
│   │   ├── observability.constants.ts    # NEVER constants.ts
│   │   ├── lib/
│   │   │   ├── otel.ts                   # NodeSDK start before Nest
│   │   │   └── app-logger.ts             # LoggerService (JSON stdout + OTLP)
│   │   ├── services/                     # One folder per service
│   │   │   ├── index.ts
│   │   │   ├── observability/
│   │   │   │   └── observability.service.ts
│   │   │   └── posthog/
│   │   │       └── posthog.service.ts    # capture() — never throws
│   │   ├── middlewares/                  # Incoming HTTP request logs
│   │   │   ├── index.ts
│   │   │   └── http-observability.middleware.ts
│   │   ├── interceptors/                 # Success HTTP response logs
│   │   │   ├── index.ts
│   │   │   └── http-observability.interceptor.ts
│   │   ├── filters/                      # Thrown 4xx/5xx HTTP logs
│   │   │   ├── index.ts
│   │   │   └── http-observability.filter.ts
│   │   ├── enums/
│   │   │   ├── index.ts
│   │   │   └── log-level.enum.ts
│   │   └── interfaces/                   # NEVER types.ts — one file per interface
│   │       ├── index.ts
│   │       └── http-outcome-request.interface.ts
│   ├── queue/
│   │   ├── queue.module.ts
│   │   ├── queue.constants.ts
│   │   └── bull-board-auth.middleware.ts
│   ├── mail/
│   │   ├── mail.module.ts
│   │   ├── mail.constants.ts
│   │   ├── send-mail.processor.ts
│   │   └── interfaces/
│   │       └── mail-job.interface.ts
│   ├── swagger/
│   │   └── setup-swagger.ts      # DocumentBuilder + SwaggerModule.setup
│   └── pipes/                    # Global pipes with no owning module (if not registered in main.ts)
└── modules/
    └── user/                     # Singular domain name
        ├── index.ts              # Public API — sole entry for external imports
        ├── user.module.ts
        ├── user.controller.ts
        ├── user.controller.spec.ts
        ├── user.constants.ts     # NEVER constants.ts
        ├── guards/                 # Module-scoped guards
        │   └── index.ts
        ├── decorators/           # Module-scoped decorators
        │   └── index.ts
        ├── dto/
        │   └── index.ts
        ├── interfaces/           # Internal shapes — not HTTP Zod contracts
        │   ├── index.ts
        │   └── {name}.interface.ts
        ├── enums/                  # Module-scoped enums — `{name}.enum.ts`
        │   └── index.ts
        └── services/               # One folder per action
            ├── index.ts            # Barrel — re-exports all action services
            ├── find-one-user/
            │   ├── find-one-user.service.ts
            │   └── find-one-user.service.spec.ts
            └── create-user/
                ├── create-user.service.ts
                └── create-user.service.spec.ts
```

## Enforcement Rules

- **ALWAYS** put module-level object-shape contracts in `modules/{name}/interfaces/{name}.interface.ts` as `interface` (barrel `interfaces/index.ts`). Shared infra object shapes live in `shared/{area}/interfaces/{name}.interface.ts` — import the concrete file, no `shared/` barrels.
- **ALWAYS** put module-level enums in `modules/{name}/enums/{name}.enum.ts` (barrel `enums/index.ts`). Shared infra enums live in `shared/{area}/enums/{name}.enum.ts` — import the concrete file, no `shared/` barrels.
- **NEVER** declare an `enum` in a service, controller, hook, or other implementation file.
- **NEVER** declare object-shape `type` aliases or interfaces in services, controllers, hooks, or other implementation files.
- **NEVER** declare file-level helper functions beside a class. Helpers that exist only to serve that class are `private` methods on it. Spec files may keep local factories. Files that export only functions (no class) may keep file-level helpers. See `clean-code.md`, `nestjs.md`.
- **NEVER** use `type` for an object shape. `type` is only for unions, intersections, mapped types, function types, and Zod `z.infer`.
- **NEVER** put HTTP contracts in `interfaces/` — those stay in `@saas-kit/schemas` and module `dto/`. **NEVER** define a parallel interface for a Zod schema.
- **ALWAYS** put module-level `SCREAMING_SNAKE_CASE` constants in `modules/{name}/{name}.constants.ts`. Shared infra constants live in `shared/{area}/{area}.constants.ts`. **NEVER** a bare `constants.ts` on the server.
- **NEVER** declare `SCREAMING_SNAKE_CASE` constants in services, controllers, hooks, or other implementation files.
- **NEVER** create a `constants/` folder. **NEVER** put domain constants in `shared/`.
- **NEVER** put business logic in `main.ts` or `app.module.ts` beyond wiring.
- **NEVER** access Prisma directly from controllers. Controllers delegate to action services.
- **NEVER** create an `entities/` folder — use Prisma types and shared Zod schemas.
- Each feature is a self-contained NestJS module with controller, action services, DTOs, and scoped guards/decorators.
- Register feature modules in `app.module.ts` — do not nest feature modules inside each other unless there is a genuine parent/child domain relationship.
- Infrastructure used by multiple modules (`prisma`, `config`, `observability`, `queue`, `mail`) lives in `shared/` — not inside feature modules.
- Shared infra is named after the folder: `ObservabilityModule` + `observability.constants.ts`. When a shared area owns more than one service, each lives in `services/{name}/` (`ObservabilityService`, `PosthogService`). A single-service area stays next to the module (`PrismaService`). Do not invent a verb-resource service (`LogHttpOutcomeService`) for shared infra.
- Middleware, filters, and interceptors live **inside the module that owns the concern** (`shared/observability/middlewares/`, `shared/observability/interceptors/`, `shared/observability/filters/`, or `modules/{name}/filters/` when the concern is a feature). Register globals with `APP_FILTER` / `APP_INTERCEPTOR` in that module's `providers`. Register global middleware via `NestModule.configure` in that module — never `app.use()` in `main.ts`.
- HTTP logs: `logIncomingReq` writes incoming `Incoming Request: METHOD /path`. `logOutcomingRes` writes `Outcoming Response: METHOD /path 200 OK` (or 4xx/5xx at the same prefix). Warn includes the exception message; error includes the message and a `stack` field. Incoming middleware is registered with `NestModule.configure` and excludes `/api/auth`. Better-auth incoming and outgoing logs come from `httpObservabilityPlugin` `hooks.before` / `hooks.after` in `modules/auth/plugins/` — those routes never enter the Nest middleware, interceptor, or filter. The filter logs the already-written status when headers are sent, then marks 5xx spans Error. **NEVER** return 4xx/5xx from a Nest handler by setting status and returning a body. **NEVER** an Express `finish` listener. See `controllers.md`.
- **NEVER** `shared/filters/`, `shared/interceptors/`, or `shared/middlewares/` as a dumping ground. **NEVER** `new` a module-owned filter, interceptor, or middleware in `main.ts`.
- Constants: `{module}.constants.ts` at the module root. **NEVER** `constants.ts`.
- Internal interfaces: `interfaces/{name}.interface.ts` — **one exported interface per file**. Re-export from `interfaces/index.ts`. **NEVER** `types.ts`. **NEVER** put several interfaces in one file. HTTP contracts stay in `@saas-kit/schemas`, not here.
- **NEVER** apply frontend feature root files (`constants.ts`, `types.ts`) to `apps/server`.
- **NEVER** create `shared/index.ts` or `shared/swagger/index.ts`. Import from the concrete file (`shared/config/config.module`, `shared/prisma/prisma.module`, `shared/observability/observability.module`, `shared/queue/queue.module`, `shared/mail/mail.module`, `shared/swagger/setup-swagger`, `shared/config/env.schema`). Feature-module barrels (`modules/{name}/index.ts`) and folder barrels (`interfaces/index.ts`, `services/index.ts`) stay required.
- **NEVER** create `shared/docs/`. Swagger lives in `shared/swagger/setup-swagger.ts` only — DocumentBuilder metadata stays in that file. **NEVER** split a `swagger.config.ts`. **NEVER** put error envelopes, Scalar, or other docs products in `shared/swagger/`.
- **NEVER** export env schemas from `@saas-kit/schemas`. Server process config stays in `shared/config/`. HTTP contracts stay in `@saas-kit/schemas`.

## Action Services (One Folder Per Action)

- This section applies to **feature modules** under `modules/` only. Shared infra with one service keeps `{area}.service.ts` next to the module (`shared/prisma/prisma.service.ts`). Observability owns more than one service under `services/{name}/` (`ObservabilityService`, `PosthogService`) — still named after the capability, not verb-resource.
- **NEVER** create a monolithic `{domain}.service.ts` with all CRUD methods inside a feature module.
- Each use case gets its own folder under `services/` containing the service and its spec.
- Folder name: `{verb}-{resource}/` — `find-one-user/`, `create-user/`.
- Service file: `{verb}-{resource}.service.ts` inside the folder.
- Spec file: `{verb}-{resource}.service.spec.ts` colocated in the same folder.
- Class name: `PascalCase` verb + resource + `Service` — `FindOneUserService`.
- Re-export action services from `services/index.ts`. Controllers import from the barrel only.

```ts
// modules/user/user.controller.ts
import { FindOneUserService, CreateUserService } from './services';

@Controller('users')
export class UserController {
  constructor(
    private readonly findOneUser: FindOneUserService,
    private readonly createUser: CreateUserService,
  ) {}

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.findOneUser.execute(id);
  }

  @Post()
  create(@Body() body: CreateUserInput) {
    return this.createUser.execute(body);
  }
}
```

## Controller Tests

- Colocate the controller spec beside the controller: `user.controller.spec.ts` next to `user.controller.ts`.
- Test routing, delegation to action services, and HTTP status codes — not business logic (that belongs in action service specs).

## Module-Scoped Guards, Filters, Interceptors & Middleware

- Guards and decorators used **only within a module** live in that module's `guards/` and `decorators/` folders.
- Middleware, filters, and interceptors used by a module (including app-wide ones it owns) live in that module's `middlewares/`, `filters/`, and `interceptors/` folders — `shared/observability/middlewares/http-observability.middleware.ts`, not `shared/middlewares/`.
- Observability HTTP logging: middleware for Nest incoming (`Incoming Request: METHOD /path`); interceptor for Nest success and `APP_FILTER` for thrown warn/error (`Outcoming Response: METHOD /path 200 OK` / `Outcoming Response: METHOD /path 401 Unauthorized`); `httpObservabilityPlugin` `hooks.before` / `hooks.after` for better-auth (those routes never enter the Nest router). Incoming middleware is registered with `NestModule.configure` and excludes `/api/auth`. If Nest throws after the response was already written, the filter logs that status, not the Nest 404. Middleware runs before guards, so AuthGuard rejections still get an incoming log. No Express `finish` listener.
- **NEVER** put an observability (or any other owned) middleware/filter/interceptor in a top-level `shared/middlewares/`, `shared/filters/`, or `shared/interceptors/` folder.
- Register module-owned global filters and interceptors via `APP_FILTER` / `APP_INTERCEPTOR` in the module `providers` array. Register module-owned global middleware via `NestModule.configure`.
- Auth guards and session decorators come from `@thallesp/nestjs-better-auth` — do not reimplement. See `authentication.md`.
- Register module-scoped guards in the module's `providers` and apply via `@UseGuards()` or module-level setup.

## Module-Scoped Interfaces

- Object-shape contracts used **only within a module** live in `interfaces/` — `{name}.interface.ts`, re-exported from `interfaces/index.ts`.
- **ALWAYS** use `interface`, never `type Foo = { ... }`.
- Import from the folder barrel within the module: `from "../../interfaces"`, not `from "../../interfaces/create-auth-options.interface"`.
- HTTP request/response shapes stay in `@saas-kit/schemas` and `dto/`. Do not duplicate them as interfaces.

## Module-Scoped Enums

- Enums used **only within a module** live in `enums/` — `{name}.enum.ts`, re-exported from `enums/index.ts`.
- **ALWAYS** use `enum`, never a string-union `type` for a closed set of named values (`UserRole`, not `type UserRole = 'superadmin' | 'customer'`).
- Import from the folder barrel within the module: `from "../../enums"`, not `from "../../enums/user-role.enum"`.
- **NEVER** declare an `enum` in a service, controller, hook, or other implementation file.
- Cross-module consumers import public enums from `modules/{name}` or that module's `enums` barrel — **NEVER** a single `{name}.enum.ts` file across boundaries.

## Public API (Strict)

Every feature exposes a controlled surface through `modules/{name}/index.ts`. Everything else is internal.

- **NEVER** deep-import across module boundaries. No `@/modules/user/services/find-one-user/find-one-user.service` from another module.
- **ONLY** import from `modules/{name}` when one module needs another's public API.
- **ONLY** export symbols intentionally public in `index.ts` — typically the module class.
- Cross-module communication goes through the other module's `index.ts` or NestJS DI (inject an exported service), never via direct file imports.

## Layer Responsibilities

| Layer           | Responsibility                                     |
| --------------- | -------------------------------------------------- |
| Controller      | HTTP routing, status codes, request/response shape |
| Action service  | Single use case — business logic, CASL, Prisma     |
| Prisma          | Data access only — no business rules in queries    |
| DTO / Schema    | Input validation and output serialization          |
| Interface       | Internal object-shape contracts — not HTTP         |
| Enum            | Closed named value sets (`UserRole`, `OriginKind`) |
| Guard/Decorator | Module-scoped or library-provided access control   |

```ts
// modules/user/index.ts — public subset
export { UserModule } from './user.module';
```
