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
│   │   ├── observability.service.ts      # Matches the module — not a verb-resource action service
│   │   ├── observability.constants.ts    # NEVER constants.ts
│   │   ├── filters/                      # HTTP outcome filter — Nest throws
│   │   │   ├── index.ts
│   │   │   └── http-outcome.filter.ts
│   │   └── interfaces/                   # NEVER types.ts — one file per interface
│   │       ├── index.ts
│   │       └── http-outcome-request.interface.ts
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

- **NEVER** put business logic in `main.ts` or `app.module.ts` beyond wiring.
- **NEVER** access Prisma directly from controllers. Controllers delegate to action services.
- **NEVER** create an `entities/` folder — use Prisma types and shared Zod schemas.
- Each feature is a self-contained NestJS module with controller, action services, DTOs, and scoped guards/decorators.
- Register feature modules in `app.module.ts` — do not nest feature modules inside each other unless there is a genuine parent/child domain relationship.
- Infrastructure used by multiple modules (`prisma`, `config`, `observability`) lives in `shared/` — not inside feature modules.
- Shared infra is named after the folder: `ObservabilityModule` + `ObservabilityService` + `observability.constants.ts`. Do not invent a verb-resource service (`LogHttpOutcomeService`) for shared infra.
- Filters and interceptors live **inside the module that owns the concern** (`shared/observability/filters/`, or `modules/{name}/filters/` when the concern is a feature). Register globals with `APP_FILTER` / `APP_INTERCEPTOR` in that module's `providers`.
- HTTP 4xx/5xx from Nest **throw**. The observability **filter** logs them. better-auth (no Nest throw) is logged on Express `finish`. **NEVER** a global interceptor that treats a Nest handler return as 4xx/5xx — that return must not happen. See `controllers.md`.
- **NEVER** `shared/filters/` or `shared/interceptors/` as a dumping ground. **NEVER** `new` a module-owned filter or interceptor in `main.ts`.
- Constants: `{module}.constants.ts` at the module root. **NEVER** `constants.ts`.
- Internal interfaces: `interfaces/{name}.interface.ts` — **one exported interface per file**. Re-export from `interfaces/index.ts`. **NEVER** `types.ts`. **NEVER** put several interfaces in one file. HTTP contracts stay in `@saas-kit/schemas`, not here.
- **NEVER** apply frontend feature root files (`constants.ts`, `types.ts`) to `apps/server`.
- **NEVER** create `shared/index.ts` or `shared/swagger/index.ts`. Import from the concrete file (`shared/config/config.module`, `shared/prisma/prisma.module`, `shared/observability/observability.module`, `shared/swagger/setup-swagger`, `shared/config/env.schema`). Feature-module barrels (`modules/{name}/index.ts`) and folder barrels (`interfaces/index.ts`) stay required.
- **NEVER** create `shared/docs/`. Swagger lives in `shared/swagger/setup-swagger.ts` only — DocumentBuilder metadata stays in that file. **NEVER** split a `swagger.config.ts`. **NEVER** put error envelopes, Scalar, or other docs products in `shared/swagger/`.
- **NEVER** export env schemas from `@saas-kit/schemas`. Server process config stays in `shared/config/`. HTTP contracts stay in `@saas-kit/schemas`.

## Action Services (One Folder Per Action)

- This section applies to **feature modules** under `modules/` only. Shared infra (`shared/prisma/prisma.service.ts`, `shared/observability/observability.service.ts`) uses one service named after the module.
- **NEVER** create a monolithic `{domain}.service.ts` with all CRUD methods inside a feature module.
- Each use case gets its own folder under `services/` containing the service and its spec.
- Folder name: `{verb}-{resource}/` — `find-one-user/`, `create-user/`.
- Service file: `{verb}-{resource}.service.ts` inside the folder.
- Spec file: `{verb}-{resource}.service.spec.ts` colocated in the same folder.
- Class name: `PascalCase` verb + resource + `Service` — `FindOneUserService`.
- Re-export action services from `services/index.ts`. Controllers import from the barrel only.

```ts
// modules/user/user.controller.ts
import { FindOneUserService, CreateUserService } from "./services";

@Controller("users")
export class UserController {
  constructor(
    private readonly findOneUser: FindOneUserService,
    private readonly createUser: CreateUserService,
  ) {}

  @Get(":id")
  findOne(@Param("id") id: string) {
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

## Module-Scoped Guards, Filters & Interceptors

- Guards and decorators used **only within a module** live in that module's `guards/` and `decorators/` folders.
- Filters and interceptors used by a module (including app-wide ones it owns) live in that module's `filters/` and `interceptors/` folders — `shared/observability/filters/http-outcome.filter.ts`, not `shared/filters/`.
- Observability HTTP outcome logging does **not** use an interceptor. Nest failures throw (`APP_FILTER`). better-auth 4xx is Express `finish` in `ObservabilityModule`.
- **NEVER** put an observability (or any other owned) filter/interceptor in a top-level `shared/filters/` or `shared/interceptors/` folder.
- Register module-owned global filters and interceptors via `APP_FILTER` / `APP_INTERCEPTOR` in the module `providers` array.
- Auth guards and session decorators come from `@thallesp/nestjs-better-auth` — do not reimplement. See `authentication.md`.
- Register module-scoped guards in the module's `providers` and apply via `@UseGuards()` or module-level setup.

## Public API (Strict)

Every feature exposes a controlled surface through `modules/{name}/index.ts`. Everything else is internal.

- **NEVER** deep-import across module boundaries. No `@/modules/user/services/find-one-user/find-one-user.service` from another module.
- **ONLY** import from `modules/{name}` when one module needs another's public API.
- **ONLY** export symbols intentionally public in `index.ts` — typically the module class.
- Cross-module communication goes through the other module's `index.ts` or NestJS DI (inject an exported service), never via direct file imports.

## Layer Responsibilities

| Layer           | Responsibility                                      |
| --------------- | --------------------------------------------------- |
| Controller      | HTTP routing, status codes, request/response shape  |
| Action service  | Single use case — business logic, CASL, Prisma      |
| Prisma          | Data access only — no business rules in queries      |
| DTO / Schema    | Input validation and output serialization           |
| Guard/Decorator | Module-scoped or library-provided access control    |

```ts
// modules/user/index.ts — public subset
export { UserModule } from "./user.module";
```
