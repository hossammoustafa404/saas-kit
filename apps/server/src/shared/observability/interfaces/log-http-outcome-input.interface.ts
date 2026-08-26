import type { HttpOutcomeRequest } from './http-outcome-request.interface';

export interface LogHttpOutcomeInput {
  statusCode: number;
  exception?: unknown;
  request?: HttpOutcomeRequest;
}
