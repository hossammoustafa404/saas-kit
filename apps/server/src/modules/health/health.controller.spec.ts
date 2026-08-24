import { Test, TestingModule } from '@nestjs/testing';
import { HealthController } from './health.controller';
import { GetHealthService } from './services';

describe('HealthController', () => {
  let controller: HealthController;
  const getHealth = { execute: jest.fn() };

  beforeAll(async () => {
    const app: TestingModule = await Test.createTestingModule({
      controllers: [HealthController],
      providers: [{ provide: GetHealthService, useValue: getHealth }],
    }).compile();

    controller = app.get(HealthController);
  });

  describe('get', () => {
    it('should return the Health body from get-health', () => {
      getHealth.execute.mockReturnValue({ status: 'ok' });

      expect(controller.get()).toEqual({ status: 'ok' });
      expect(getHealth.execute).toHaveBeenCalled();
    });
  });
});
