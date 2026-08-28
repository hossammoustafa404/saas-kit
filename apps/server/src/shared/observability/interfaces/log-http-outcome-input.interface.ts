import type { HttpOutcomeRequest } from './http-outcome-request.interface';

export interface LogHttpOutcomeInput {
  statusCode: number;
  request: HttpOutcomeRequest;
  exception?: unknown;
}
