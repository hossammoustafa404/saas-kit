import { Module } from '@nestjs/common';
import { AuthModule } from './modules/auth';
import { HealthModule } from './modules/health';
import { ConfigModule } from './shared/config/config.module';
import { ObservabilityModule } from './shared/observability/observability.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [
    ConfigModule,
    PrismaModule,
    ObservabilityModule,
    AuthModule,
    HealthModule,
  ],
})
export class AppModule {}
