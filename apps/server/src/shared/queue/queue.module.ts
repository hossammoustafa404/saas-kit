import { ExpressAdapter } from '@bull-board/express';
import { BullBoardModule } from '@bull-board/nestjs';
import { BullModule } from '@nestjs/bullmq';
import { Global, Module } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import type { Env } from '../config/env.schema';
import { BullBoardAuthMiddleware } from './bull-board-auth.middleware';
import { BULL_BOARD_ROUTE } from './queue.constants';

@Global()
@Module({
  imports: [
    BullModule.forRootAsync({
      inject: [ConfigService],
      useFactory: (config: ConfigService<Env, true>) => ({
        connection: {
          url: config.get('REDIS_URL', { infer: true }),
        },
      }),
    }),
    BullBoardModule.forRoot({
      route: BULL_BOARD_ROUTE,
      adapter: ExpressAdapter,
      middleware: BullBoardAuthMiddleware,
    }),
  ],
  providers: [BullBoardAuthMiddleware],
  exports: [BullModule, BullBoardAuthMiddleware],
})
export class QueueModule {}
