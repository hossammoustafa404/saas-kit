# Testing: Jest + Supertest

## Unit Tests (Colocated)

- Each action service lives in its own folder with its spec beside it:

```text
services/
├── find-one-user/
│   ├── find-one-user.service.ts
│   └── find-one-user.service.spec.ts
└── create-user/
    ├── create-user.service.ts
    └── create-user.service.spec.ts
```

- Controller spec sits beside the controller at module root:

```text
user.controller.ts
user.controller.spec.ts
```

- **NEVER** use `__tests__/` folders for unit tests.
- Mock `PrismaService` and external dependencies — test action service logic in isolation.
- Controller specs mock action services — test delegation and HTTP behavior, not business rules.
- One behavior per `it()` — names describe intent: `it("should reject unauthorized update")`.
- Run `npm test` (or `nx test`) before considering a feature complete.

## E2E Tests

- E2E tests live in `test/` or `e2e/` at the project root.
- Use Supertest against the running NestJS app (`app.getHttpServer()`).
- Test critical flows: auth session, CRUD with authorization, validation errors.
- Seed test data in `beforeEach` / `beforeAll` — clean up in `afterEach` / `afterAll`.
- Use a separate test database — **NEVER** run E2E against production.

## Test Factories

- Factory helpers: `create` + noun — `createUser`, `createMockSession`.
- Build valid payloads from shared Zod schemas to keep tests aligned with validation rules.

## What to Test

| Layer            | Focus                                              |
| ---------------- | -------------------------------------------------- |
| Action service   | Single use case, CASL checks, error cases          |
| Controller       | Routing, delegation to services, status codes      |
| Guard/Hook       | Module-scoped guard behavior, auth hook side effects |
| E2E              | Full HTTP round-trip, status codes, response shape |
| Zod schemas      | **Do not unit-test.** No `*.schema.spec.ts` anywhere. |

- Prefer testing behavior over implementation details.
- Do not test Prisma or NestJS framework internals.
- **NEVER** add `*.schema.spec.ts` (or any spec that only `safeParse`s a Zod schema). This includes `@saas-kit/schemas` **and** server env schemas (`shared/config/env.schema.ts`, seed env schemas). HTTP contracts are proven at the consumer (controller spec, e2e). Server env is proven by boot (`ConfigModule` validate) and by the e2e process having the required vars — not by parsing the schema in Jest.
- **NEVER** add `*.spec.ts`, `*.test.ts`, or Jest config under `packages/schemas`.
