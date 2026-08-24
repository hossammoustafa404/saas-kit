import { Test } from '@nestjs/testing';
import { GetHealthService } from './get-health.service';

describe('GetHealthService', () => {
  let service: GetHealthService;

  beforeAll(async () => {
    const app = await Test.createTestingModule({
      providers: [GetHealthService],
    }).compile();

    service = app.get(GetHealthService);
  });

  describe('execute', () => {
    it('should return { status: "ok" }', () => {
      expect(service.execute()).toEqual({ status: 'ok' });
    });
  });
});
