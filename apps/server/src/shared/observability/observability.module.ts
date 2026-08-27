import {
  Module,
  type BeforeApplicationShutdown,
  type NestModule,
} from '@nestjs/common';
import { APP_FILTER, APP_INTERCEPTOR, HttpAdapterHost } from '@nestjs/core';
import { HttpOutcomeFilter } from './filters';
import { HttpSpanStatusInterceptor } from './interceptors';
import type {
  FinishableHttpOutcomeResponse,
  HttpOutcomeRequest,
} from './interfaces';
import { RESPONSE_FINISH_EVENT } from './observability.constants';
import { shutdownOtel } from './otel';
import { ObservabilityService, PosthogService } from './services';

@Module({
  providers: [
    ObservabilityService,
    PosthogService,
    {
      provide: APP_FILTER,
      useClass: HttpOutcomeFilter,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: HttpSpanStatusInterceptor,
    },
  ],
  exports: [ObservabilityService, PosthogService],
})
export class ObservabilityModule
  implements NestModule, BeforeApplicationShutdown
{
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly observabilityService: ObservabilityService,
  ) {}

  configure(): void {
    this.adapterHost.httpAdapter.use(
      (
        request: HttpOutcomeRequest,
        response: FinishableHttpOutcomeResponse,
        next: () => void,
      ) => {
        response.on(RESPONSE_FINISH_EVENT, () => {
          if (this.observabilityService.hasLogged(response)) {
            return;
          }

          this.observabilityService.log({
            statusCode: response.statusCode,
            request,
          });
        });
        next();
      },
    );
  }

  async beforeApplicationShutdown(): Promise<void> {
    await shutdownOtel();
  }
}
