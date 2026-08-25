import { Module } from '@nestjs/common';
import { AuthModule as BetterAuthModule } from '@thallesp/nestjs-better-auth';
import { PrismaService } from '../../shared/prisma/prisma.service';
import { OriginGateHook } from './hooks/origin-gate.hook';
import { createAuth } from './lib/auth';

@Module({
  imports: [
    BetterAuthModule.forRootAsync({
      inject: [PrismaService],
      useFactory: (prisma: PrismaService) => ({
        auth: createAuth(prisma),
        disableTrustedOriginsCors: true,
        bodyParser: {
          json: { limit: '2mb' },
          urlencoded: { limit: '2mb', extended: true },
        },
      }),
    }),
  ],
  providers: [OriginGateHook],
})
export class AuthModule {}
