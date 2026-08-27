import {
  Catch,
  HttpException,
  HttpStatus,
  type ArgumentsHost,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import type { HttpOutcomeRequest, HttpOutcomeResponse } from '../interfaces';
import { ObservabilityService } from '../services';

@Catch()
export class HttpOutcomeFilter extends BaseExceptionFilter {
  constructor(
    adapterHost: HttpAdapterHost,
    private readonly observabilityService: ObservabilityService,
  ) {
    super(adapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    const http = host.switchToHttp();

    const didLog = this.observabilityService.log({
      statusCode: this.httpStatusOf(exception),
      exception,
      request: http.getRequest<HttpOutcomeRequest>(),
    });

    if (didLog) {
      this.observabilityService.remember(
        http.getResponse<HttpOutcomeResponse>(),
      );
    }

    super.catch(exception, host);
  }

  private httpStatusOf(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
