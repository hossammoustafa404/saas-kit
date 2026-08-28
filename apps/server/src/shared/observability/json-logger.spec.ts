import { trace } from '@opentelemetry/api';
import { JsonLogger } from './json-logger';

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
const UNAUTHORIZED_MESSAGE = '401 Unauthorized GET /api/auth/sign-in/email';

describe('JsonLogger', () => {
  beforeEach(() => {
    jest.mocked(trace.getActiveSpan).mockReturnValue(undefined);
  });

  it('should write a warn Log as JSON with level, message, and context', () => {
    const lines: string[] = [];
    const logger = new JsonLogger((line) => lines.push(line));

    logger.warn(UNAUTHORIZED_MESSAGE, 'ObservabilityService');

    expect(lines).toHaveLength(1);
    expect(JSON.parse(lines[0])).toEqual({
      level: 'warn',
      message: UNAUTHORIZED_MESSAGE,
      context: 'ObservabilityService',
    });
  });

  it('should include trace_id and span_id on a warn Log when a span is active', () => {
    jest.mocked(trace.getActiveSpan).mockReturnValue(createSpan());
    const lines: string[] = [];
    const logger = new JsonLogger((line) => lines.push(line));

    logger.warn(UNAUTHORIZED_MESSAGE, 'ObservabilityService');

    expect(JSON.parse(lines[0])).toEqual({
      level: 'warn',
      message: UNAUTHORIZED_MESSAGE,
      context: 'ObservabilityService',
      trace_id: TRACE_ID,
      span_id: SPAN_ID,
    });
  });

  it('should write an error Log as JSON with level error', () => {
    const lines: string[] = [];
    const logger = new JsonLogger((line) => lines.push(line));

    logger.error(
      '500 Internal Server Error GET /api/auth/sign-in/email',
      'Error: boom\n    at handler',
      'ObservabilityService',
    );

    expect(JSON.parse(lines[0])).toEqual({
      level: 'error',
      message: '500 Internal Server Error GET /api/auth/sign-in/email',
      context: 'ObservabilityService',
    });
  });

  it('should write a Nest log() as JSON with level info', () => {
    const lines: string[] = [];
    const logger = new JsonLogger((line) => lines.push(line));

    logger.log(
      'Application is running on: http://localhost:3000/api',
      'NestFactory',
    );

    expect(JSON.parse(lines[0])).toEqual({
      level: 'info',
      message: 'Application is running on: http://localhost:3000/api',
      context: 'NestFactory',
    });
  });
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
