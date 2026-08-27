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
import { BaseExceptionFilter, type HttpAdapterHost } from '@nestjs/core';
import { ObservabilityService } from '../services';
import { HttpOutcomeFilter } from './http-outcome.filter';

const EMAIL = 'pii-user@example.com';
const PASSWORD = 'super-secret-password';
const BODY_MARKER = 'do-not-log-this-body';

describe('HttpOutcomeFilter', () => {
  beforeEach(() => {
    jest
      .spyOn(BaseExceptionFilter.prototype, 'catch')
      .mockImplementation(() => undefined);
  });

  afterEach(() => {
    jest.restoreAllMocks();
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

      filter.catch(createException(), createHost());

      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
      expect(loggedText(logger)).toContain(String(statusCode));
      expect(loggedText(logger)).toContain(reason);
      expect(loggedText(logger)).toContain('GET /api/auth/sign-in/email');
      expectNoPii(logger);
      expect(BaseExceptionFilter.prototype.catch).toHaveBeenCalled();
    },
  );

  it('should error for a 500 HttpException without logging email, password, or body', () => {
    const logger = createLogger();
    const filter = createFilter(logger);

    filter.catch(new InternalServerErrorException(), createHost());

    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(loggedText(logger)).toContain('500');
    expectNoPii(logger);
  });

  it('should error for an unknown throw without serializing the request body', () => {
    const logger = createLogger();
    const filter = createFilter(logger);
    const exception = new Error('boom');

    filter.catch(exception, createHost());

    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(loggedText(logger)).toContain('500');
    expect(loggedText(logger)).toContain(exception.stack ?? exception.message);
    expectNoPii(logger);
  });
});

function createLogger(): LoggerService & {
  warn: jest.Mock;
  error: jest.Mock;
} {
  return {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
}

function createFilter(logger: LoggerService): HttpOutcomeFilter {
  const adapterHost = { httpAdapter: undefined } as unknown as HttpAdapterHost;
  return new HttpOutcomeFilter(adapterHost, new ObservabilityService(logger));
}

function createHost(): ArgumentsHost {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        originalUrl: `/api/auth/sign-in/email?email=${EMAIL}&password=${PASSWORD}`,
        body: { email: EMAIL, password: PASSWORD, payload: BODY_MARKER },
      }),
      getResponse: () => ({ statusCode: 200 }),
    }),
    getArgByIndex: () => ({
      body: { email: EMAIL, password: PASSWORD, payload: BODY_MARKER },
    }),
  } as unknown as ArgumentsHost;
}

function loggedText(
  logger: LoggerService & { warn: jest.Mock; error: jest.Mock },
): string {
  return [...logger.warn.mock.calls, ...logger.error.mock.calls]
    .flat()
    .filter((argument) => argument != null)
    .map((argument) =>
      typeof argument === 'string' ? argument : String(argument),
    )
    .join('\n');
}

function expectNoPii(
  logger: LoggerService & { warn: jest.Mock; error: jest.Mock },
): void {
  const text = loggedText(logger);
  expect(text).not.toContain(EMAIL);
  expect(text).not.toContain(PASSWORD);
  expect(text).not.toContain(BODY_MARKER);
}
