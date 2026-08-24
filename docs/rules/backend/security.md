# Security

- Never trust client input. Validate HTTP payloads with Zod via `@saas-kit/schemas`. See `validation.md`.
- Store secrets in server env only (`BETTER_AUTH_SECRET`, `DATABASE_URL`, OAuth keys). **NEVER** expose them to clients.
- Validate server env in `apps/server/src/shared/config/`. **NEVER** put secret or env schemas in `@saas-kit/schemas` — `web` and `admin` could import them.
- Authentication is enforced on every protected route. See `authentication.md`.
- Authorization is enforced in services via CASL. See `authorization.md`.
- Use parameterized queries via Prisma — **NEVER** concatenate user input into raw SQL.
- Rate-limit auth and sensitive endpoints at the gateway or via a NestJS throttler when needed.
- Set security headers (helmet) and strict CORS origins in production.
- Log auth failures and authorization denials — never log passwords, tokens, or PII in plain text.
- Serve interactive API docs (`/api/docs` and `/api/docs-json`) in every environment, including production. Do not disable or gate them. See `api-docs.md`.
- Conduct `<SECURITY_REVIEW>` for auth, input handling, payments, or PII.
