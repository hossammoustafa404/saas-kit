import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth';
import { HealthModule } from './modules/health';
import { ConfigModule } from './shared/config/config.module';
import { MailModule } from './shared/mail/mail.module';
import { ObservabilityModule } from './shared/observability/observability.module';
import { PrismaModule } from './shared/prisma/prisma.module';
import { QueueModule } from './shared/queue/queue.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ObservabilityModule,
    QueueModule,
    MailModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
