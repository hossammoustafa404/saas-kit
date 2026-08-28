import type { LogLevel } from '../enums';

export interface JsonLogLine {
  level: LogLevel;
  message: string;
  context?: string;
  trace_id?: string;
  span_id?: string;
}
