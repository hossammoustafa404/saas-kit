# Outbound mail is sent with Resend

The mail processor sends through Resend’s HTTP API. Auth still owns copy and enqueues `{ to, subject, text, html }` to BullMQ. `RESEND_API_KEY` and `MAIL_FROM` live in server env only.

Resend rejects reserved test domains such as `example.com`. The processor completes those jobs without calling Resend so local sign-up and e2e do not retry a send that cannot succeed. Other 4xx responses (except rate limits) fail the job without retry.

We reversed the vendor-SDK rejection in 0004: one provider beats operating SMTP and local Mailpit. We still do not send mail on the request path, and we still do not use SES HTTP or Postmark.
