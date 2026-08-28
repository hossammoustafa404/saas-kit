import {
  BadRequestException,
  type CallHandler,
  type ExecutionContext,
  type LoggerService,
} from '@nestjs/common';
import { firstValueFrom, of, throwError } from 'rxjs';
import { ObservabilityService } from '../services';
import { HttpObservabilityInterceptor } from './http-observability.interceptor';

const EMAIL = 'pii-user@example.com';
const PASSWORD = 'super-secret-password';
const BODY_MARKER = 'do-not-log-this-body';
const SIGN_IN_PATH = '/api/auth/sign-in/email';

describe('HttpObservabilityInterceptor', () => {
  it('should log an outgoing success without email, password, or body', async () => {
    const logger = createLogger();
    const interceptor = createInterceptor(logger);

    await expect(
      firstValueFrom(
        interceptor.intercept(context({ statusCode: 200 }), succeeding()),
      ),
    ).resolves.toEqual({ ok: true });

    expect(logger.log).toHaveBeenCalledWith(
      `Outcoming Response: GET ${SIGN_IN_PATH} 200 OK`,
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should not log a 4xx status set on the response without a throw', async () => {
    const logger = createLogger();
    const interceptor = createInterceptor(logger);

    await expect(
      firstValueFrom(
        interceptor.intercept(context({ statusCode: 400 }), succeeding()),
      ),
    ).resolves.toEqual({ ok: true });

    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should not log Health as an outgoing success', async () => {
    const logger = createLogger();
    const interceptor = createInterceptor(logger);

    await expect(
      firstValueFrom(
        interceptor.intercept(
          context({ statusCode: 200, originalUrl: '/api/health' }),
          succeeding(),
        ),
      ),
    ).resolves.toEqual({ ok: true });

    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });

  it('should rethrow without logging so the filter can warn or error', async () => {
    const logger = createLogger();
    const interceptor = createInterceptor(logger);
    const exception = new BadRequestException();

    await expect(
      firstValueFrom(interceptor.intercept(context(), failing(exception))),
    ).rejects.toBe(exception);

    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
  });
});

function createInterceptor(
  logger: LoggerService,
): HttpObservabilityInterceptor {
  return new HttpObservabilityInterceptor(new ObservabilityService(logger));
}

function context(
  overrides: { statusCode?: number; originalUrl?: string } = {},
): ExecutionContext {
  return {
    switchToHttp: () => ({
      getRequest: () => ({
        method: 'GET',
        originalUrl:
          overrides.originalUrl ??
          `${SIGN_IN_PATH}?email=${EMAIL}&password=${PASSWORD}`,
        body: { email: EMAIL, password: PASSWORD, payload: BODY_MARKER },
      }),
      getResponse: () => ({ statusCode: overrides.statusCode ?? 200 }),
    }),
  } as ExecutionContext;
}

function succeeding(): CallHandler {
  return { handle: () => of({ ok: true }) };
}

function failing(exception: unknown): CallHandler {
  return { handle: () => throwError(() => exception) };
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
