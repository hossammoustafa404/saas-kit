import { isObservabilityEnabled, posthogOtlp } from './utils';

describe('isObservabilityEnabled', () => {
  it('should report observability off when POSTHOG_API_KEY is missing', () => {
    expect(isObservabilityEnabled({ POSTHOG_API_KEY: undefined })).toBe(false);
  });

  it('should report observability off when POSTHOG_API_KEY is empty', () => {
    expect(isObservabilityEnabled({ POSTHOG_API_KEY: '' })).toBe(false);
  });

  it('should report observability off when POSTHOG_API_KEY is whitespace', () => {
    expect(isObservabilityEnabled({ POSTHOG_API_KEY: '   ' })).toBe(false);
  });

  it('should report observability on when POSTHOG_API_KEY is a project token', () => {
    expect(
      isObservabilityEnabled({ POSTHOG_API_KEY: 'phc_test_project_token' }),
    ).toBe(true);
  });
});

describe('posthogOtlp', () => {
  it('should return PostHog /i/v1 OTLP URLs and a Bearer project token header', () => {
    expect(
      posthogOtlp({
        POSTHOG_API_KEY: 'phc_test_project_token',
        POSTHOG_HOST: 'https://us.i.posthog.com',
      }),
    ).toEqual({
      traces: 'https://us.i.posthog.com/i/v1/traces',
      logs: 'https://us.i.posthog.com/i/v1/logs',
      metrics: 'https://us.i.posthog.com/i/v1/metrics',
      header: 'Authorization: Bearer phc_test_project_token',
    });
  });

  it('should derive OTLP URLs from a custom PostHog host', () => {
    expect(
      posthogOtlp({
        POSTHOG_API_KEY: 'phc_test_project_token',
        POSTHOG_HOST: 'https://eu.i.posthog.com',
      }),
    ).toEqual({
      traces: 'https://eu.i.posthog.com/i/v1/traces',
      logs: 'https://eu.i.posthog.com/i/v1/logs',
      metrics: 'https://eu.i.posthog.com/i/v1/metrics',
      header: 'Authorization: Bearer phc_test_project_token',
    });
  });
});
