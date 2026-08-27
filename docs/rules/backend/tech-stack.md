# Tech Stack

Approved technologies for the NestJS backend. **NEVER** introduce alternatives without updating this file first.

## Stack Overview

| Layer          | Technology                                  | Rule file               |
| -------------- | ------------------------------------------- | ----------------------- |
| Framework      | NestJS                                      | `nestjs.md`             |
| Language       | TypeScript                                  | `naming-conventions.md` |
| Architecture   | Feature modules + `shared/` infra           | `architecture.md`       |
| Database       | PostgreSQL + Prisma (`shared/prisma/`)      | `database.md`           |
| Validation     | Zod (shared package) + `nestjs-zod`         | `validation.md`         |
| Authentication | `@thallesp/nestjs-better-auth`              | `authentication.md`     |
| Authorization  | CASL (`@casl/ability`)                      | `authorization.md`      |
| API            | REST (JSON) — any HTTP client               | `controllers.md`        |
| API docs       | `@nestjs/swagger` + better-auth `openAPI()` | `api-docs.md`           |
| Config         | `@nestjs/config` (`shared/config/`)         | `nestjs.md`             |
| Mail           | Resend                                      | `authentication.md`     |
| Queue          | Redis + BullMQ (`shared/queue/`) + Bull Board | `authentication.md`     |
| Logging        | NestJS built-in `Logger`                    | `nestjs.md`             |
| Events         | `posthog-node` `capture()` (opt-in)         | `authentication.md`     |
| Testing        | Jest + Supertest                            | `testing.md`            |

Mail is plain text via Resend. BullMQ’s Redis connection is registered once in `shared/queue/`. Each queue (`mail`, later others) calls `BullModule.registerQueue` in its own module and `BullBoardModule.forFeature` so it appears on Bull Board. Jobs are processed in the same Nest process. **NEVER** send mail inline on the request path, **NEVER** call `BullModule.forRoot` or `BullBoardModule.forRoot` outside `shared/queue/`, and **NEVER** back the queue with PostgreSQL. Bull Board (`@bull-board/nestjs`) is mounted at `/api/queues` and requires a Super Admin Session — the global AuthGuard does not cover that Express mount.

Product Events use `posthog-node` `capture()` when a PostHog project token is set. **NEVER** send Events over OTLP, **NEVER** use `PostHogInterceptor` or `captureException` in v1, and **NEVER** let a capture failure fail auth or Health.
