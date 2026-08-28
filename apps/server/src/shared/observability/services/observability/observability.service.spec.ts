import { STATUS_CODES } from 'node:http';
import {
  UnauthorizedException,
  type LoggerService,
} from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { HttpOutcomeRequest } from '../../interfaces';
import { UNKNOWN_ROUTE } from '../../observability.constants';
import { ObservabilityService } from './observability.service';

const EMAIL = 'pii-user@example.com';
const PASSWORD = 'super-secret-password';
const BODY_MARKER = 'do-not-log-this-body';
const SIGN_IN_PATH = '/api/auth/sign-in/email';

describe('ObservabilityService', () => {
  it.each([
    [400, 'Bad Request'],
    [401, 'Unauthorized'],
    [403, 'Forbidden'],
    [404, 'Not Found'],
    [409, 'Conflict'],
  ] as const)(
    'should warn for a %s %s outcome without logging email, password, or body',
    (statusCode, reason) => {
      const logger = createLogger();
      const service = new ObservabilityService(logger);

      service.logOutcomingRes({
        statusCode,
        request: createRequest(),
      });

      expect(logger.warn).toHaveBeenCalledWith(
        `Outcoming Response: GET ${SIGN_IN_PATH} ${statusCode} ${reason}`,
      );
      expect(logger.error).not.toHaveBeenCalled();
      expectNoPii(logger);
    },
  );

  it('should include the exception message on a warn outcome', () => {
    const logger = createLogger();
    const service = new ObservabilityService(logger);

    service.logOutcomingRes({
      statusCode: 401,
      request: createRequest(),
      exception: new UnauthorizedException('Invalid credentials'),
    });

    expect(logger.warn).toHaveBeenCalledWith(
      `Outcoming Response: GET ${SIGN_IN_PATH} 401 Unauthorized - Invalid credentials`,
    );
    expect(logger.error).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should error for a 500 outcome without logging email, password, or body', () => {
    const logger = createLogger();
    const service = new ObservabilityService(logger);
    const exception = new Error('boom');

    service.logOutcomingRes({
      statusCode: 500,
      request: createRequest(),
      exception,
    });

    expect(logger.error).toHaveBeenCalledWith(
      `Outcoming Response: GET ${SIGN_IN_PATH} 500 ${STATUS_CODES[500] ?? 'Internal Server Error'} - boom`,
      exception.stack,
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should write an info Log for a 200 outcome without logging email, password, or body', () => {
    const logger = createLogger();
    const service = new ObservabilityService(logger);

    service.logOutcomingRes({
      statusCode: 200,
      request: createRequest(),
    });

    expect(logger.log).toHaveBeenCalledWith(
      `Outcoming Response: GET ${SIGN_IN_PATH} 200 OK`,
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should still log a route when the request path is missing', () => {
    const logger = createLogger();
    const service = new ObservabilityService(logger);

    service.logOutcomingRes({
      statusCode: 200,
      request: { method: 'GET' },
    });

    expect(logger.log).toHaveBeenCalledWith(
      `Outcoming Response: GET ${UNKNOWN_ROUTE} 200 OK`,
    );
  });

  it('should log an incoming request without query, email, password, or body', () => {
    const logger = createLogger();
    const service = new ObservabilityService(logger);

    service.logIncomingReq(createRequest());

    expect(logger.log).toHaveBeenCalledWith(
      `Incoming Request: GET ${SIGN_IN_PATH}`,
    );
    expectNoPii(logger);
  });

  it('should not log Health as an incoming request', () => {
    const logger = createLogger();
    const service = new ObservabilityService(logger);

    service.logIncomingReq({ method: 'GET', originalUrl: '/api/health' });

    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should be constructable by Nest without a logger provider', async () => {
    const module = await Test.createTestingModule({
      providers: [ObservabilityService],
    }).compile();

    expect(module.get(ObservabilityService)).toBeInstanceOf(
      ObservabilityService,
    );
  });
});

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

function createRequest(): HttpOutcomeRequest & {
  body: { email: string; password: string; payload: string };
} {
  return {
    method: 'GET',
    originalUrl: `${SIGN_IN_PATH}?email=${EMAIL}&password=${PASSWORD}`,
    body: { email: EMAIL, password: PASSWORD, payload: BODY_MARKER },
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
