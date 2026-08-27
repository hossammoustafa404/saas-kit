import type { CaptureClient } from './capture-client.interface';

export interface PosthogClient extends CaptureClient {
  shutdown(): Promise<void>;
}
