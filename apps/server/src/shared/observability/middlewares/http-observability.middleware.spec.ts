import type { LoggerService } from '@nestjs/common';
import { ObservabilityService } from '../services';
import { HttpObservabilityMiddleware } from './http-observability.middleware';

const EMAIL = 'pii-user@example.com';
const PASSWORD = 'super-secret-password';
const BODY_MARKER = 'do-not-log-this-body';
const USERS_PATH = '/api/users';

describe('HttpObservabilityMiddleware', () => {
  it('should log the incoming Nest request without email, password, or body and call next', () => {
    const logger = createLogger();
    const middleware = createMiddleware(logger);
    const next = jest.fn();

    middleware.use(createRequest(), {}, next);

    expect(logger.log).toHaveBeenCalledWith(
      `Incoming Request: GET ${USERS_PATH}`,
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
    expectNoPii(logger);
  });

  it('should not log Health', () => {
    const logger = createLogger();
    const middleware = createMiddleware(logger);
    const next = jest.fn();

    middleware.use({ method: 'GET', originalUrl: '/api/health' }, {}, next);

    expect(logger.log).not.toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });
});

function createMiddleware(logger: LoggerService): HttpObservabilityMiddleware {
  return new HttpObservabilityMiddleware(new ObservabilityService(logger));
}

function createRequest() {
  return {
    method: 'GET',
    originalUrl: `${USERS_PATH}?email=${EMAIL}&password=${PASSWORD}`,
    body: { email: EMAIL, password: PASSWORD, payload: BODY_MARKER },
  };
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
