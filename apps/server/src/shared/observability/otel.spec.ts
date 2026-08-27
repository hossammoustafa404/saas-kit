const sdk = {
  start: jest.fn(),
  shutdown: jest.fn(),
};

jest.mock('@opentelemetry/sdk-node', () => ({
  NodeSDK: jest.fn().mockImplementation(() => sdk),
}));

jest.mock('@opentelemetry/auto-instrumentations-node', () => ({
  getNodeAutoInstrumentations: jest.fn(() => []),
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

describe('otel', () => {
  const originalApiKey = process.env.POSTHOG_API_KEY;

  beforeEach(() => {
    jest.resetModules();
    sdk.start.mockReset();
    sdk.shutdown.mockReset();
    sdk.shutdown.mockResolvedValue(undefined);
    process.env.POSTHOG_API_KEY = 'phc_test_project_token';
    jest.spyOn(process, 'once').mockReturnValue(process);
  });

  afterEach(() => {
    jest.useRealTimers();
    jest.restoreAllMocks();
    if (originalApiKey === undefined) {
      delete process.env.POSTHOG_API_KEY;
    } else {
      process.env.POSTHOG_API_KEY = originalApiKey;
    }
  });

  it('should register an awaiting SIGTERM handler after the SDK starts', async () => {
    const { NodeSDK } = await import('@opentelemetry/sdk-node');
    const { handleOtelSigterm, startOtel } = await import('./otel');

    await startOtel();

    expect(NodeSDK).toHaveBeenCalled();
    expect(sdk.start).toHaveBeenCalledTimes(1);
    expect(process.once).toHaveBeenCalledWith('SIGTERM', handleOtelSigterm);
  });

  it('should not register a SIGTERM handler when observability is disabled', async () => {
    delete process.env.POSTHOG_API_KEY;
    const { startOtel } = await import('./otel');

    await startOtel();

    expect(sdk.start).not.toHaveBeenCalled();
    expect(process.once).not.toHaveBeenCalled();
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
