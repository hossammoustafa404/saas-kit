# OpenTelemetry and PostHog as two pipes

The server needs observability (where a request went, how long, what failed) and product analytics (what a User did). PostHog ingests OpenTelemetry Traces, Logs, and Metrics over OTLP, but product Events only through `capture()`. One client cannot do both jobs.

We instrument with the OpenTelemetry SDK (HTTP and Prisma, started before Nest) and export Traces, Logs, and auto HTTP Metrics to PostHog when a project token is set. Auth Events (`user signed up`, `user signed in`, `user signed out`) use `posthog-node` from AfterHooks. We do not treat spans, span events, or Logs as Events, and we do not send Events over OTLP.

We considered OpenTelemetry only (Insights would stay empty) and the PostHog SDK only (no Prisma waterfall). We considered a Collector in front of PostHog; the app already speaks OTLP, so a Collector can be added later without changing Nest. Observability is opt-in: missing config or a PostHog outage must not fail auth or Health.
