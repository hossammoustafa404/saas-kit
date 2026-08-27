import type { AuthEventUser } from './auth-event-user.interface';

export interface CaptureAuthEventInput {
  event: string;
  origin: string | null;
  user: AuthEventUser;
}
