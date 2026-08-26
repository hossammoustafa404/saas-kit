import { ForbiddenException, Logger, UnauthorizedException } from '@nestjs/common';
import { UserRole } from '../../modules/auth/enums';
import { BullBoardAuthMiddleware } from './bull-board-auth.middleware';

jest.mock('@thallesp/nestjs-better-auth', () => ({
  AuthService: class AuthService {},
}));

jest.mock('better-auth/node', () => ({
  fromNodeHeaders: (headers: unknown) => headers,
}));

describe('BullBoardAuthMiddleware', () => {
  const authService = {
    api: {
      getSession: jest.fn(),
    },
  };
  const middleware = new BullBoardAuthMiddleware(authService as never);
  const req = { headers: {} };

  beforeAll(() => {
    jest.spyOn(Logger.prototype, 'warn').mockImplementation();
  });

  beforeEach(() => {
    authService.api.getSession.mockReset();
  });

  it('should reject a caller without a Session', async () => {
    authService.api.getSession.mockResolvedValue(null);
    const next = jest.fn();

    await middleware.use(req as never, {} as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(UnauthorizedException));
  });

  it('should reject a Customer Session', async () => {
    authService.api.getSession.mockResolvedValue({
      user: { role: UserRole.Customer },
    });
    const next = jest.fn();

    await middleware.use(req as never, {} as never, next);

    expect(next).toHaveBeenCalledWith(expect.any(ForbiddenException));
  });

  it('should allow a Super Admin Session', async () => {
    authService.api.getSession.mockResolvedValue({
      user: { role: UserRole.SuperAdmin },
    });
    const next = jest.fn();

    await middleware.use(req as never, {} as never, next);

    expect(next).toHaveBeenCalledWith();
  });
});
