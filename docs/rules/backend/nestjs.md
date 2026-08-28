# NestJS Framework Discipline

## Modules & Dependency Injection

- One NestJS module per domain — **singular** folder name (`user/`, `order-item/`). See `architecture.md`.
- **ALWAYS** register action services, module-scoped guards, and module-owned filters/interceptors/middleware in the module's `providers` array. Global filters/interceptors owned by a module use `APP_FILTER` / `APP_INTERCEPTOR` — never `new` in `main.ts`. Global middleware owned by a module uses `NestModule.configure`.
- Export services only when other modules need them via DI.
- **ALWAYS** inject dependencies via constructor — never use `new` for services, guards, or hooks.
- Import `ConfigModule` from `shared/config/` globally in `app.module.ts`. Access config via `ConfigService`, not `process.env` in services. **NEVER** import shared infra through a `shared/index.ts` barrel. Call `setupSwagger` from `shared/swagger/setup-swagger` — **NEVER** `shared/docs/`.
- Validate env with a Zod schema colocated in `shared/config/env.schema.ts`. **NEVER** name it `env.ts`. **NEVER** put that schema in `@saas-kit/schemas`. **NEVER** add `env.schema.spec.ts`. See `validation.md`, `testing.md`.
- Load `apps/server/.env` by path from the server project root — `nx serve` cwd is the workspace root, so `envFilePath: '.env'` will miss the file.
- Use `Logger` from `@nestjs/common` with a context string matching the class name. Nest uses `AppLogger` (JSON stdout + OTLP, with `trace_id` / `span_id` when a span is active).
- HTTP logs: `logIncomingReq` writes incoming `Incoming Request: METHOD /path`. `logOutcomingRes` writes `Outcoming Response: METHOD /path 200 OK` (or warn/error at the same prefix). Warn includes the exception message; error includes the message and a `stack` field. Incoming middleware is registered with `NestModule.configure` and excludes `/api/auth`. Better-auth incoming and outgoing logs use `httpObservabilityPlugin` `hooks.before` / `hooks.after` — auth never enters the Nest middleware, interceptor, or filter. The filter logs the already-written status when headers are sent, marks 5xx spans Error, then delegates to Nest’s default exception response. **NEVER** log 4xx/5xx from the interceptor — Nest failures throw. **NEVER** an Express `finish` listener. **NEVER** `types.ts` or `constants.ts` on the server. **NEVER** `shared/filters/`, `shared/interceptors/`, or `shared/middlewares/` as a dump. See `naming-conventions.md`, `architecture.md`.

## Global Setup (`main.ts`)

- `await startOtel()` from `shared/observability/lib/otel` **before** dynamically importing `AppModule` / `NestFactory`. A static `AppModule` import loads Prisma too early for auto-instrumentation.
- Pass `logger: new AppLogger()` to `NestFactory.create` so Logs are JSON with `trace_id` / `span_id` and emit on the OpenTelemetry logs API.
- Create app with `bodyParser: false` for better-auth. See `authentication.md`.
- Enable `ZodValidationPipe` globally. See `validation.md`.
- Do not `new` observability (or other module-owned) filters, interceptors, or middleware here — `ObservabilityModule` registers `APP_FILTER`, `APP_INTERCEPTOR`, and `NestModule` middleware.
- Enable shutdown hooks so `beforeApplicationShutdown` can flush the OpenTelemetry SDK. Shutdown failures must not crash the process. `otel.ts` also **awaits** SDK shutdown on SIGTERM and holds the event loop until the flush completes — do not fire-and-forget (`void shutdownOtel()`), or traces can be lost if Kubernetes (or another supervisor) sends SIGTERM before Nest hooks are enabled.
- Enable CORS with allowed origins from config (`trustedOrigins` must align with better-auth).
- Set a global prefix (e.g. `/api`) if required by clients. Exclude `api/queues` so Bull Board is not double-prefixed — its route already includes `api`. Also keep `/api/auth` and `/api/auth/*path` in that exclude list: `setGlobalPrefix` replaces AuthModule’s exclude options. See `authentication.md`.
- Set up Swagger in every environment (`/api/docs` and `/api/docs-json`). Do not gate on `NODE_ENV`. Try it out must send credentials and is subject to the same auth as the live API. See `api-docs.md`, `security.md`.

## Request Lifecycle

1. **Middleware** — Nest incoming HTTP log (`Incoming Request: METHOD /path`). Registered via `NestModule.configure`; excludes `/api/auth`. Runs before guards.
2. **Guard** — global `AuthGuard` from `@thallesp/nestjs-better-auth`; opt out with `@AllowAnonymous()`. See `authentication.md`.
3. **Pipe** — validate and transform input DTOs. See `validation.md`.
4. **Controller** — route to the correct action service.
5. **Action service** — single use case: business logic, CASL checks, Prisma calls. See `architecture.md`, `database.md`.
6. **Interceptor / Filter / Auth plugin** — Nest success HTTP log (`Outcoming Response: METHOD /path 200 OK`); thrown warn/error log (`Outcoming Response: METHOD /path 4xx/5xx`). Better-auth logs come from `httpObservabilityPlugin` (`hooks.before` incoming, `hooks.after` outgoing), not the interceptor or filter.

## Decorators

- Auth/session decorators come from `@thallesp/nestjs-better-auth` (`@Session()`, `@AllowAnonymous()`, etc.).
- Module-specific decorators live in `modules/{name}/decorators/` — not in `shared/`.
- **NEVER** scatter raw `@Req()` extraction logic across controllers — use `@Session()` or module decorators.

## Rules

- **NEVER** declare object-shape `type` aliases or interfaces in services, controllers, or hooks. Put them in `modules/{name}/interfaces/` as `{name}.interface.ts`. See `architecture.md`, `naming-conventions.md`.
- **NEVER** declare an `enum` in services, controllers, or hooks. Put them in `modules/{name}/enums/` as `{name}.enum.ts`. See `architecture.md`, `naming-conventions.md`.
- **NEVER** declare `SCREAMING_SNAKE_CASE` constants in services, controllers, or hooks. Put them in `modules/{name}/{name}.constants.ts` (or `shared/{area}/{area}.constants.ts`). See `architecture.md`, `naming-conventions.md`.
- **NEVER** declare file-level helper functions beside a class (service, controller, filter, interceptor, middleware, hook, processor, guard). Put those helpers on the class as `private` methods. Spec files may keep local factories. Function modules with no class (`otel.ts`, `utils.ts`) may keep file-level helpers. See `architecture.md`, `clean-code.md`.
- **NEVER** use `@Injectable()` services as static utility classes.
- **NEVER** return Prisma records directly when they contain sensitive fields — map or use Zod output schemas.
- **NEVER** catch errors silently. Log and rethrow or transform via exception filters.
- Prefer `async/await` over raw Promise chains. Action services expose an `execute()` method.
