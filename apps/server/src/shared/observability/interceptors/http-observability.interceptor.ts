import {
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { tap, type Observable } from 'rxjs';
import type { HttpOutcomeRequest, HttpOutcomeResponse } from '../interfaces';
import { MIN_CLIENT_ERROR } from '../observability.constants';
import { ObservabilityService } from '../services';

@Injectable()
export class HttpObservabilityInterceptor implements NestInterceptor {
  constructor(private readonly observabilityService: ObservabilityService) {}

  intercept(context: ExecutionContext, next: CallHandler): Observable<unknown> {
    const http = context.switchToHttp();
    const request = http.getRequest<HttpOutcomeRequest>();
    const response = http.getResponse<HttpOutcomeResponse>();

    return next.handle().pipe(
      tap(() => {
        if (
          this.observabilityService.isHealth(request) ||
          response.statusCode >= MIN_CLIENT_ERROR
        ) {
          return;
        }

        this.observabilityService.logOutcomingRes({
          statusCode: response.statusCode,
          request,
        });
      }),
    );
  }
}
