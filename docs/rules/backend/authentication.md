# Authentication: better-auth + nestjs-better-auth

Authentication confirms **who** the user is. Use **`@thallesp/nestjs-better-auth`** to integrate better-auth with NestJS. Requires `better-auth` >= 1.5.0.

## Directory Structure

```text
src/
└── modules/
    └── auth/
        ├── auth.constants.ts
        ├── enums/
        │   ├── index.ts
        │   ├── member-role.enum.ts
        │   ├── origin-kind.enum.ts
        │   └── user-role.enum.ts
        ├── interfaces/
        │   ├── create-auth-options.interface.ts
        │   ├── auth-event-user.interface.ts
        │   ├── capture-auth-event-input.interface.ts
        │   └── auth-hook-user-context.interface.ts
        ├── auth.module.ts
        ├── lib/
        │   ├── auth.ts           # betterAuth({ ... }) instance
        │   └── organization-hooks.ts  # reject Super Admin invitee and addMember target
        ├── plugins/
        │   ├── add-member.plugin.ts  # HTTP addMember; Better Auth ships it server-only
        │   └── http-observability.plugin.ts  # incoming and outgoing HTTP logs for auth routes
        └── hooks/
            ├── origin-gate.hook.ts
            └── auth-events.hook.ts
```

## Setup

**1. Disable body parser in `main.ts`** — better-auth needs the raw request body:

```ts
const app = await NestFactory.create(AppModule, { bodyParser: false });
```

**2. Import `AuthModule` in `app.module.ts`:**

```ts
import { AuthModule } from '@thallesp/nestjs-better-auth';
import { auth } from '@/modules/auth/lib/auth';

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      bodyParser: {
        json: { limit: '2mb' },
        urlencoded: { limit: '2mb', extended: true },
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

| Decorator           | Behavior                                    |
| ------------------- | ------------------------------------------- |
| `@AllowAnonymous()` | No authentication required                  |
| `@OptionalAuth()`   | Session attached when present, not required |

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

| Decorator                | Scope        | Use case                        |
| ------------------------ | ------------ | ------------------------------- |
| `@Roles(["superadmin"])` | System-level | Better Auth admin plugin        |
| `@OrgRoles([...])`       | Organization | Requires `activeOrganizationId` |
| `@UserHasPermission()`   | System-level | Admin plugin access control     |
| `@MemberHasPermission()` | Organization | Org plugin access control       |

## Hooks (NestJS DI)

Register auth lifecycle hooks as injectable providers with `@Hook()`, `@BeforeHook()`, `@AfterHook()`, or `@DatabaseHook()` decorators. Requires `hooks: {}` or `databaseHooks: {}` in the better-auth config.

```ts
@Hook()
@Injectable()
export class SignUpHook {
  constructor(
    private readonly sendWelcomeEmailService: SendWelcomeEmailService,
  ) {}

