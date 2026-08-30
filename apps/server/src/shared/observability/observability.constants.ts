export const MIN_CLIENT_ERROR = 400;
export const MIN_SERVER_ERROR = 500;
export const UNKNOWN_STATUS_REASON = 'Unknown';
export const UNKNOWN_ROUTE = 'Unknown';
export const OTEL_SERVICE_NAME = 'saas-kit-server';
export const POSTHOG_OTLP_TRACES_PATH = '/i/v1/traces';
export const POSTHOG_OTLP_LOGS_PATH = '/i/v1/logs';
export const HEALTH_TRACE_PATH = '/api/health';
export const HEALTH_TRACE_METHOD = 'GET';
export const AUTH_TRACE_PATH_PREFIX = '/api/auth';
export const OTEL_SHUTDOWN_KEEP_ALIVE_MS = 1_000;
export const LOG_TRACE_ID = 'trace_id';
export const LOG_SPAN_ID = 'span_id';
export const REDACTED_VALUE = '[REDACTED]';
/** Log PII redaction for common email shapes; not full RFC 5322 coverage. */
export const EMAIL_IN_TEXT_PATTERN =
  /(?:"[^"@]+"|[a-zA-Z0-9._%+-]+)@(?:\[[0-9.]+\]|[a-zA-Z0-9.-]+\.[a-zA-Z]{2,63})/g;
