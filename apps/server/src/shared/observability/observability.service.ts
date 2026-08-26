import { STATUS_CODES } from 'node:http';
import {
  Injectable,
  Logger,
  Optional,
  type LoggerService,
} from '@nestjs/common';
import type {
  HttpOutcomeRequest,
  HttpOutcomeResponse,
  LogHttpOutcomeInput,
} from './interfaces';
import {
  HTTP_OUTCOME_LOGGED,
  MIN_CLIENT_ERROR,
  MIN_SERVER_ERROR,
  UNKNOWN_STATUS_REASON,
} from './observability.constants';

@Injectable()
export class ObservabilityService {
  private readonly logger: LoggerService;

  constructor(@Optional() logger?: LoggerService) {
    this.logger = logger ?? new Logger(ObservabilityService.name);
  }

  log({ statusCode, exception, request }: LogHttpOutcomeInput): boolean {
    if (statusCode < MIN_CLIENT_ERROR) {
      return false;
    }

    const reason = STATUS_CODES[statusCode] ?? UNKNOWN_STATUS_REASON;
    const message = `${statusCode} ${reason}${routeSuffix(request)}`;

    if (statusCode >= MIN_SERVER_ERROR) {
      const stack = exception instanceof Error ? exception.stack : undefined;
      this.logger.error?.(message, stack);
      return true;
    }

    this.logger.warn?.(message);
    return true;
  }

  remember(response: HttpOutcomeResponse): void {
    response[HTTP_OUTCOME_LOGGED] = true;
  }

  hasLogged(response: HttpOutcomeResponse): boolean {
    return Boolean(response[HTTP_OUTCOME_LOGGED]);
  }
}

function routeSuffix(request: HttpOutcomeRequest | undefined): string {
  if (request === undefined) {
    return '';
  }

  const path = pathWithoutQuery(request.originalUrl ?? request.url);
  if (path === undefined) {
    return '';
  }

  return request.method === undefined
    ? ` ${path}`
    : ` ${request.method} ${path}`;
}

function pathWithoutQuery(url: string | undefined): string | undefined {
  if (url === undefined || url === '') {
    return undefined;
  }

  const queryIndex = url.search(/[?#]/);
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}
