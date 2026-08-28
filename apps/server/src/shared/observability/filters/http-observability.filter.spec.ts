import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  type ArgumentsHost,
  type LoggerService,
} from '@nestjs/common';
import type { HttpAdapterHost } from '@nestjs/core';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { ObservabilityService } from '../services';
import { HttpObservabilityFilter } from './http-observability.filter';

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

const EMAIL = 'pii-user@example.com';
const PASSWORD = 'super-secret-password';
const BODY_MARKER = 'do-not-log-this-body';
const SIGN_IN_PATH = '/api/auth/sign-in/email';

describe('HttpObservabilityFilter', () => {
  const span = {
    recordException: jest.fn(),
    setStatus: jest.fn(),
  };

  beforeEach(() => {
    span.recordException.mockReset();
    span.setStatus.mockReset();
    jest.mocked(trace.getActiveSpan).mockReturnValue(span as never);
  });

  it.each([
    [400, 'Bad Request', () => new BadRequestException()],
    [401, 'Unauthorized', () => new UnauthorizedException()],
    [403, 'Forbidden', () => new ForbiddenException()],
    [404, 'Not Found', () => new NotFoundException()],
    [409, 'Conflict', () => new ConflictException()],
  ] as const)(
    'should warn for a thrown %s %s without logging email, password, or body',
    (statusCode, reason, createException) => {
      const logger = createLogger();
      const filter = createFilter(logger);
      const exception = createException();

      filter.catch(exception, host());

      expect(logger.warn).toHaveBeenCalledWith(
        `Outcoming Response: GET ${SIGN_IN_PATH} ${statusCode} ${reason}`,
      );
      expect(logger.error).not.toHaveBeenCalled();
      expectNoPii(logger);
      expect(span.recordException).not.toHaveBeenCalled();
      expect(span.setStatus).not.toHaveBeenCalled();
    },
  );

  it('should include the thrown message on a warn outcome', () => {
    const logger = createLogger();
    const filter = createFilter(logger);
    const exception = new UnauthorizedException('Invalid credentials');

    filter.catch(exception, host());

    expect(logger.warn).toHaveBeenCalledWith(
      `Outcoming Response: GET ${SIGN_IN_PATH} 401 Unauthorized - Invalid credentials`,
    );
    expect(logger.error).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should error and mark the span Error for a thrown 500', () => {
    const logger = createLogger();
    const filter = createFilter(logger);
    const exception = new InternalServerErrorException();

    filter.catch(exception, host());

    expect(logger.error).toHaveBeenCalledWith(
      `Outcoming Response: GET ${SIGN_IN_PATH} 500 Internal Server Error`,
      exception.stack,
    );
    expectNoPii(logger);
    expect(span.recordException).toHaveBeenCalledWith(exception);
    expect(span.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
    });
  });

  it('should error and mark the span Error for an unknown throw', () => {
    const logger = createLogger();
    const filter = createFilter(logger);
    const exception = new Error('boom');

    filter.catch(exception, host());

    expect(logger.error).toHaveBeenCalled();
    expect(loggedText(logger)).toContain('Outcoming Response');
    expect(loggedText(logger)).toContain(exception.stack ?? exception.message);
    expectNoPii(logger);
    expect(span.recordException).toHaveBeenCalledWith(exception);
    expect(span.setStatus).toHaveBeenCalledWith({
      code: SpanStatusCode.ERROR,
    });
  });

  it('should still send the Nest error response after logging', () => {
    const adapterHost = createAdapterHost();
    const filter = new HttpObservabilityFilter(
      adapterHost,
      new ObservabilityService(createLogger()),
    );

    filter.catch(new UnauthorizedException(), host());

    expect(adapterHost.httpAdapter.reply).toHaveBeenCalled();
  });

  it('should log the already-written status when Nest throws after the response was sent', () => {
    const logger = createLogger();
    const adapterHost = createAdapterHost(true);
    const filter = new HttpObservabilityFilter(
      adapterHost,
      new ObservabilityService(logger),
    );

    filter.catch(new NotFoundException(), host({ statusCode: 200 }));

    expect(logger.log).toHaveBeenCalledWith(
      `Outcoming Response: GET ${SIGN_IN_PATH} 200 OK`,
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(span.recordException).not.toHaveBeenCalled();
    expect(adapterHost.httpAdapter.end).toHaveBeenCalled();
    expect(adapterHost.httpAdapter.reply).not.toHaveBeenCalled();
  });

  it('should not throw when a 500 is thrown and there is no active span', () => {
    jest.mocked(trace.getActiveSpan).mockReturnValue(undefined);
    const filter = createFilter(createLogger());

    expect(() =>
      filter.catch(new InternalServerErrorException(), host()),
    ).not.toThrow();
  });
});

function createFilter(logger: LoggerService): HttpObservabilityFilter {
  return new HttpObservabilityFilter(
    createAdapterHost(),
    new ObservabilityService(logger),
  );
}

function createAdapterHost(
  headersSent = false,
): HttpAdapterHost & {
  httpAdapter: { isHeadersSent: jest.Mock; reply: jest.Mock; end: jest.Mock };
} {
  return {
    httpAdapter: {
      isHeadersSent: jest.fn().mockReturnValue(headersSent),
      reply: jest.fn(),
      end: jest.fn(),
    },
  } as never;
}

function host(
  response: { statusCode?: number } = {},
): ArgumentsHost {
  const request = {
    method: 'GET',
    originalUrl: `${SIGN_IN_PATH}?email=${EMAIL}&password=${PASSWORD}`,
    body: { email: EMAIL, password: PASSWORD, payload: BODY_MARKER },
  };

  return {
    getType: () => 'http',
    switchToHttp: () => ({
      getRequest: () => request,
      getResponse: () => response,
    }),
    getArgByIndex: (index: number) => (index === 1 ? response : request),
  } as ArgumentsHost;
}

function createLogger(): LoggerService & {
  log: jest.Mock;
  warn: jest.Mock;
  error: jest.Mock;
} {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function loggedText(
  logger: LoggerService & {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  },
): string {
  return [
    ...logger.log.mock.calls,
    ...logger.warn.mock.calls,
    ...logger.error.mock.calls,
  ]
    .flat()
    .filter((argument) => argument != null)
    .map((argument) =>
      typeof argument === 'string' ? argument : String(argument),
    )
    .join('\n');
}

function expectNoPii(
  logger: LoggerService & {
    log: jest.Mock;
    warn: jest.Mock;
    error: jest.Mock;
  },
): void {
  const text = loggedText(logger);
  expect(text).not.toContain(EMAIL);
  expect(text).not.toContain(PASSWORD);
  expect(text).not.toContain(BODY_MARKER);
}
