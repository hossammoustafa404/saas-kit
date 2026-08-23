# Security

- Never trust client input. Validate with Zod via the shared schemas package.
- Sanitize user-generated HTML (use `DOMPurify` if needed).
- Store secrets on the NestJS backend. **NEVER** expose auth secrets to the Next.js client.
- Authentication is enforced on the backend. See `authentication.md`.
- Authorization is enforced on the backend. Frontend CASL is UI-only. See `authorization.md`.
- Conduct `<SECURITY_REVIEW>` for auth, input handling, payments, or PII.
