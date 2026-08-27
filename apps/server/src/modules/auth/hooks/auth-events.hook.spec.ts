import type { AuthHookContext } from '@thallesp/nestjs-better-auth';
import type { Session } from 'better-auth';
import { AuthEventsHook } from './auth-events.hook';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  Hook: () => (target: unknown) => target,
  DatabaseHook: () => (target: unknown) => target,
  AfterHook: () => () => undefined,
  AfterDelete: () => () => undefined,
}));

const WEB_ORIGIN = 'http://localhost:3000';
const ADMIN_ORIGIN = 'http://localhost:3001';
const API_ORIGIN = 'http://localhost:9000';
const USER_ID = 42;
const EMAIL = 'casey@example.com';
const NAME = 'Casey Customer';
const SESSION_ID = 'session_token_should_never_be_captured';

describe('AuthEventsHook', () => {
  const capture = jest.fn();
  const config = {
    get: (key: string) =>
      ({
        WEB_ORIGIN,
        ADMIN_ORIGIN,
        BETTER_AUTH_URL: API_ORIGIN,
      })[key],
  };
  const hook = new AuthEventsHook({ capture } as never, config as never);

  beforeEach(() => {
    capture.mockReset();
  });

  describe('afterSignUp', () => {
    it('should capture user signed up for a Customer from the web origin', async () => {
      await hook.afterSignUp(
        createContext({
          path: '/sign-up/email',
          origin: WEB_ORIGIN,
          returned: {
            token: null,
            user: createUser(),
          },
        }),
      );

      expectCaptured(capture, {
        event: 'user signed up',
        originKind: 'web',
        role: 'customer',
      });
    });

    it('should capture origin_kind tooling when Origin is missing', async () => {
      await hook.afterSignUp(
        createContext({
          path: '/sign-up/email',
          returned: { token: null, user: createUser() },
        }),
      );

      expectCaptured(capture, {
        event: 'user signed up',
        originKind: 'tooling',
      });
    });

    it('should capture origin_kind tooling from the API origin', async () => {
      await hook.afterSignUp(
        createContext({
          path: '/sign-up/email',
          origin: API_ORIGIN,
          returned: { token: null, user: createUser() },
        }),
      );

      expectCaptured(capture, {
        event: 'user signed up',
        originKind: 'tooling',
      });
    });

    it('should capture origin_kind tooling from an untrusted origin', async () => {
      await hook.afterSignUp(
        createContext({
          path: '/sign-up/email',
          origin: 'https://evil.example',
          returned: { token: null, user: createUser() },
        }),
      );

      expectCaptured(capture, {
        event: 'user signed up',
        originKind: 'tooling',
      });
    });

    it('should not also capture user signed in', async () => {
      await hook.afterSignUp(
        createContext({
          path: '/sign-up/email',
          origin: WEB_ORIGIN,
          returned: { token: null, user: createUser() },
        }),
      );

      expect(capture.mock.calls.map((call) => call[0].event)).toEqual([
        'user signed up',
      ]);
    });
  });

  describe('afterSignIn', () => {
    it('should capture user signed in for a Super Admin from the admin origin', async () => {
      await hook.afterSignIn(
        createContext({
          path: '/sign-in/email',
          origin: ADMIN_ORIGIN,
          newSessionUser: createUser({ role: 'superadmin' }),
        }),
      );

      expectCaptured(capture, {
        event: 'user signed in',
        originKind: 'admin',
        role: 'superadmin',
      });
    });

    it('should not capture when sign-in returned an error', async () => {
      await hook.afterSignIn(
        createContext({
          path: '/sign-in/email',
          origin: WEB_ORIGIN,
          returned: new Error('UNAUTHORIZED'),
        }),
      );

      expect(capture).not.toHaveBeenCalled();
    });
  });

  describe('afterSessionDelete', () => {
    it('should capture user signed out from the deleted Session', async () => {
      await hook.afterSessionDelete(
        createSession(),
        createContext({ path: '/sign-out', origin: WEB_ORIGIN }),
      );

      expectCaptured(capture, {
        event: 'user signed out',
        originKind: 'web',
      });
    });

    it('should capture user signed out for a Super Admin from the admin origin', async () => {
      const ctx = createContext({
        path: '/sign-out',
        origin: ADMIN_ORIGIN,
        sessionUser: createUser({ role: 'superadmin' }),
      });

      await hook.afterSessionDelete(createSession(), ctx);

      expectCaptured(capture, {
        event: 'user signed out',
        originKind: 'admin',
        role: 'superadmin',
      });
    });

    it('should not capture when the path is not sign-out', async () => {
      await hook.afterSessionDelete(
        createSession(),
        createContext({ path: '/revoke-session', origin: WEB_ORIGIN }),
      );

      expect(capture).not.toHaveBeenCalled();
    });

    it('should not capture when the endpoint context is missing', async () => {
      await hook.afterSessionDelete(createSession(), null);

      expect(capture).not.toHaveBeenCalled();
    });

    it('should not capture when the User is missing', async () => {
      const ctx = createContext({ path: '/sign-out', origin: WEB_ORIGIN });
      ctx.context.internalAdapter.findUserById = jest
        .fn()
        .mockResolvedValue(null);

      await hook.afterSessionDelete(createSession(), ctx);

      expect(capture).not.toHaveBeenCalled();
    });
  });
});

function expectCaptured(
  captureFn: jest.Mock,
  options: {
    event: string;
    originKind?: 'web' | 'admin' | 'tooling';
    role?: 'customer' | 'superadmin';
  },
): void {
  expect(captureFn).toHaveBeenCalledTimes(1);
  const payload = captureFn.mock.calls[0][0] as {
    distinctId: string;
    event: string;
    properties: Record<string, unknown>;
  };
  expect(payload).toEqual({
    distinctId: '42',
    event: options.event,
    properties: {
      role: options.role ?? 'customer',
      source: 'server',
      ...(options.originKind === undefined
        ? {}
        : { origin_kind: options.originKind }),
    },
  });
  expectNoPii(captureFn);
}

function createUser(
  overrides: {
    id?: string | number | bigint;
    role?: string;
  } = {},
) {
  return {
    id: overrides.id ?? USER_ID,
    role: overrides.role ?? 'customer',
    email: EMAIL,
    name: NAME,
  };
}

function createSession(): Session {
  return {
    id: 'sess_1',
    userId: String(USER_ID),
    token: SESSION_ID,
    expiresAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

function createContext(options: {
  path: string;
  origin?: string;
  returned?: unknown;
  sessionUser?: ReturnType<typeof createUser>;
  sessionId?: string;
  newSessionUser?: ReturnType<typeof createUser>;
}): AuthHookContext {
  return {
    path: options.path,
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'origin' ? (options.origin ?? null) : null,
    },
    context: {
      returned: options.returned,
      session:
        options.sessionUser === undefined
          ? null
          : {
              session: { id: options.sessionId ?? SESSION_ID },
              user: options.sessionUser,
            },
      newSession:
        options.newSessionUser === undefined
          ? null
          : {
              session: { id: options.sessionId ?? SESSION_ID },
              user: options.newSessionUser,
            },
      internalAdapter: {
        findUserById: jest
          .fn()
          .mockResolvedValue(options.sessionUser ?? createUser()),
      },
    },
  } as AuthHookContext;
}

function expectNoPii(captureFn: jest.Mock): void {
  const serialized = JSON.stringify(captureFn.mock.calls);
  expect(serialized).not.toContain(EMAIL);
  expect(serialized).not.toContain(NAME);
  expect(serialized).not.toContain(SESSION_ID);
}
