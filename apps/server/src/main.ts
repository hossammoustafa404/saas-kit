import { Logger, RequestMethod } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { ZodValidationPipe } from 'nestjs-zod';
import { AUTH_BASE_PATH, AUTH_DOCS_ROUTE } from './modules/auth/auth.constants';
import type { Env } from './shared/config/env.schema';
import { AppLogger } from './shared/observability/lib/app-logger';
import { startOtel } from './shared/observability/lib/otel';
import { BULL_BOARD_ROUTE } from './shared/queue/queue.constants';
import { setupSwagger } from './shared/swagger/setup-swagger';

async function bootstrap() {
  await startOtel();

  const { NestFactory } = await import('@nestjs/core');
  const { AppModule } = await import('./app.module.js');

  const app = await NestFactory.create(AppModule, {
    bodyParser: false,
    logger: new AppLogger(),
  });
  app.enableShutdownHooks();
  const config = app.get(ConfigService<Env, true>);
  const globalPrefix = 'api';
  const port = config.get('PORT', { infer: true });

  app.setGlobalPrefix(globalPrefix, {
    exclude: [
      { path: BULL_BOARD_ROUTE.slice(1), method: RequestMethod.ALL },
      AUTH_BASE_PATH,
      `${AUTH_BASE_PATH}/*path`,
    ],
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
