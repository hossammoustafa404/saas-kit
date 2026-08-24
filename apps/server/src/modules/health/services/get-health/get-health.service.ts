import { Injectable } from '@nestjs/common';
import type { Health } from '@saas-kit/schemas';

@Injectable()
export class GetHealthService {
  execute(): Health {
    return { status: 'ok' };
  }
}
