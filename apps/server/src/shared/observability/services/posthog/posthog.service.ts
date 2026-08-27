import {
  Injectable,
  Logger,
  Optional,
  type LoggerService,
  type OnModuleDestroy,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PostHog } from 'posthog-node';
import type { Env } from '../../../config/env.schema';
import type {
  CaptureClient,
  CaptureEvent,
  PosthogClient,
} from '../../interfaces';
import { isObservabilityEnabled } from '../../utils';

@Injectable()
export class PosthogService implements CaptureClient, OnModuleDestroy {
  private readonly logger: LoggerService;
  private readonly posthogClient: PosthogClient;

  constructor(
    configService: ConfigService<Env, true>,
    @Optional() logger?: LoggerService,
  ) {
    this.logger = logger ?? new Logger(PosthogService.name);
    this.posthogClient = this.createClient(configService);
  }

  capture(event: CaptureEvent): void {
    try {
      this.posthogClient.capture(event);
    } catch (error) {
      this.logger.error?.(
        'Failed to capture Event',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  async onModuleDestroy(): Promise<void> {
    try {
      await this.posthogClient.shutdown();
    } catch (error) {
      this.logger.error?.(
        'Failed to shutdown PostHog',
        error instanceof Error ? error.stack : undefined,
      );
    }
  }

  private createClient(configService: ConfigService<Env, true>): PosthogClient {
    const env = {
      POSTHOG_API_KEY: configService.get('POSTHOG_API_KEY', { infer: true }),
      POSTHOG_HOST: configService.get('POSTHOG_HOST', { infer: true }),
    };

    if (!isObservabilityEnabled(env)) {
      return this.createNoopPosthogClient();
    }

    const token = env.POSTHOG_API_KEY;
    const client = new PostHog(token as string, {
      host: env.POSTHOG_HOST,
    });

    client.on('error', (error: unknown) => {
      this.logger.error?.(
        'PostHog client error',
        error instanceof Error ? error.stack : undefined,
      );
    });

    return {
      capture(event) {
        client.capture(event);
      },
      shutdown() {
        return client.shutdown();
      },
    };
  }

  private createNoopPosthogClient(): PosthogClient {
    return {
      capture(): void {
        return;
      },
      shutdown(): Promise<void> {
        return Promise.resolve();
      },
    };
  }
}
