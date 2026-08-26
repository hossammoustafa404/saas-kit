import { Module, type NestModule } from '@nestjs/common';
import { APP_FILTER, HttpAdapterHost } from '@nestjs/core';
import { HttpOutcomeFilter } from './filters';
import type {
  FinishableHttpOutcomeResponse,
  HttpOutcomeRequest,
} from './interfaces';
import { RESPONSE_FINISH_EVENT } from './observability.constants';
import { ObservabilityService } from './observability.service';

@Module({
  providers: [
    ObservabilityService,
    {
      provide: APP_FILTER,
      useClass: HttpOutcomeFilter,
    },
  ],
  exports: [ObservabilityService],
})
export class ObservabilityModule implements NestModule {
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
}
