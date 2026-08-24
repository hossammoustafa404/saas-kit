import { join } from 'node:path';
import { Module } from '@nestjs/common';
import { ConfigModule as NestConfigModule } from '@nestjs/config';
import { EnvSchema } from './env.schema';

@Module({
  imports: [
    NestConfigModule.forRoot({
      isGlobal: true,
      envFilePath: [join(process.cwd(), 'apps/server/.env')],
      validate: (config) => EnvSchema.parse(config),
    }),
  ],
})
export class ConfigModule {}
