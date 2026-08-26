import { RESPONSE_FINISH_EVENT } from '../observability.constants';
import type { HttpOutcomeResponse } from './http-outcome-response.interface';

export interface FinishableHttpOutcomeResponse extends HttpOutcomeResponse {
  on(event: typeof RESPONSE_FINISH_EVENT, listener: () => void): void;
}
