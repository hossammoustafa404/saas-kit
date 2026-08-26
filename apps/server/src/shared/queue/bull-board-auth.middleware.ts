import type { IncomingMessage, ServerResponse } from 'node:http';
import {
  ForbiddenException,
  Injectable,
  Logger,
  NestMiddleware,
  UnauthorizedException,
} from '@nestjs/common';
import { AuthService } from '@thallesp/nestjs-better-auth';
import { fromNodeHeaders } from 'better-auth/node';
import type { Auth } from '../../modules/auth';
import { UserRole } from '../../modules/auth/enums';

@Injectable()
export class BullBoardAuthMiddleware implements NestMiddleware {
  private readonly logger = new Logger(BullBoardAuthMiddleware.name);

  constructor(private readonly authService: AuthService<Auth>) {}

  async use(
    req: IncomingMessage,
    _res: ServerResponse,
    next: (error?: unknown) => void,
  ): Promise<void> {
    const session = await this.authService.api.getSession({
      headers: fromNodeHeaders(req.headers),
    });

    if (session === null || session === undefined) {
      this.logger.warn('Rejected Bull Board access without a Session');
      next(new UnauthorizedException());
      return;
    }

    if (session.user.role !== UserRole.SuperAdmin) {
      this.logger.warn('Rejected Bull Board access without a Super Admin Role');
      next(new ForbiddenException());
      return;
    }

    next();
  }
}
