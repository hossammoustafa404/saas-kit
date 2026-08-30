import { BullMQAdapter } from '@bull-board/api/bullMQAdapter';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Resend } from 'resend';
import type { Env } from '../config/env.schema';
import { ObservabilityModule } from '../observability/observability.module';
import {
  MAIL_KEEP_COMPLETED_JOBS,
  MAIL_KEEP_FAILED_JOBS,
  MAIL_QUEUE,
  MAIL_RETRY_DELAY_MS,
  MAIL_SEND_ATTEMPTS,
  RESEND,
} from './mail.constants';
import { MailQueueEventsListener } from './mail-queue-events.listener';
import { SendMailProcessor } from './send-mail.processor';

@Module({
  imports: [
    ObservabilityModule,
    BullModule.registerQueue({
      name: MAIL_QUEUE,
      defaultJobOptions: {
        attempts: MAIL_SEND_ATTEMPTS,
        backoff: {
          type: 'exponential',
          delay: MAIL_RETRY_DELAY_MS,
        },
        removeOnComplete: MAIL_KEEP_COMPLETED_JOBS,
        removeOnFail: MAIL_KEEP_FAILED_JOBS,
      },
    }),
    BullBoardModule.forFeature({
      name: MAIL_QUEUE,
      adapter: BullMQAdapter,
    }),
  ],
  providers: [
    {
      provide: RESEND,
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) =>
        new Resend(config.get('RESEND_API_KEY', { infer: true })),
    },
    SendMailProcessor,
    MailQueueEventsListener,
  ],
  exports: [BullModule],
})
export class MailModule {}
