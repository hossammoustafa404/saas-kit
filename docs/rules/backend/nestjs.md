# NestJS Framework Discipline

## Modules & Dependency Injection

- One NestJS module per domain — **singular** folder name (`user/`, `order-item/`). See `architecture.md`.
- **ALWAYS** register action services, module-scoped guards, and module-owned filters/interceptors in the module's `providers` array. Global filters/interceptors owned by a module use `APP_FILTER` / `APP_INTERCEPTOR` — never `new` in `main.ts`.
- Export services only when other modules need them via DI.
- **ALWAYS** inject dependencies via constructor — never use `new` for services, guards, or hooks.
- Import `ConfigModule` from `shared/config/` globally in `app.module.ts`. Access config via `ConfigService`, not `process.env` in services. **NEVER** import shared infra through a `shared/index.ts` barrel. Call `setupSwagger` from `shared/swagger/setup-swagger` — **NEVER** `shared/docs/`.
- Validate env with a Zod schema colocated in `shared/config/env.schema.ts`. **NEVER** name it `env.ts`. **NEVER** put that schema in `@saas-kit/schemas`. **NEVER** add `env.schema.spec.ts`. See `validation.md`, `testing.md`.
- Load `apps/server/.env` by path from the server project root — `nx serve` cwd is the workspace root, so `envFilePath: '.env'` will miss the file.
- Use `Logger` from `@nestjs/common` with a context string matching the class name. When tracing is on, the app logger is `JsonLogger` (JSON stdout + OTLP). When off, Nest’s default Logger.
- Shared infra is named after the module (`ObservabilityModule` / `observability.constants.ts`). Services live under `services/{name}/` (`ObservabilityService`, `PosthogService`). Internal interfaces live one-per-file under `interfaces/`. Filters that belong to that module live in `filters/` beside it, registered with `APP_FILTER`. The HTTP span-status interceptor lives in `interceptors/` and is registered with `APP_INTERCEPTOR` — it handles thrown 5xx only (`recordException` + span Error). **NEVER** an observability interceptor that reads `res.statusCode` after a Nest handler returns — Nest 4xx/5xx throw. **NEVER** `types.ts` or `constants.ts` on the server. **NEVER** `shared/filters/` or `shared/interceptors/` as a dump. See `naming-conventions.md`, `architecture.md`.

## Global Setup (`main.ts`)

- `await startOtel()` from `shared/observability/otel` **before** dynamically importing `AppModule` / `NestFactory`. A static `AppModule` import loads Prisma too early for auto-instrumentation.
- When `isOtelStarted()`, pass `logger: new JsonLogger()` to `NestFactory.create` so Logs are JSON with `trace_id` / `span_id` and emit on the OpenTelemetry logs API. When observability is off, omit `logger` so Nest’s default Logger stays.
- Create app with `bodyParser: false` for better-auth. See `authentication.md`.
- Enable `ZodValidationPipe` globally. See `validation.md`.
- Do not `new` observability (or other module-owned) filters and interceptors here — `ObservabilityModule` registers `APP_FILTER` and `APP_INTERCEPTOR`.
- Enable shutdown hooks so `beforeApplicationShutdown` can flush the OpenTelemetry SDK. Shutdown failures must not crash the process. `otel.ts` also **awaits** SDK shutdown on SIGTERM and holds the event loop until the flush completes — do not fire-and-forget (`void shutdownOtel()`), or traces can be lost if Kubernetes (or another supervisor) sends SIGTERM before Nest hooks are enabled.
- Enable CORS with allowed origins from config (`trustedOrigins` must align with better-auth).
- Set a global prefix (e.g. `/api`) if required by clients. Exclude `api/queues` so Bull Board is not double-prefixed — its route already includes `api`. See `authentication.md`.
- Set up Swagger in every environment (`/api/docs` and `/api/docs-json`). Do not gate on `NODE_ENV`. Try it out must send credentials and is subject to the same auth as the live API. See `api-docs.md`, `security.md`.

## Request Lifecycle

1. **Guard** — global `AuthGuard` from `@thallesp/nestjs-better-auth`; opt out with `@AllowAnonymous()`. See `authentication.md`.
2. **Pipe** — validate and transform input DTOs. See `validation.md`.
3. **Controller** — route to the correct action service.
4. **Action service** — single use case: business logic, CASL checks, Prisma calls. See `architecture.md`, `database.md`.
5. **Interceptor / Filter** — response shaping and error formatting.

## Decorators

- Auth/session decorators come from `@thallesp/nestjs-better-auth` (`@Session()`, `@AllowAnonymous()`, etc.).
- Module-specific decorators live in `modules/{name}/decorators/` — not in `shared/`.
- **NEVER** scatter raw `@Req()` extraction logic across controllers — use `@Session()` or module decorators.

## Rules

- **NEVER** declare object-shape `type` aliases or interfaces in services, controllers, or hooks. Put them in `modules/{name}/interfaces/` as `{name}.interface.ts`. See `architecture.md`, `naming-conventions.md`.
- **NEVER** declare an `enum` in services, controllers, or hooks. Put them in `modules/{name}/enums/` as `{name}.enum.ts`. See `architecture.md`, `naming-conventions.md`.
- **NEVER** declare `SCREAMING_SNAKE_CASE` constants in services, controllers, or hooks. Put them in `modules/{name}/{name}.constants.ts` (or `shared/{area}/{area}.constants.ts`). See `architecture.md`, `naming-conventions.md`.
- **NEVER** declare file-level helper functions beside a class (service, controller, filter, interceptor, hook, processor, guard). Put those helpers on the class as `private` methods. Spec files may keep local factories. Function modules with no class (`otel.ts`, `utils.ts`) may keep file-level helpers. See `architecture.md`, `clean-code.md`.
- **NEVER** use `@Injectable()` services as static utility classes.
- **NEVER** return Prisma records directly when they contain sensitive fields — map or use Zod output schemas.
- **NEVER** catch errors silently. Log and rethrow or transform via exception filters.
- Prefer `async/await` over raw Promise chains. Action services expose an `execute()` method.
