import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Session } from 'better-auth';
import {
  type AuthHookContext,
  AfterDelete,
  AfterHook,
  DatabaseHook,
  Hook,
} from '@thallesp/nestjs-better-auth';
import type { Env } from '../../../shared/config/env.schema';
import { PosthogService } from '../../../shared/observability/services';
import { AUTH_EVENT_SOURCE, AuthEvents, AuthPaths } from '../auth.constants';
import { OriginKind } from '../enums';
import type {
  AuthEventUser,
  AuthHookUserContext,
  CaptureAuthEventInput,
} from '../interfaces';

@Hook()
@DatabaseHook()
@Injectable()
export class AuthEventsHook {
  constructor(
    private readonly posthogService: PosthogService,
    private readonly config: ConfigService<Env, true>,
  ) {}

  @AfterHook(AuthPaths.SignUpEmail)
  async afterSignUp(ctx: AuthHookContext): Promise<void> {
    this.captureFromHook(ctx, AuthEvents.UserSignedUp);
  }

  @AfterHook(AuthPaths.SignInEmail)
  async afterSignIn(ctx: AuthHookContext): Promise<void> {
    this.captureFromHook(ctx, AuthEvents.UserSignedIn);
  }

  @AfterDelete('session')
  async afterSessionDelete(
    session: Session,
    ctx: AuthHookContext | null,
  ): Promise<void> {
    if (ctx?.path !== AuthPaths.SignOut) {
      return;
    }

    const user = await ctx.context.internalAdapter.findUserById(
      String(session.userId),
    );

    this.capture({
      event: AuthEvents.UserSignedOut,
      origin: ctx.headers?.get('origin') ?? null,
      user: {
        id: user?.id ?? '',
        role: (user as unknown as AuthEventUser).role,
      },
    });
  }

  private captureFromHook(ctx: AuthHookContext, event: string): void {
    if (ctx.context?.returned instanceof Error) {
      return;
    }

    this.capture({
      event,
      origin: ctx.headers?.get('origin') ?? null,
      user: this.resolveUser(ctx),
    });
  }

  private capture({ event, origin, user }: CaptureAuthEventInput): void {
    this.posthogService.capture({
      distinctId: String(user.id),
      event,
      properties: {
        role: user.role,
        source: AUTH_EVENT_SOURCE,
        origin_kind: this.originKind(origin),
      },
    });
  }

  private originKind(origin: string | null): OriginKind {
    if (origin === this.config.get('WEB_ORIGIN', { infer: true })) {
      return OriginKind.Web;
    }

    if (origin === this.config.get('ADMIN_ORIGIN', { infer: true })) {
      return OriginKind.Admin;
    }

    return OriginKind.Tooling;
  }

  private resolveUser(ctx: AuthHookContext): AuthEventUser {
    switch (ctx.path) {
      case AuthPaths.SignUpEmail:
        return (ctx.context.returned as AuthHookUserContext).user;

      case AuthPaths.SignInEmail:
        return ctx.context.newSession!.user as unknown as AuthEventUser;

      default:
        throw new Error(`Unsupported auth path: ${ctx.path}`);
    }
  }
}
