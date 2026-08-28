import { trace } from '@opentelemetry/api';
import { logs } from '@opentelemetry/api-logs';
import { AppLogger } from './app-logger';

jest.mock('@opentelemetry/api', () => {
  const actual = jest.requireActual('@opentelemetry/api');
  return {
    ...actual,
    trace: {
      ...actual.trace,
      getActiveSpan: jest.fn(),
    },
  };
});

const TRACE_ID = '4bf92f3577b34da6a3ce929d0e0e4736';
const SPAN_ID = '00f067aa0ba902b7';
const TIMESTAMP = '2026-08-28T12:00:00.000Z';
const UNAUTHORIZED_MESSAGE = '401 Unauthorized GET /api/auth/sign-in/email';

describe('AppLogger', () => {
  let write: jest.SpiedFunction<typeof process.stdout.write>;

  beforeEach(() => {
    jest.useFakeTimers();
    jest.setSystemTime(new Date(TIMESTAMP));
    jest.mocked(trace.getActiveSpan).mockReturnValue(undefined);
    write = jest.spyOn(process.stdout, 'write').mockReturnValue(true);
  });

  afterEach(() => {
    write.mockRestore();
    jest.useRealTimers();
  });

  it('should write a warn Log as JSON with timestamp, level, message, and context', () => {
    new AppLogger().warn(UNAUTHORIZED_MESSAGE, 'ObservabilityService');

    expect(writtenJson()).toEqual({
      timestamp: TIMESTAMP,
      level: 'warn',
      message: UNAUTHORIZED_MESSAGE,
      context: 'ObservabilityService',
    });
  });

  it('should include trace_id and span_id on a warn Log when a span is active', () => {
    jest.mocked(trace.getActiveSpan).mockReturnValue(createSpan());

    new AppLogger().warn(UNAUTHORIZED_MESSAGE, 'ObservabilityService');

    expect(writtenJson()).toEqual({
      timestamp: TIMESTAMP,
      level: 'warn',
      message: UNAUTHORIZED_MESSAGE,
      context: 'ObservabilityService',
      trace_id: TRACE_ID,
      span_id: SPAN_ID,
    });
  });

  it('should write an error Log as JSON with level error', () => {
    new AppLogger().error(
      '500 Internal Server Error GET /api/auth/sign-in/email',
      'Error: boom\n    at handler',
      'ObservabilityService',
    );

    expect(writtenJson()).toEqual({
      timestamp: TIMESTAMP,
      level: 'error',
      message: '500 Internal Server Error GET /api/auth/sign-in/email',
      stack: 'Error: boom\n    at handler',
      context: 'ObservabilityService',
    });
  });

  it('should write the stack as a stack field when no context is passed', () => {
    new AppLogger().error(
      '500 Internal Server Error GET /api/auth/sign-in/email',
      'Error: boom\n    at handler',
    );

    expect(writtenJson()).toEqual({
      timestamp: TIMESTAMP,
      level: 'error',
      message: '500 Internal Server Error GET /api/auth/sign-in/email',
      stack: 'Error: boom\n    at handler',
    });
  });

  it('should write a Nest log() as JSON with level info', () => {
    new AppLogger().log(
      'Application is running on: http://localhost:3000/api',
      'NestFactory',
    );

    expect(writtenJson()).toEqual({
      timestamp: TIMESTAMP,
      level: 'info',
      message: 'Application is running on: http://localhost:3000/api',
      context: 'NestFactory',
    });
  });

  it('should emit an OpenTelemetry log with the same timestamp as stdout', () => {
    const emit = jest.fn();
    const getLogger = jest.spyOn(logs, 'getLogger').mockReturnValue({
      emit,
    } as ReturnType<typeof logs.getLogger>);

    try {
      new AppLogger().warn(UNAUTHORIZED_MESSAGE, 'ObservabilityService');

      expect(emit).toHaveBeenCalledWith(
        expect.objectContaining({
          timestamp: new Date(TIMESTAMP),
          body: UNAUTHORIZED_MESSAGE,
        }),
      );
    } finally {
      getLogger.mockRestore();
    }
  });

  it('should not write a second Log when OpenTelemetry emit fails', () => {
    const getLogger = jest.spyOn(logs, 'getLogger').mockReturnValue({
      emit: () => {
        throw new Error('otlp down');
      },
    } as ReturnType<typeof logs.getLogger>);

    try {
      new AppLogger().warn(UNAUTHORIZED_MESSAGE, 'ObservabilityService');

      expect(writtenJson()).toEqual({
        timestamp: TIMESTAMP,
        level: 'warn',
        message: UNAUTHORIZED_MESSAGE,
        context: 'ObservabilityService',
      });
    } finally {
      getLogger.mockRestore();
    }
  });

  function writtenJson(): unknown {
    expect(write).toHaveBeenCalledTimes(1);
    return JSON.parse(String(write.mock.calls[0][0]).trimEnd());
  }
});

function createSpan() {
  return {
    spanContext: () => ({
      traceId: TRACE_ID,
      spanId: SPAN_ID,
      traceFlags: 1,
    }),
  } as ReturnType<typeof trace.getActiveSpan>;
}
