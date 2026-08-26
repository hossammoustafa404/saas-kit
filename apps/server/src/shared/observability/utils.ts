import type { Env } from '../config/env.schema';

export function isObservabilityEnabled(
  env: Pick<Env, 'POSTHOG_API_KEY'>,
): boolean {
  return Boolean(env.POSTHOG_API_KEY?.trim());
}

export function posthogOtlp(env: Pick<Env, 'POSTHOG_API_KEY' | 'POSTHOG_HOST'>): {
  traces: string;
  logs: string;
  metrics: string;
  header: string;
} {
  const token = env.POSTHOG_API_KEY?.trim() ?? '';
  const host = env.POSTHOG_HOST;

  return {
    traces: `${host}/i/v1/traces`,
    logs: `${host}/i/v1/logs`,
    metrics: `${host}/i/v1/metrics`,
    header: `Authorization: Bearer ${token}`,
  };
}
