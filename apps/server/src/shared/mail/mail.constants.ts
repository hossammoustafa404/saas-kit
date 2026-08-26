export const MAIL_QUEUE = 'mail';
export const MAIL_SEND_JOB = 'send';
export const MAIL_SEND_ATTEMPTS = 5;
export const MAIL_RETRY_DELAY_MS = 2000;
export const MAIL_KEEP_COMPLETED_JOBS = 100;
export const MAIL_KEEP_FAILED_JOBS = 100;
export const RESEND = 'RESEND';
export const RESEND_RETRYABLE_CLIENT_STATUS_CODES: ReadonlySet<number> =
  new Set([408, 425, 429]);
export const RESEND_BLOCKED_MAIL_DOMAINS = [
  'example.com',
  'example.net',
  'example.org',
  'test.com',
] as const;
