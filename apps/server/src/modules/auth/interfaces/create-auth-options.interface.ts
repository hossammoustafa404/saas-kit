import type { MailJob } from '../../../shared/mail/interfaces/mail-job.interface';
import type { ObservabilityService } from '../../../shared/observability/services';
import type { PrismaClient } from '../../../shared/prisma/generated/client';

export interface CreateAuthOptions {
  prisma: PrismaClient;
  mailQueue: {
    add(name: string, data: MailJob): Promise<unknown>;
  };
  observabilityService?: ObservabilityService;
}
