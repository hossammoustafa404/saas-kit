import { getQueueToken } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import type { Queue } from 'bullmq';
import type { MailJob } from '../../shared/mail/interfaces/mail-job.interface';
import { MAIL_QUEUE } from '../../shared/mail/mail.constants';
import { MailModule } from '../../shared/mail/mail.module';
import { ObservabilityModule } from '../../shared/observability/observability.module';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { AuthEventsHook } from './hooks/auth-events.hook';
import { OriginGateHook } from './hooks/origin-gate.hook';
import { createAuth } from './lib/auth';

@Module({
  imports: [
    ObservabilityModule,
    BetterAuthModule.forRootAsync({
      imports: [MailModule],
      inject: [PrismaService, getQueueToken(MAIL_QUEUE)],
      useFactory: (prisma: PrismaService, mailQueue: Queue<MailJob>) => ({
        auth: createAuth({ prisma, mailQueue }),
        disableTrustedOriginsCors: true,
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
        },
      }),
    }),
  ],
  providers: [OriginGateHook, AuthEventsHook],
})
export class AuthModule {}
