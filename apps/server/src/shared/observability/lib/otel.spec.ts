import {
  POSTHOG_OTLP_LOGS_PATH,
  POSTHOG_OTLP_TRACES_PATH,
} from '../observability.constants';

const sdk = {
  start: jest.fn(),
  shutdown: jest.fn(),
};

jest.mock('@opentelemetry/sdk-logs', () => ({
  BatchLogRecordProcessor: jest.fn(),
}));

jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => sdk),
}));

jest.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: jest.fn(() => []),
}));

jest.mock('@opentelemetry/exporter-logs-otlp-proto', () => ({
  OTLPLogExporter: jest.fn(),
}));

jest.mock('@opentelemetry/exporter-trace-otlp-proto', () => ({
  OTLPTraceExporter: jest.fn(),
}));

jest.mock('@opentelemetry/resources', () => ({
  resourceFromAttributes: jest.fn(() => ({})),
}));

jest.mock('@prisma/instrumentation', () => ({
  PrismaInstrumentation: jest.fn(),
}));

jest.mock('dotenv', () => ({
  config: jest.fn(),
}));

const PROJECT_TOKEN = 'phc_test_project_token';
const POSTHOG_HOST = 'https://us.i.posthog.com';

describe('otel', () => {
  const originalApiKey = process.env.POSTHOG_API_KEY;
  const originalHost = process.env.POSTHOG_HOST;

  beforeEach(() => {
    jest.resetModules();
    sdk.start.mockReset();
    sdk.shutdown.mockReset();
    sdk.shutdown.mockResolvedValue(undefined);
    delete process.env.POSTHOG_API_KEY;
    delete process.env.POSTHOG_HOST;
    jest.spyOn(process, 'once').mockReturnValue(process);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    restoreEnv('POSTHOG_API_KEY', originalApiKey);
    restoreEnv('POSTHOG_HOST', originalHost);
  });

  it('should start the SDK and register an awaiting SIGTERM handler', async () => {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { handleOtelSigterm, startOtel } = await import('./otel');

    await startOtel();

    expect(NodeSDK).toHaveBeenCalled();
    expect(sdk.start).toHaveBeenCalledTimes(1);
    expect(process.once).toHaveBeenCalledWith('SIGTERM', handleOtelSigterm);
  });

  it('should not export OTLP when PostHog is not configured', async () => {
    const { OTLPTraceExporter } = await import(
      '@opentelemetry/exporter-trace-otlp-proto'
    );
    const { OTLPLogExporter } = await import(
      '@opentelemetry/exporter-logs-otlp-proto'
    );
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { NoopSpanProcessor } = await import('@opentelemetry/sdk-trace');
    const { startOtel } = await import('./otel');

    await startOtel();

    expect(OTLPTraceExporter).not.toHaveBeenCalled();
    expect(OTLPLogExporter).not.toHaveBeenCalled();
    expect(NodeSDK).toHaveBeenCalledWith(
      expect.objectContaining({
        spanProcessors: [expect.any(NoopSpanProcessor)],
        logRecordProcessors: [],
        metricReaders: [],
      }),
    );
  });

  it('should export traces and logs to PostHog when a project token and host are set', async () => {
    process.env.POSTHOG_API_KEY = PROJECT_TOKEN;
    process.env.POSTHOG_HOST = POSTHOG_HOST;
    const { OTLPTraceExporter } = await import(
      '@opentelemetry/exporter-trace-otlp-proto'
    );
    const { OTLPLogExporter } = await import(
      '@opentelemetry/exporter-logs-otlp-proto'
    );
    const { startOtel } = await import('./otel');

    await startOtel();

    const headers = { Authorization: `Bearer ${PROJECT_TOKEN}` };
    expect(OTLPTraceExporter).toHaveBeenCalledWith({
      url: `${POSTHOG_HOST}${POSTHOG_OTLP_TRACES_PATH}`,
      headers,
    });
    expect(OTLPLogExporter).toHaveBeenCalledWith({
      url: `${POSTHOG_HOST}${POSTHOG_OTLP_LOGS_PATH}`,
      headers,
    });
  });

  it('should keep the event loop alive until OpenTelemetry shutdown finishes after SIGTERM', async () => {
    jest.useFakeTimers();
    let resolveShutdown: () => void = () => undefined;
    sdk.shutdown.mockImplementation(
      () =>
        new Promise<void>((resolve) => {
          resolveShutdown = resolve;
        }),
    );

    const { handleOtelSigterm, startOtel } = await import('./otel');
    await startOtel();

    const flushing = handleOtelSigterm();

    expect(sdk.shutdown).toHaveBeenCalledTimes(1);
    expect(jest.getTimerCount()).toBe(1);

    resolveShutdown();
    await flushing;

    expect(jest.getTimerCount()).toBe(0);
  });

  it('should release the keep-alive timer when OpenTelemetry shutdown fails', async () => {
    jest.useFakeTimers();
    sdk.shutdown.mockRejectedValue(new Error('flush failed'));
    const { Logger } = await import('@nestjs/common');
    jest.spyOn(Logger.prototype, 'error').mockImplementation(() => undefined);
    const { handleOtelSigterm, startOtel } = await import('./otel');
    await startOtel();

    await expect(handleOtelSigterm()).resolves.toBeUndefined();

    expect(jest.getTimerCount()).toBe(0);
  });
});

function restoreEnv(name: string, previous: string | undefined): void {
  if (previous === undefined) {
    delete process.env[name];
    return;
  }

  process.env[name] = previous;
}
