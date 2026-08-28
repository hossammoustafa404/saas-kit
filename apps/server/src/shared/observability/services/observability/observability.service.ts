import { STATUS_CODES } from 'node:http';
import {
  HttpException,
  Injectable,
  Logger,
  Optional,
  type LoggerService,
} from '@nestjs/common';
import type { HttpOutcomeRequest, LogHttpOutcomeInput } from '../../interfaces';
import {
  HEALTH_TRACE_METHOD,
  HEALTH_TRACE_PATH,
  MIN_CLIENT_ERROR,
  MIN_SERVER_ERROR,
  UNKNOWN_ROUTE,
  UNKNOWN_STATUS_REASON,
} from '../../observability.constants';

@Injectable()
export class ObservabilityService {
  private readonly logger: LoggerService;

  constructor(@Optional() logger?: LoggerService) {
    this.logger = logger ?? new Logger(ObservabilityService.name);
  }

  logIncomingReq(request: HttpOutcomeRequest): void {
    if (this.isHealth(request)) {
      return;
    }

    this.logger.log?.(`Incoming Request: ${this.route(request)}`);
  }

  logOutcomingRes({
    statusCode,
    request,
    exception,
  }: LogHttpOutcomeInput): void {
    const message = this.outgoingMessage(statusCode, request, exception);

    if (statusCode >= MIN_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      if (stack === undefined) {
        this.logger.error?.(message);
      } else {
        this.logger.error?.(message, stack);
      }
      return;
    }

    if (statusCode >= MIN_CLIENT_ERROR) {
      this.logger.warn?.(message);
      return;
    }

    this.logger.log?.(message);
  }

  isHealth(request: HttpOutcomeRequest): boolean {
    return (
      request.method === HEALTH_TRACE_METHOD &&
      this.pathWithoutQuery(request.originalUrl ?? request.url) ===
        HEALTH_TRACE_PATH
    );
  }

  private outgoingMessage(
    statusCode: number,
    request: HttpOutcomeRequest,
    exception: unknown,
  ): string {
    const reason = STATUS_CODES[statusCode] ?? UNKNOWN_STATUS_REASON;
    const errorMessage = this.exceptionMessage(exception);
    const detail =
      statusCode >= MIN_CLIENT_ERROR &&
      errorMessage !== undefined &&
      errorMessage !== reason
        ? ` - ${errorMessage}`
        : '';
    return `Outcoming Response: ${this.route(request)} ${statusCode} ${reason}${detail}`;
  }

  private exceptionMessage(exception: unknown): string | undefined {
    if (exception instanceof HttpException) {
      return this.httpExceptionMessage(exception);
    }

    if (exception instanceof Error && exception.message !== '') {
      return exception.message;
    }

    if (
      typeof exception === 'object' &&
      exception !== null &&
      'message' in exception &&
      typeof exception.message === 'string' &&
      exception.message !== ''
    ) {
      return exception.message;
    }

    return undefined;
  }

  private httpExceptionMessage(exception: HttpException): string | undefined {
    const response = exception.getResponse();
    if (typeof response === 'string' && response !== '') {
      return response;
    }

    if (
      typeof response === 'object' &&
      response !== null &&
      'message' in response
    ) {
      const { message } = response;
      if (typeof message === 'string' && message !== '') {
        return message;
      }

      if (Array.isArray(message)) {
        const parts = message.filter(
          (part): part is string => typeof part === 'string' && part !== '',
        );
        if (parts.length > 0) {
          return parts.join('; ');
        }
      }
    }

    return exception.message === '' ? undefined : exception.message;
  }

  private route(request: HttpOutcomeRequest): string {
    const path =
      this.pathWithoutQuery(request.originalUrl ?? request.url) ?? UNKNOWN_ROUTE;

    return request.method === undefined ? path : `${request.method} ${path}`;
  }

  private pathWithoutQuery(url: string | undefined): string | undefined {
    if (url === undefined || url === '') {
      return undefined;
    }

    const queryIndex = url.search(/[?#]/);
    return queryIndex === -1 ? url : url.slice(0, queryIndex);
  }
}
