# Authentication: better-auth + nestjs-better-auth

Authentication confirms **who** the user is. Use **`@thallesp/nestjs-better-auth`** to integrate better-auth with NestJS. Requires `better-auth` >= 1.5.0.

## Directory Structure

```text
src/
└── modules/
    └── auth/
        ├── lib/
        │   └── auth.ts           # betterAuth({ ... }) instance
        ├── auth.module.ts
        ├── hooks/
        │   └── sign-up.hook.ts
        └── services/
            └── send-welcome-email/
                └── send-welcome-email.service.ts
```

## Setup

**1. Disable body parser in `main.ts`** — better-auth needs the raw request body:

```ts
const app = await NestFactory.create(AppModule, { bodyParser: false });
```

**2. Import `AuthModule` in `app.module.ts`:**

```ts
import { AuthModule } from "@thallesp/nestjs-better-auth";
import { auth } from "@/modules/auth/lib/auth";

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: "2mb" },
        urlencoded: { limit: "2mb", extended: true },
      },
    }),
  ],
})
export class AppModule {}
```

- Configure `betterAuth({ ... })` once in `modules/auth/lib/auth.ts`.
- Enable the `openAPI()` plugin for auth endpoint documentation. See `api-docs.md`.
- Store `BETTER_AUTH_SECRET`, `DATABASE_URL`, and OAuth secrets in server env only.
- Set `trustedOrigins` for allowed client origins (web, mobile deep links, etc.).

## Route Protection (Global by Default)

`AuthModule` registers a global `AuthGuard`. All routes are protected unless opted out:

| Decorator          | Behavior                                    |
| ------------------ | ------------------------------------------- |
| `@AllowAnonymous()`| No authentication required                  |
| `@OptionalAuth()`  | Session attached when present, not required |

```ts
import { AllowAnonymous, OptionalAuth, Session, UserSession } from "@thallesp/nestjs-better-auth";

@Get("health")
@AllowAnonymous()
health() {
  return { status: "ok" };
}

@Get("me")
getProfile(@Session() session: UserSession) {
  return session;
}
```

- Apply `@AllowAnonymous()` on health checks and truly public endpoints.
- Swagger UI Try it out is not exempt — it hits the live routes and the same global `AuthGuard`. See `api-docs.md`, `security.md`.
- **NEVER** create a custom `AuthGuard` — use the library's global guard and decorators.
- Session is also available via `req.session` and `req.user` on the request object.

## Role & Permission Decorators

Use library decorators for coarse route-level checks. Fine-grained resource checks still belong in action services via CASL. See `authorization.md`.

| Decorator              | Scope          | Use case                          |
| ---------------------- | -------------- | --------------------------------- |
| `@Roles(["admin"])`    | System-level   | Better Auth admin plugin          |
| `@OrgRoles([...])`     | Organization   | Requires `activeOrganizationId`   |
| `@UserHasPermission()` | System-level   | Admin plugin access control       |
| `@MemberHasPermission()`| Organization  | Org plugin access control         |

## Hooks (NestJS DI)

Register auth lifecycle hooks as injectable providers with `@Hook()`, `@BeforeHook()`, `@AfterHook()`, or `@DatabaseHook()` decorators. Requires `hooks: {}` or `databaseHooks: {}` in the better-auth config.

```ts
@Hook()
@Injectable()
export class SignUpHook {
  constructor(private readonly sendWelcomeEmail: SendWelcomeEmailService) {}

  @BeforeHook("/sign-up/email")
  async handle(ctx: AuthHookContext) {
    await this.sendWelcomeEmail.execute(ctx);
  }
}
```

## AuthService

Inject `AuthService<typeof auth>` for programmatic access to better-auth API endpoints (e.g. `listUserAccounts`, `generateOpenAPISchema`, plugin methods).

## Open API Plugin

- Add `openAPI()` from `better-auth/plugins` to the auth config — provides Scalar reference at `/api/auth/reference`.
- Use `auth.api.generateOpenAPISchema()` when you need the auth OpenAPI JSON programmatically.
- Auth docs are maintained by better-auth — do not duplicate auth endpoints in NestJS Swagger. See `api-docs.md`.

## Rules

- **NEVER** roll custom JWT/session management alongside better-auth.
- **NEVER** expose `BETTER_AUTH_SECRET` or provider client secrets to clients.
- **NEVER** trust client-sent user IDs — resolve identity from `@Session()` or `req.user`.
- **NEVER** implement sign-in/sign-up/sign-out in feature controllers — better-auth handles auth routes.
- Session and user types come from the shared schemas package or better-auth — do not duplicate them.
