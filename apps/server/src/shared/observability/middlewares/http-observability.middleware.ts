import { Injectable, type NestMiddleware } from '@nestjs/common';
import type { HttpOutcomeRequest } from '../interfaces';
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
    next();
  }
}