  @BeforeHook('/sign-up/email')
  async handle(ctx: AuthHookContext) {
    await this.sendWelcomeEmailService.execute(ctx);
  }
}
```

Auth product Events (`user signed up`, `user signed in`, `user signed out`) are captured from `AuthEventsHook` via `PosthogService`. Sign-up and sign-in use AfterHooks. Sign-out uses `@AfterDelete("session")` because `/sign-out` does not run `sessionMiddleware`, so `ctx.context.session` is null on HTTP hooks. The database hook receives the Session row (`userId`) and the endpoint context (Origin, path). Only `/sign-out` is captured so Session expiry on get-session and revoke are not Events. `PosthogService.capture()` swallows PostHog failures so they cannot 500 auth. Origin-gate stays policy-only BeforeHooks. Requires `hooks: {}` and `databaseHooks: {}` in `createAuth`.

## Email verification and queued mail

Customer sign-up requires Email verification (`requireEmailVerification: true`). Sign-up creates the User and enqueues a plain-text verification email. It does not issue a Session. The Customer signs in after calling Better Auth’s verify URL. A second sign-up with the same email returns `409 CONFLICT` with `USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL` from the origin gate. Better Auth would otherwise return a synthetic 200 to hide whether the email is registered.

Auth owns copy. `createAuth` receives the mail queue and enqueues `{ to, subject, text, html }` from `sendVerificationEmail` (plain text, `html` empty). Enqueue failure is logged and sign-up still succeeds: Better Auth persists the User first, then swallows email-callback errors in `runInBackgroundOrAwait`, so throwing cannot fail the request or roll back the User. A second sign-up with the same email is `409`. Better Auth signs a JWT and verifies it — it does not persist a verification row for this flow. BullMQ’s Redis connection lives in `shared/queue/`. Shared mail lives in `shared/mail/`: the mail queue, Resend, and the processor in the same Nest process. Resend failure is retried by the queue, except reserved test recipients (`example.com`) which are skipped when `NODE_ENV` is not `production`, and other 4xx responses (except 408, 425, and 429) which fail without retry. Network errors from Resend bubble and retry.

Wire `createAuth({ prisma, mailQueue, observabilityService })` via Nest `forRootAsync`, injecting `PrismaService`, `getQueueToken(MAIL_QUEUE)`, and `ObservabilityService`. Seed omits `observabilityService` — it calls `auth.api` and never hits HTTP hooks. Forgotten password stays forbidden. Better-auth never enters the Nest interceptor or filter; `httpObservabilityPlugin` logs incoming auth requests from `hooks.before` and outgoing from `hooks.after` (`method`, `path`, `request`).

Env: `REDIS_URL`, `RESEND_API_KEY`, `MAIL_FROM`. E2E and `nx serve` require Redis as well as PostgreSQL. Seed stubs `mailQueue.add`. E2E finishes Email verification by reading the queued mail job and calling Better Auth’s verify URL — testers do not parse mailboxes.

Bull Board is at `/api/queues`. It is Express middleware, so the global `AuthGuard` does not apply. `BullBoardAuthMiddleware` in `shared/queue/` requires a Super Admin Session. Job payloads (including mail) are visible to Super Admins only. **NEVER** leave the board anonymous or Customer-accessible.

## Organization plugin

Enable Better Auth `organization()` on the server in `createAuth`. Customer Organization actions use the plugin HTTP API under `/api/auth/organization/*`. Do not duplicate those routes in NestJS. Do not add `organizationClient` on web or admin this pass.

`allowUserToCreateOrganization` is true only for Role `customer`. Creator Membership position is owner. Creating an Organization sets Active Organization unless the Customer sends `keepCurrentActiveOrganization`. Sign-in leaves Active Organization unset — do not add a session-create hook that auto-picks one. Teams and dynamic Organization roles stay off. Prisma has Organization, Membership (`member`), Invitation, and `activeOrganizationId` on Session — no team, teamMember, or organizationRole tables. Plugin access control enforces owner/admin/member on plugin routes. Do not introduce CASL for Organization this pass.

Owner and admin may create an Invitation (`POST /organization/invite-member`) and add a Member (`POST /organization/add-member`). Position member cannot. Better Auth ships `addMember` as a server-only API with no HTTP route; `addMemberPlugin` exposes that path under the existing Better Auth base path and checks Membership position before creating the seat. Reject a Super Admin email as invitee and a Super Admin `userId` as an addMember target so a Super Admin never gains a Membership. Invitation accept/reject/get require Email verification (serial Invitation ids stay; do not set `requireEmailVerificationOnInvitation: false`). `sendInvitationEmail` enqueues plain text with `{WEB_ORIGIN}/accept-invitation/{id}`. Last owner cannot leave or be removed. Owner may delete the Organization; admin may not.

## AuthService

Inject `AuthService<Auth>` (`Auth` is `ReturnType<typeof createAuth>`) for programmatic access to better-auth API endpoints (e.g. `listUserAccounts`, `generateOpenAPISchema`, plugin methods). Passing the auth instance type is how plugin fields such as `user.role` (admin plugin) appear on `getSession()` and `@Session()`.

## Open API Plugin

- Add `openAPI()` from `better-auth/plugins` to the auth config — provides Scalar reference at `/api/auth/reference`.
- Use `auth.api.generateOpenAPISchema()` when you need the auth OpenAPI JSON programmatically.
- Auth docs are maintained by better-auth — do not duplicate auth endpoints in NestJS Swagger. See `api-docs.md`.

## Rules

- **NEVER** roll custom JWT/session management alongside better-auth.
- **NEVER** expose `BETTER_AUTH_SECRET` or provider client secrets to clients.
- **NEVER** trust client-sent user IDs — resolve identity from `@Session()` or `req.user`.
- **NEVER** implement sign-in/sign-up/sign-out in feature controllers — better-auth handles auth routes.
- Keep `/api/auth` and `/api/auth/*path` in `setGlobalPrefix` exclude (with Bull Board). `setGlobalPrefix` replaces the exclude list AuthModule set in its constructor.
- **NEVER** send mail inline on the auth request path.
- **NEVER** duplicate Better Auth organization plugin routes in NestJS.
- **NEVER** add `organizationClient` on web or admin this pass.
- **NEVER** enable Teams or dynamic Organization roles.
- **NEVER** use CASL for Organization actions this pass.
- Session and user types come from the shared schemas package or better-auth — do not duplicate them.
