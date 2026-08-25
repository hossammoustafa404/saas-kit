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
│   ├── swagger/
│   │   └── setup-swagger.ts      # DocumentBuilder + SwaggerModule.setup
│   ├── filters/                  # Global exception filters
│   └── pipes/                    # Global pipes (if not registered in main.ts)
└── modules/
    └── user/                     # Singular domain name
        ├── index.ts              # Public API — sole entry for external imports
        ├── user.module.ts
        ├── user.controller.ts
        ├── user.controller.spec.ts
        ├── guards/                 # Module-scoped guards
        │   └── index.ts
        ├── decorators/           # Module-scoped decorators
        │   └── index.ts
        ├── dto/
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

- **NEVER** put business logic in `main.ts` or `app.module.ts` beyond wiring.
- **NEVER** access Prisma directly from controllers. Controllers delegate to action services.
- **NEVER** create an `entities/` folder — use Prisma types and shared Zod schemas.
- Each feature is a self-contained NestJS module with controller, action services, DTOs, and scoped guards/decorators.
- Register feature modules in `app.module.ts` — do not nest feature modules inside each other unless there is a genuine parent/child domain relationship.
- Infrastructure used by multiple modules (`prisma`, `config`) lives in `shared/` — not inside feature modules.
- **NEVER** create `shared/index.ts` or `shared/swagger/index.ts`. Import from the concrete file (`shared/config/config.module`, `shared/prisma/prisma.module`, `shared/swagger/setup-swagger`, `shared/config/env.schema`). Feature-module barrels (`modules/{name}/index.ts`) stay required.
- **NEVER** create `shared/docs/`. Swagger lives in `shared/swagger/setup-swagger.ts` only — DocumentBuilder metadata stays in that file. **NEVER** split a `swagger.config.ts`. **NEVER** put error envelopes, Scalar, or other docs products in `shared/swagger/`.
- **NEVER** export env schemas from `@saas-kit/schemas`. Server process config stays in `shared/config/`. HTTP contracts stay in `@saas-kit/schemas`.

## Action Services (One Folder Per Action)

- **NEVER** create a monolithic `{domain}.service.ts` with all CRUD methods.
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

## Module-Scoped Guards & Decorators

- Guards and decorators used **only within a module** live in that module's `guards/` and `decorators/` folders.
- Cross-module or app-wide guards/filters live in `shared/` (e.g. global exception filter).
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
