import type { LoggerService } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Test } from '@nestjs/testing';
import { PostHog } from 'posthog-node';
import type { Env } from '../../../config/env.schema';
import type { CaptureEvent } from '../../interfaces';
import { PosthogService } from './posthog.service';

jest.mock('posthog-node', () => ({
  PostHog: jest.fn().mockImplementation(() => ({
    capture: jest.fn(),
    shutdown: jest.fn(async () => undefined),
    on: jest.fn(),
  })),
}));

const EVENT: CaptureEvent = {
  distinctId: '42',
  event: 'user signed up',
  properties: { role: 'customer', source: 'server' },
};
const PROJECT_TOKEN = 'phc_test_project_token';
const POSTHOG_HOST = 'https://us.i.posthog.com';

describe('PosthogService', () => {
  beforeEach(() => {
    jest.mocked(PostHog).mockClear();
  });

  describe('when observability is on', () => {
    it('should construct PostHog with the project token and host', () => {
      createService();

      expect(PostHog).toHaveBeenCalledWith(PROJECT_TOKEN, {
        host: POSTHOG_HOST,
      });
    });

    it('should forward capture to the PostHog client', () => {
      const { service } = createService();

      service.capture(EVENT);

      expect(latestPostHog().capture).toHaveBeenCalledTimes(1);
      expect(latestPostHog().capture).toHaveBeenCalledWith(EVENT);
    });

    it('should not throw when capture throws', () => {
      const { service, logger } = createService();
      latestPostHog().capture.mockImplementation(() => {
        throw new Error('PostHog down');
      });

      expect(() => service.capture(EVENT)).not.toThrow();
      expect(logger.error).toHaveBeenCalled();
    });

    it('should log PostHog client errors', () => {
      const { logger } = createService();
      const errorListener = latestPostHog().on.mock.calls[0]?.[1] as (
        error: unknown,
      ) => void;

      errorListener(new Error('socket hang up'));

      expect(logger.error).toHaveBeenCalled();
    });

    it('should shut down the PostHog client on module destroy', async () => {
      const { service } = createService();

      await service.onModuleDestroy();

      expect(latestPostHog().shutdown).toHaveBeenCalledTimes(1);
    });

    it('should not throw when shutdown throws', async () => {
      const { service, logger } = createService();
      latestPostHog().shutdown.mockRejectedValue(
        new Error('PostHog shutdown failed'),
      );

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
      expect(logger.error).toHaveBeenCalled();
    });
  });

  describe('when observability is off', () => {
    it('should not construct PostHog', () => {
      createService({ POSTHOG_API_KEY: undefined });

      expect(PostHog).not.toHaveBeenCalled();
    });

    it('should no-op capture', () => {
      const { service, logger } = createService({
        POSTHOG_API_KEY: undefined,
      });

      expect(() => service.capture(EVENT)).not.toThrow();
      expect(PostHog).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });

    it('should no-op shutdown on module destroy', async () => {
      const { service, logger } = createService({
        POSTHOG_API_KEY: undefined,
      });

      await expect(service.onModuleDestroy()).resolves.toBeUndefined();
      expect(PostHog).not.toHaveBeenCalled();
      expect(logger.error).not.toHaveBeenCalled();
    });
  });

  it('should be constructable by Nest with ConfigService', async () => {
    const module = await Test.createTestingModule({
      providers: [
        PosthogService,
        {
          provide: ConfigService,
          useValue: createConfig({ POSTHOG_API_KEY: undefined }),
        },
      ],
    }).compile();

    expect(module.get(PosthogService)).toBeInstanceOf(PosthogService);
  });
});

function createService(
  env: {
    POSTHOG_API_KEY?: string;
    POSTHOG_HOST?: string;
  } = {},
): {
  service: PosthogService;
  logger: LoggerService & { error: jest.Mock };
} {
  const logger = {
    log: jest.fn(),
    warn: jest.fn(),
    error: jest.fn(),
  };
  return {
    service: new PosthogService(createConfig(env), logger),
    logger,
  };
}

function createConfig(
  overrides: {
    POSTHOG_API_KEY?: string;
    POSTHOG_HOST?: string;
  } = {},
): ConfigService<Env, true> {
  const values: Record<string, string | undefined> = {
    POSTHOG_API_KEY: PROJECT_TOKEN,
    POSTHOG_HOST,
    ...overrides,
  };
  return {
    get: (key: string) => values[key],
  } as ConfigService<Env, true>;
}

function latestPostHog(): {
  capture: jest.Mock;
  shutdown: jest.Mock;
  on: jest.Mock;
} {
  const results = jest.mocked(PostHog).mock.results;
  const last = results[results.length - 1];
  if (last === undefined || last.type !== 'return') {
    throw new Error('PostHog was not constructed');
  }
  return last.value as {
    capture: jest.Mock;
    shutdown: jest.Mock;
    on: jest.Mock;
  };
}
