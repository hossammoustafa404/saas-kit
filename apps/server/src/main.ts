import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import { AUTH_DOCS_ROUTE } from './modules/auth';
import type { Env } from './shared/config/env.schema';
import { BULL_BOARD_ROUTE } from './shared/queue/queue.constants';
import { setupSwagger } from './shared/swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService<Env, true>);
  const globalPrefix = 'api';
  const port = config.get('PORT', { infer: true });

  app.setGlobalPrefix(globalPrefix, {
    exclude: [{ path: BULL_BOARD_ROUTE.slice(1), method: RequestMethod.ALL }],
  });
  app.enableCors({
    origin: [
      config.get('WEB_ORIGIN', { infer: true }),
      config.get('ADMIN_ORIGIN', { infer: true }),
      config.get('BETTER_AUTH_URL', { infer: true }),
    ],
    credentials: true,
  });
  app.useGlobalPipes(new ZodValidationPipe());

  setupSwagger(app);

  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
  Logger.log(`Better Auth docs: http://localhost:${port}${AUTH_DOCS_ROUTE}`);
  Logger.log(`Bull Board: http://localhost:${port}${BULL_BOARD_ROUTE}`);
}

bootstrap();
