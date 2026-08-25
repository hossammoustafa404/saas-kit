import type { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';
import { cleanupOpenApiDoc } from 'nestjs-zod';

export function setupSwagger(app: INestApplication) {
  const config = new DocumentBuilder()
    .setTitle('SaaS Kit API')
    .setDescription(
      'REST API for application resources. Authentication routes are documented at /api/auth/reference.',
    )
    .setVersion('1.0')
    .addCookieAuth('better-auth.session_token')
    .build();

  const document = cleanupOpenApiDoc(
    SwaggerModule.createDocument(app, config, {
      operationIdFactory: (controllerKey, methodKey) =>
        `${controllerKey.replace(/Controller$/, '')}_${methodKey}`,
    }),
  );
  document.components = document.components ?? {};
  document.components.securitySchemes = {
    ...document.components.securitySchemes,
    'better-auth.session_token': {
      type: 'apiKey',
      in: 'cookie',
      name: 'better-auth.session_token',
    },
  };

  SwaggerModule.setup('docs', app, document, {
    useGlobalPrefix: true,
    jsonDocumentUrl: 'docs-json',
    swaggerOptions: {
      persistAuthorization: true,
      withCredentials: true,
      tagsSorter: 'alpha',
      operationsSorter: 'alpha',
      docExpansion: 'list',
    },
  });
}
