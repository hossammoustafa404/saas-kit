import { Module } from '@nestjs/common';
import { HealthController } from './health.controller';
import { GetHealthService } from './services';

@Module({
  controllers: [HealthController],
  providers: [GetHealthService],
})
export class HealthModule {}
