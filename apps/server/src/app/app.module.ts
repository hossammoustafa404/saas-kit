import { Module } from '@nestjs/common';
import { ConfigModule } from '../shared/config/config.module';
import { PrismaModule } from '../shared/prisma/prisma.module';
import { AppController } from './app.controller';
import { AppService } from './app.service';

@Module({
  imports: [ConfigModule, PrismaModule],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
