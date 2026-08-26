# Security

- Never trust client input. Validate HTTP payloads with Zod via `@saas-kit/schemas`. See `validation.md`.
- Store secrets in server env only (`BETTER_AUTH_SECRET`, `DATABASE_URL`, OAuth keys, `RESEND_API_KEY`). **NEVER** expose them to clients.
- Validate server env in `apps/server/src/shared/config/`. **NEVER** put secret or env schemas in `@saas-kit/schemas` — `web` and `admin` could import them.
- Authentication is enforced on every protected route. See `authentication.md`.
- Authorization is enforced in services via CASL. See `authorization.md`.
- Use parameterized queries via Prisma — **NEVER** concatenate user input into raw SQL.
- Rate-limit auth and sensitive endpoints at the gateway or via a NestJS throttler when needed.
- Set security headers (helmet) and strict CORS origins in production.
- Log auth failures and authorization denials — never log passwords, tokens, or PII in plain text.
- Conduct `<SECURITY_REVIEW>` for auth, input handling, payments, or PII.

## Interactive API documentation

Serve `/api/docs` and `/api/docs-json` in every environment. Call `setupSwagger(app)` unconditionally — do not disable them on `NODE_ENV`. See `api-docs.md`.

Swagger UI is not a backdoor. **Try it out executes the live API** and must respect the same authentication and authorization as any other client. Protected operations require a valid session; an unauthenticated caller gets `401`. Only routes marked `@AllowAnonymous()` (e.g. Health) are callable without a session. See `authentication.md`, `authorization.md`.

- **ALWAYS** send credentials from Swagger UI (`swaggerOptions.withCredentials: true`) so the better-auth session cookie is included on Try it out.
- **ALWAYS** add `.addCookieAuth("better-auth.session_token")` on DocumentBuilder when the auth module exists.
- **NEVER** let Try it out skip AuthGuard, CASL, or validation.
- **NEVER** hide or password-protect `/api/docs` as a substitute for enforcing auth on the routes themselves.
