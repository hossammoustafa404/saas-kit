import { Processor, WorkerHost } from '@nestjs/bullmq';
import { Inject, Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { UnrecoverableError, type Job } from 'bullmq';
import { type ErrorResponse, Resend } from 'resend';
import type { Env } from '../config/env.schema';
import type { MailJob } from './interfaces/mail-job.interface';
import {
  MAIL_QUEUE,
  RESEND,
  RESEND_BLOCKED_MAIL_DOMAINS,
} from './mail.constants';

@Injectable()
@Processor(MAIL_QUEUE)
export class SendMailProcessor extends WorkerHost {
  private readonly logger = new Logger(SendMailProcessor.name);

  constructor(
    @Inject(RESEND) private readonly resend: Resend,
    private readonly config: ConfigService<Env, true>,
  ) {
    super();
  }

  async process(job: Job<MailJob>): Promise<void> {
    const { to, subject, text, html } = job.data;
    if (this.shouldSkipResendRecipient(to)) {
      this.logger.warn('Skipping Resend for a blocked test recipient');
      return;
    }

    const { error } = await this.resend.emails.send({
      from: this.config.get('MAIL_FROM', { infer: true }),
      to,
      subject,
      text,
      html,
    });

    if (error) {
      if (this.isPermanentResendError(error)) {
        throw new UnrecoverableError(error.message);
      }
      throw new Error(error.message);
    }
  }

  private shouldSkipResendRecipient(email: string): boolean {
    if (this.config.get('NODE_ENV', { infer: true }) === 'production') {
      return false;
    }

    return this.isBlockedResendRecipient(email);
  }

  private isBlockedResendRecipient(email: string): boolean {
    const at = email.lastIndexOf('@');
    if (at === -1) {
      return false;
    }

    const domain = email.slice(at + 1).toLowerCase();
    return RESEND_BLOCKED_MAIL_DOMAINS.some(
      (blocked) => domain === blocked || domain.endsWith(`.${blocked}`),
    );
  }

  private isPermanentResendError(error: ErrorResponse): boolean {
    if (error.statusCode === null || error.statusCode === 429) {
      return false;
    }

    return error.statusCode >= 400 && error.statusCode < 500;
  }
}
