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
| Logging        | NestJS Logger; JSON `JsonLogger` + OTLP logs when tracing is on | `nestjs.md`             |
| Tracing        | OpenTelemetry NodeSDK → PostHog OTLP (opt-in) | `nestjs.md`           |
| Events         | `posthog-node` `capture()` (opt-in)         | `authentication.md`     |
| Testing        | Jest + Supertest                            | `testing.md`            |

Mail is plain text via Resend. BullMQ’s Redis connection is registered once in `shared/queue/`. Each queue (`mail`, later others) calls `BullModule.registerQueue` in its own module and `BullBoardModule.forFeature` so it appears on Bull Board. Jobs are processed in the same Nest process. **NEVER** send mail inline on the request path, **NEVER** call `BullModule.forRoot` or `BullBoardModule.forRoot` outside `shared/queue/`, and **NEVER** back the queue with PostgreSQL. Bull Board (`@bull-board/nestjs`) is mounted at `/api/queues` and requires a Super Admin Session — the global AuthGuard does not cover that Express mount.

Product Events use `posthog-node` `capture()` when a PostHog project token is set. **NEVER** send Events over OTLP, **NEVER** use `PostHogInterceptor` or `captureException` in v1, and **NEVER** let a capture failure fail auth or Health.

Traces use the OpenTelemetry NodeSDK (`@opentelemetry/sdk-node`, `@opentelemetry/auto-instrumentations-node`, `@opentelemetry/exporter-trace-otlp-proto`, `@prisma/instrumentation`) when a PostHog project token is set. Start the SDK before Nest loads so HTTP and Prisma auto-instrumentation can patch. Export to PostHog’s `/i/v1/traces` with `Authorization: Bearer` plus the `phc_` token. **NEVER** set `OTEL_EXPORTER_OTLP_ENDPOINT`. **NEVER** let an OpenTelemetry failure fail auth or Health.

When tracing is on, Nest uses `JsonLogger` (JSON stdout with `trace_id` / `span_id` when a span is active) and the same NodeSDK exports Logs to PostHog’s `/i/v1/logs` over OTLP (`@opentelemetry/exporter-logs-otlp-proto`) with the same Bearer project token. When the token is missing, keep Nest’s default Logger. **NEVER** `capture()` a Log. **NEVER** write an access Log on 2xx.
