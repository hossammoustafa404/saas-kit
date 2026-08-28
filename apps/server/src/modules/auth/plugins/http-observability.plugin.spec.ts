import type { LoggerService } from '@nestjs/common';
import { ObservabilityService } from '../../../shared/observability/services';
import { httpObservabilityPlugin } from './http-observability.plugin';

const EMAIL = 'pii-user@example.com';
const PASSWORD = 'super-secret-password';
const BODY_MARKER = 'do-not-log-this-body';
const SIGN_IN_PATH = '/api/auth/sign-in/email';

describe('httpObservabilityPlugin', () => {
  it('should log an incoming request without email, password, or body', async () => {
    const logger = createLogger();
    const plugin = httpObservabilityPlugin(new ObservabilityService(logger));

    await expect(beforeHook(plugin)(createHookContext())).resolves.toEqual({
      headers: undefined,
    });

    expect(logger.log).toHaveBeenCalledWith(
      `Incoming Request: POST ${SIGN_IN_PATH}`,
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should log an outgoing success without email, password, or body', async () => {
    const logger = createLogger();
    const plugin = httpObservabilityPlugin(new ObservabilityService(logger));

    await expect(afterHook(plugin)(createHookContext())).resolves.toEqual({
      headers: undefined,
    });

    expect(logger.log).toHaveBeenCalledWith(
      `Outcoming Response: POST ${SIGN_IN_PATH} 200 OK`,
    );
    expect(logger.warn).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should warn for an outgoing 401 without email, password, or body', async () => {
    const logger = createLogger();
    const plugin = httpObservabilityPlugin(new ObservabilityService(logger));

    await afterHook(plugin)(
      createHookContext({ returned: { statusCode: 401 } }),
    );

    expect(logger.warn).toHaveBeenCalledWith(
      `Outcoming Response: POST ${SIGN_IN_PATH} 401 Unauthorized`,
    );
    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.error).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should include the returned message on an outgoing 401', async () => {
    const logger = createLogger();
    const plugin = httpObservabilityPlugin(new ObservabilityService(logger));

    await afterHook(plugin)(
      createHookContext({
        returned: { statusCode: 401, message: 'Invalid password' },
      }),
    );

    expect(logger.warn).toHaveBeenCalledWith(
      `Outcoming Response: POST ${SIGN_IN_PATH} 401 Unauthorized - Invalid password`,
    );
    expectNoPii(logger);
  });

  it('should error for an outgoing 500 without email, password, or body', async () => {
    const logger = createLogger();
    const plugin = httpObservabilityPlugin(new ObservabilityService(logger));

    await afterHook(plugin)(
      createHookContext({
        returned: { statusCode: 500 },
      }),
    );

    expect(logger.error).toHaveBeenCalledWith(
      `Outcoming Response: POST ${SIGN_IN_PATH} 500 Internal Server Error`,
    );
    expect(logger.log).not.toHaveBeenCalled();
    expect(logger.warn).not.toHaveBeenCalled();
    expectNoPii(logger);
  });

  it('should include the stack on an outgoing 500 Error', async () => {
    const logger = createLogger();
    const plugin = httpObservabilityPlugin(new ObservabilityService(logger));
    const exception = Object.assign(new Error('auth failed'), {
      statusCode: 500,
    });

    await afterHook(plugin)(createHookContext({ returned: exception }));

    expect(logger.error).toHaveBeenCalledWith(
      `Outcoming Response: POST ${SIGN_IN_PATH} 500 Internal Server Error - auth failed`,
      exception.stack,
    );
    expectNoPii(logger);
  });

  it('should not match programmatic auth.api calls without an HTTP request', () => {
    const plugin = httpObservabilityPlugin(
      new ObservabilityService(createLogger()),
    );

    expect(
      plugin.hooks?.before?.[0]?.matcher({
        path: '/sign-in/email',
        method: 'POST',
        context: {} as never,
      }),
    ).toBe(false);
    expect(
      plugin.hooks?.after?.[0]?.matcher({
        path: '/sign-in/email',
        method: 'POST',
        context: {} as never,
      }),
    ).toBe(false);
  });
});

function beforeHook(
  plugin: ReturnType<typeof httpObservabilityPlugin>,
): (ctx: unknown) => Promise<unknown> {
  const handler = plugin.hooks?.before?.[0]?.handler;
  if (handler === undefined) {
    throw new Error('http-observability before hook is missing');
  }

  return handler as (ctx: unknown) => Promise<unknown>;
}

function afterHook(
  plugin: ReturnType<typeof httpObservabilityPlugin>,
): (ctx: unknown) => Promise<unknown> {
  const handler = plugin.hooks?.after?.[0]?.handler;
  if (handler === undefined) {
    throw new Error('http-observability after hook is missing');
  }

  return handler as (ctx: unknown) => Promise<unknown>;
}

function createHookContext(
  overrides: { returned?: unknown } = {},
): Record<string, unknown> {
  return {
    path: '/sign-in/email',
    method: 'POST',
    request: new Request(
      `http://localhost${SIGN_IN_PATH}?email=${EMAIL}&password=${PASSWORD}`,
      {
        method: 'POST',
        headers: { 'content-type': 'application/json' },
        body: JSON.stringify({
          email: EMAIL,
          password: PASSWORD,
          payload: BODY_MARKER,
        }),
      },
    ),
    context: {
      returned: overrides.returned ?? { ok: true },
    },
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
