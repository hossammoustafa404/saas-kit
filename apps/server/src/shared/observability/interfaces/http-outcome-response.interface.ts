import { HTTP_OUTCOME_LOGGED } from '../observability.constants';

export interface HttpOutcomeResponse {
  statusCode: number;
  [HTTP_OUTCOME_LOGGED]?: true;
}
