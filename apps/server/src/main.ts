import { Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { NestFactory } from '@nestjs/core';
import { ZodValidationPipe } from 'nestjs-zod';
import { AppModule } from './app.module';
import type { Env } from './shared/config/env.schema';
import { setupSwagger } from './shared/swagger/setup-swagger';

async function bootstrap() {
  const app = await NestFactory.create(AppModule, { bodyParser: false });
  const config = app.get(ConfigService<Env, true>);
  const globalPrefix = 'api';
  app.setGlobalPrefix(globalPrefix);
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
  const port = config.get('PORT', { infer: true });
  await app.listen(port);
  Logger.log(
    `🚀 Application is running on: http://localhost:${port}/${globalPrefix}`,
  );
}

bootstrap();
