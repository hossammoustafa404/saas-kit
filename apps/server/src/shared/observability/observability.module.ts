import {
  Module,
  RequestMethod,
  type BeforeApplicationShutdown,
  type MiddlewareConsumer,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR } from '@nestjs/core';
import { HttpObservabilityFilter } from './filters';
import { HttpObservabilityInterceptor } from './interceptors';
import { shutdownOtel } from './lib/otel';
import { HttpObservabilityMiddleware } from './middlewares';
import { AUTH_TRACE_PATH_PREFIX } from './observability.constants';
import { ObservabilityService, PosthogService } from './services';

@Module({
  providers: [
    ObservabilityService,
    PosthogService,
    HttpObservabilityMiddleware,
    {
      provide: APP_FILTER,
      useClass: HttpObservabilityFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpObservabilityInterceptor,
    },
  ],
  exports: [ObservabilityService, PosthogService],
})
export class ObservabilityModule
  implements NestModule, BeforeApplicationShutdown
{
  configure(consumer: MiddlewareConsumer): void {
    const authPath = AUTH_TRACE_PATH_PREFIX.slice(1);

    consumer
      .apply(HttpObservabilityMiddleware)
      .exclude(
        { path: authPath, method: RequestMethod.ALL },
        { path: `${authPath}/(.*)`, method: RequestMethod.ALL },
      )
      .forRoutes('*');
  }

  async beforeApplicationShutdown(): Promise<void> {
    await shutdownOtel();
  }
}
