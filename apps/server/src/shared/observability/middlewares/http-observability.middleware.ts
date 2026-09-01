import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { HttpOutcomeRequest } from '../interfaces';
import { HTTP_SERVER_REQUESTS_METER } from '../observability.constants';
import { ObservabilityService } from '../services';

@Injectable()
export class HttpObservabilityMiddleware implements NestMiddleware {
  constructor(private readonly observabilityService: ObservabilityService) {}

  use(
    request: HttpOutcomeRequest,
    _response: unknown,
    next: (error?: unknown) => void,
  ): void {
    this.observabilityService.logIncomingReq(request);

    if (!this.observabilityService.isHealth(request)) {
      this.observabilityService.recordMeter(HTTP_SERVER_REQUESTS_METER, {
        'http.method': request.method,
        'http.route': this.observabilityService.requestPath(request),
      });
    }

    next();
  }
}
