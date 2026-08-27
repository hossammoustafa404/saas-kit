import type { CaptureEvent } from './capture-event.interface';

export interface CaptureClient {
  capture(event: CaptureEvent): void;
}
