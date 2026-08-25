import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { BASE_ERROR_CODES } from 'better-auth';
import { APIError } from 'better-auth/api';
import {
  type AuthHookContext,
  BeforeHook,
  Hook,
} from '@thallesp/nestjs-better-auth';
import type { Env } from '../../../shared/config/env.schema';
import { PrismaService } from '../../../shared/prisma/prisma.service';

type OriginKind = 'web' | 'admin' | 'tooling' | 'untrusted';
type UserRole = 'admin' | 'customer';

@Hook()
@Injectable()
export class OriginGateHook {
  constructor(
    private readonly prisma: PrismaService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @BeforeHook('/sign-up/email')
  async beforeSignUp(ctx: AuthHookContext): Promise<void> {
    if (!this.isSignUpAllowed(this.classifyOrigin(ctx))) {
      throw new APIError('FORBIDDEN', {
        message: 'Sign-up is not allowed from this origin',
      });
    }

    this.ignoreClientRole(ctx);
  }

  @BeforeHook('/sign-in/email')
  async beforeSignIn(ctx: AuthHookContext): Promise<void> {
    const email = this.emailFromBody(ctx);
    if (!email) {
      return;
    }

    const user = await this.prisma.user.findUnique({
      where: { email },
      select: { role: true },
    });
    if (!user) {
      return;
    }

    const role: UserRole = user.role === 'admin' ? 'admin' : 'customer';
    if (!this.isSignInAllowed(this.classifyOrigin(ctx), role)) {
      this.throwInvalidEmailOrPassword();
    }
  }

  @BeforeHook('/request-password-reset')
  async beforePasswordReset(): Promise<void> {
    throw new APIError('FORBIDDEN', {
      message: 'Forgotten password is not supported',
    });
  }

  private classifyOrigin(ctx: AuthHookContext): OriginKind {
    const origin = this.originFromContext(ctx);
    const webOrigin = this.config.get('WEB_ORIGIN', { infer: true });
    const adminOrigin = this.config.get('ADMIN_ORIGIN', { infer: true });
    const apiOrigin = this.config.get('BETTER_AUTH_URL', { infer: true });

    if (origin === undefined || origin === apiOrigin) {
      return 'tooling';
    }

    if (origin === webOrigin) {
      return 'web';
    }

    if (origin === adminOrigin) {
      return 'admin';
    }

    return 'untrusted';
  }

  private isSignUpAllowed(kind: OriginKind): boolean {
    return kind === 'web' || kind === 'tooling';
  }

  private isSignInAllowed(kind: OriginKind, role: UserRole): boolean {
    if (kind === 'tooling') {
      return true;
    }

    if (kind === 'web') {
      return role === 'customer';
    }

    if (kind === 'admin') {
      return role === 'admin';
    }

    return false;
  }

  private originFromContext(ctx: AuthHookContext): string | undefined {
    const origin = ctx.headers?.get('origin');
    return origin === null || origin === '' ? undefined : origin;
  }

  private emailFromBody(ctx: AuthHookContext): string | undefined {
    const body = ctx.body;
    if (
      body !== null &&
      typeof body === 'object' &&
      'email' in body &&
      typeof body.email === 'string'
    ) {
      const email = body.email.trim().toLowerCase();
      return email === '' ? undefined : email;
    }

    return undefined;
  }

  private throwInvalidEmailOrPassword(): never {
    throw APIError.from(
      'UNAUTHORIZED',
      BASE_ERROR_CODES.INVALID_EMAIL_OR_PASSWORD,
    );
  }

  private ignoreClientRole(ctx: AuthHookContext): void {
    const body = ctx.body;
    if (body !== null && typeof body === 'object' && 'role' in body) {
      delete body.role;
    }
  }
}
