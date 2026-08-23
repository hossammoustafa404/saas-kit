# NestJS Framework Discipline

## Modules & Dependency Injection

- One NestJS module per domain — **singular** folder name (`user/`, `order-item/`). See `architecture.md`.
- **ALWAYS** register action services and module-scoped guards in the module's `providers` array.
- Export services only when other modules need them via DI.
- **ALWAYS** inject dependencies via constructor — never use `new` for services, guards, or hooks.
- Import `ConfigModule` from `shared/config/` globally in `app.module.ts`. Access config via `ConfigService`, not `process.env` in services.
- Use `Logger` from `@nestjs/common` with a context string matching the class name.

## Global Setup (`main.ts`)

- Create app with `bodyParser: false` for better-auth. See `authentication.md`.
- Enable `ZodValidationPipe` globally. See `validation.md`.
- Register global exception filter from `shared/filters/`.
- Enable CORS with allowed origins from config (`trustedOrigins` must align with better-auth).
- Set a global prefix (e.g. `/api`) if required by clients.
- Set up Swagger in non-production environments. See `api-docs.md`.

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

- **NEVER** use `@Injectable()` services as static utility classes.
- **NEVER** return Prisma records directly when they contain sensitive fields — map or use Zod output schemas.
- **NEVER** catch errors silently. Log and rethrow or transform via exception filters.
- Prefer `async/await` over raw Promise chains. Action services expose an `execute()` method.
