import {
  Catch,
  HttpException,
  HttpStatus,
  Injectable,
  type ArgumentsHost,
} from '@nestjs/common';
import { BaseExceptionFilter, HttpAdapterHost } from '@nestjs/core';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import type { HttpOutcomeRequest, HttpOutcomeResponse } from '../interfaces';
import { MIN_SERVER_ERROR } from '../observability.constants';
import { ObservabilityService } from '../services';

@Catch()
@Injectable()
export class HttpObservabilityFilter extends BaseExceptionFilter {
  constructor(
    private readonly adapterHost: HttpAdapterHost,
    private readonly observabilityService: ObservabilityService,
  ) {
    super(adapterHost.httpAdapter);
  }

  override catch(exception: unknown, host: ArgumentsHost): void {
    if (host.getType() === 'http') {
      const http = host.switchToHttp();
      this.logHttpOutcome(
        exception,
        http.getRequest<HttpOutcomeRequest>(),
        http.getResponse<HttpOutcomeResponse>(),
      );
    }

    super.catch(exception, host);
  }

  private logHttpOutcome(
    exception: unknown,
    request: HttpOutcomeRequest,
    response: HttpOutcomeResponse,
  ): void {
    if (this.adapterHost.httpAdapter.isHeadersSent(response)) {
      this.observabilityService.logOutcomingRes({
        statusCode: response.statusCode,
        request,
        exception,
      });
      this.recordServerSpanFailure(response.statusCode, exception);
      return;
    }

    const statusCode = this.httpStatusOf(exception);
    this.observabilityService.logOutcomingRes({
      statusCode,
      request,
      exception,
    });
    this.recordServerSpanFailure(statusCode, exception);
  }

  private recordServerSpanFailure(
    statusCode: number,
    exception: unknown,
  ): void {
    if (statusCode < MIN_SERVER_ERROR) {
      return;
    }

    const span = trace.getActiveSpan();
    if (span === undefined) {
      return;
    }

    span.recordException(
      exception instanceof Error ? exception : new Error(String(exception)),
    );
    span.setStatus({ code: SpanStatusCode.ERROR });
  }

  private httpStatusOf(exception: unknown): number {
    if (exception instanceof HttpException) {
      return exception.getStatus();
    }

    return HttpStatus.INTERNAL_SERVER_ERROR;
  }
}
