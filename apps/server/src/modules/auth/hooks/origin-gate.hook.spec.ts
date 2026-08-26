import { APIError } from 'better-auth/api';
import type { AuthHookContext } from '@thallesp/nestjs-better-auth';
import { OriginGateHook } from './origin-gate.hook';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  Hook: () => (target: unknown) => target,
  BeforeHook: () => () => undefined,
}));

jest.mock('better-auth', () => ({
  BASE_ERROR_CODES: {
    INVALID_EMAIL_OR_PASSWORD: {
      code: 'INVALID_EMAIL_OR_PASSWORD',
      message: 'Invalid email or password',
    },
    USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL: {
      code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
      message: 'User already exists. Use another email.',
    },
  },
}));

jest.mock('better-auth/api', () => ({
  APIError: class APIError extends Error {
    constructor(
      readonly status: string,
      readonly body?: { code?: string; message?: string },
    ) {
      super(body?.message ?? status);
    }

    static from(
      status: string,
      error: { code: string; message: string },
    ): APIError {
      return new APIError(status, error);
    }
  },
}));

const WEB_ORIGIN = 'http://localhost:3000';
const ADMIN_ORIGIN = 'http://localhost:3001';
const API_ORIGIN = 'http://localhost:9000';

describe('OriginGateHook', () => {
  const prisma = {
    user: {
      findUnique: jest.fn(),
    },
  };
  const config = {
    get: (key: string) =>
      ({
        WEB_ORIGIN,
        ADMIN_ORIGIN,
        BETTER_AUTH_URL: API_ORIGIN,
      })[key],
  };
  const hook = new OriginGateHook(prisma as never, config as never);

  beforeEach(() => {
    prisma.user.findUnique.mockReset();
  });

  describe('beforeSignUp', () => {
    it('should allow sign-up from the web origin', async () => {
      await expect(
        hook.beforeSignUp(createContext(WEB_ORIGIN)),
      ).resolves.toBeUndefined();
    });

    it('should allow sign-up from the API origin', async () => {
      await expect(
        hook.beforeSignUp(createContext(API_ORIGIN)),
      ).resolves.toBeUndefined();
    });

    it('should allow sign-up when Origin is missing', async () => {
      await expect(
        hook.beforeSignUp(createContext(undefined)),
      ).resolves.toBeUndefined();
    });

    it('should reject sign-up from the admin origin', async () => {
      await expect(
        hook.beforeSignUp(createContext(ADMIN_ORIGIN)),
      ).rejects.toThrow(APIError);
    });

    it('should reject sign-up from an untrusted origin', async () => {
      await expect(
        hook.beforeSignUp(createContext('https://evil.example')),
      ).rejects.toThrow(APIError);
    });

    it('should reject sign-up when the email is already registered', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1n });

      await expect(
        hook.beforeSignUp(
          createContext(WEB_ORIGIN, { email: 'casey@example.com' }),
        ),
      ).rejects.toEqual(userAlreadyExistsError());
    });

    it('should reject sign-up when the existing email casing differs', async () => {
      prisma.user.findUnique.mockResolvedValue({ id: 1n });

      await expect(
        hook.beforeSignUp(
          createContext(WEB_ORIGIN, { email: '  Casey@Example.COM  ' }),
        ),
      ).rejects.toEqual(userAlreadyExistsError());

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'casey@example.com' },
        select: { id: true },
      });
    });

    it('should allow sign-up when the email is unknown', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        hook.beforeSignUp(
          createContext(WEB_ORIGIN, { email: 'casey@example.com' }),
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('beforeSignIn', () => {
    it('should allow a Customer to sign in from the web origin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'customer' });

      await expect(
        hook.beforeSignIn(
          createContext(WEB_ORIGIN, { email: 'c@example.com' }),
        ),
      ).resolves.toBeUndefined();
    });

    it('should reject a Super Admin signing in from the web origin as invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'superadmin' });

      await expect(
        hook.beforeSignIn(
          createContext(WEB_ORIGIN, { email: 'a@example.com' }),
        ),
      ).rejects.toEqual(invalidCredentialsError());
    });

    it('should allow a Super Admin to sign in from the admin origin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'superadmin' });

      await expect(
        hook.beforeSignIn(
          createContext(ADMIN_ORIGIN, { email: 'a@example.com' }),
        ),
      ).resolves.toBeUndefined();
    });

    it('should reject a Customer signing in from the admin origin as invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'customer' });

      await expect(
        hook.beforeSignIn(
          createContext(ADMIN_ORIGIN, { email: 'c@example.com' }),
        ),
      ).rejects.toEqual(invalidCredentialsError());
    });

    it('should reject a Customer signing in from the admin origin when email casing differs', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'customer' });

      await expect(
        hook.beforeSignIn(
          createContext(ADMIN_ORIGIN, { email: '  C@Example.COM  ' }),
        ),
      ).rejects.toEqual(invalidCredentialsError());

      expect(prisma.user.findUnique).toHaveBeenCalledWith({
        where: { email: 'c@example.com' },
        select: { role: true },
      });
    });

    it('should allow either Role to sign in from tooling', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ role: 'superadmin' });
      await expect(
        hook.beforeSignIn(
          createContext(API_ORIGIN, { email: 'a@example.com' }),
        ),
      ).resolves.toBeUndefined();

      prisma.user.findUnique.mockResolvedValueOnce({ role: 'customer' });
      await expect(
        hook.beforeSignIn(createContext(undefined, { email: 'c@example.com' })),
      ).resolves.toBeUndefined();
    });

    it('should reject sign-in from an untrusted origin as invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'customer' });

      await expect(
        hook.beforeSignIn(
          createContext('https://evil.example', { email: 'c@example.com' }),
        ),
      ).rejects.toEqual(invalidCredentialsError());
    });

    it('should not reject an unknown email so Better Auth can return invalid credentials', async () => {
      prisma.user.findUnique.mockResolvedValue(null);

      await expect(
        hook.beforeSignIn(
          createContext(ADMIN_ORIGIN, { email: 'nobody@example.com' }),
        ),
      ).resolves.toBeUndefined();
    });
  });

  describe('beforePasswordReset', () => {
    it('should reject forgotten password', async () => {
      await expect(hook.beforePasswordReset()).rejects.toThrow(APIError);
    });
  });
});

function userAlreadyExistsError(): APIError {
  return APIError.from('CONFLICT', {
    code: 'USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL',
    message: 'User already exists. Use another email.',
  });
}

function invalidCredentialsError(): APIError {
  return APIError.from('UNAUTHORIZED', {
    code: 'INVALID_EMAIL_OR_PASSWORD',
    message: 'Invalid email or password',
  });
}

function createContext(
  origin: string | undefined,
  body: Record<string, unknown> = {},
): AuthHookContext {
  return {
    headers: {
      get: (name: string) =>
        name.toLowerCase() === 'origin' ? (origin ?? null) : null,
    },
    body,
  } as AuthHookContext;
}
