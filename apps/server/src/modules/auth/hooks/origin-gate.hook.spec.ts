import { APIError } from 'better-auth/api';
import type { AuthHookContext } from '@thallesp/nestjs-better-auth';
import { OriginGateHook } from './origin-gate.hook';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  Hook: () => (target: unknown) => target,
  BeforeHook: () => () => undefined,
}));

jest.mock('better-auth/api', () => ({
  APIError: class APIError extends Error {
    constructor(
      readonly status: string,
      readonly body?: { message?: string },
    ) {
      super(body?.message ?? status);
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
  const hook = new OriginGateHook(
    prisma as never,
    config as never,
  );

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
      await expect(hook.beforeSignUp(createContext(ADMIN_ORIGIN))).rejects.toThrow(
        APIError,
      );
    });

    it('should reject sign-up from an untrusted origin', async () => {
      await expect(
        hook.beforeSignUp(createContext('https://evil.example')),
      ).rejects.toThrow(APIError);
    });
  });

  describe('beforeSignIn', () => {
    it('should allow a Customer to sign in from the web origin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'customer' });

      await expect(
        hook.beforeSignIn(createContext(WEB_ORIGIN, { email: 'c@example.com' })),
      ).resolves.toBeUndefined();
    });

    it('should reject an Admin signing in from the web origin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'admin' });

      await expect(
        hook.beforeSignIn(createContext(WEB_ORIGIN, { email: 'a@example.com' })),
      ).rejects.toThrow(APIError);
    });

    it('should allow an Admin to sign in from the admin origin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'admin' });

      await expect(
        hook.beforeSignIn(
          createContext(ADMIN_ORIGIN, { email: 'a@example.com' }),
        ),
      ).resolves.toBeUndefined();
    });

    it('should reject a Customer signing in from the admin origin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'customer' });

      await expect(
        hook.beforeSignIn(
          createContext(ADMIN_ORIGIN, { email: 'c@example.com' }),
        ),
      ).rejects.toThrow(APIError);
    });

    it('should allow either Role to sign in from tooling', async () => {
      prisma.user.findUnique.mockResolvedValueOnce({ role: 'admin' });
      await expect(
        hook.beforeSignIn(createContext(API_ORIGIN, { email: 'a@example.com' })),
      ).resolves.toBeUndefined();

      prisma.user.findUnique.mockResolvedValueOnce({ role: 'customer' });
      await expect(
        hook.beforeSignIn(createContext(undefined, { email: 'c@example.com' })),
      ).resolves.toBeUndefined();
    });

    it('should reject sign-in from an untrusted origin', async () => {
      prisma.user.findUnique.mockResolvedValue({ role: 'customer' });

      await expect(
        hook.beforeSignIn(
          createContext('https://evil.example', { email: 'c@example.com' }),
        ),
      ).rejects.toThrow(APIError);
    });
  });
});

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
