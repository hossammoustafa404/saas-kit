import {
  HttpException,
  HttpStatus,
  Injectable,
  type CallHandler,
  type ExecutionContext,
  type NestInterceptor,
} from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { catchError, throwError, type Observable } from 'rxjs';
import { MIN_SERVER_ERROR } from '../observability.constants';

@Injectable()
export class HttpSpanStatusInterceptor implements NestInterceptor {
  intercept(
    _context: ExecutionContext,
    next: CallHandler,
  ): Observable<unknown> {
    return next.handle().pipe(
      catchError((exception: unknown) => {
        this.recordServerSpanFailure(exception);
        return throwError(() => exception);
      }),
    );
  }

  private recordServerSpanFailure(exception: unknown): void {
    if (this.httpStatusOf(exception) < MIN_SERVER_ERROR) {
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
