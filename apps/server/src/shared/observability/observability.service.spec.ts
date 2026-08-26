import { STATUS_CODES } from 'node:http';
import type { LoggerService } from '@nestjs/common';
import { Test } from '@nestjs/testing';
import type { HttpOutcomeRequest } from './interfaces';
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

      const didLog = service.log({
        statusCode,
        request: createRequest(),
      });

      expect(didLog).toBe(true);
      expect(logger.warn).toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
      expect(loggedText(logger)).toContain(String(statusCode));
      expect(loggedText(logger)).toContain(reason);
      expect(loggedText(logger)).toContain(`GET ${SIGN_IN_PATH}`);
      expectNoPii(logger);
    },
  );

  it('should error for a 500 outcome without logging email, password, or body', () => {
    const logger = createLogger();
    const service = new ObservabilityService(logger);
    const exception = new Error('boom');

    const didLog = service.log({
      statusCode: 500,
      exception,
      request: createRequest(),
    });

    expect(didLog).toBe(true);
    expect(logger.error).toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(loggedText(logger)).toContain('500');
    expect(loggedText(logger)).toContain(STATUS_CODES[500] ?? 'Internal Server Error');
    expect(loggedText(logger)).toContain(exception.stack ?? exception.message);
    expectNoPii(logger);
  });

  it('should not write an access Log for a 200 outcome', () => {
    const logger = createLogger();
    const service = new ObservabilityService(logger);

    const didLog = service.log({
      statusCode: 200,
      request: createRequest(),
    });

    expect(didLog).toBe(false);
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(logger.log).not.toHaveBeenCalled();
  });

  it('should remember whether an outcome was already logged', () => {
    const service = new ObservabilityService(createLogger());
    const response = { statusCode: 401 };

    expect(service.hasLogged(response)).toBe(false);
    service.remember(response);
    expect(service.hasLogged(response)).toBe(true);
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
