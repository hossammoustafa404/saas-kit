export interface CaptureEvent {
  distinctId: string;
  event: string;
  properties?: Record<string, unknown>;
}
