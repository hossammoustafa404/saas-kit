import { Module } from '@nestjs/common';
import { HealthModule } from './modules/health';
import { ConfigModule } from './shared/config/config.module';
import { PrismaModule } from './shared/prisma/prisma.module';

@Module({
  imports: [ConfigModule, PrismaModule, HealthModule],
})
export class AppModule {}
