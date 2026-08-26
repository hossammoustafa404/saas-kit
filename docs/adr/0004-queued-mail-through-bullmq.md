# Mail is queued through Redis/BullMQ

Auth and later Invitation emails are plain text. They are enqueued to Redis with BullMQ (`@nestjs/bullmq`) and sent with Resend. The processor runs in the same Nest process as the API. Resend failure is retried by the queue.

We rejected sending mail inline on the request path: a mail outage would fail sign-up after the User already existed, and HTTP latency would hold the auth response. We rejected a Postgres-backed queue to keep the Nest/BullMQ path and avoid mixing job state into the application database. The send path is Resend (see 0005), not SMTP.

Seed stubs the queue. E2E finishes Email verification by reading the queued mail job and calling Better Auth’s verify URL, not by parsing mailboxes.
