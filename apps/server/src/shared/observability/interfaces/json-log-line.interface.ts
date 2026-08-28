import type { LogLevel } from '../enums';

export interface JsonLogLine {
  timestamp: string;
  level: LogLevel;
  message: string;
  context?: string;
  stack?: string;
  trace_id?: string;
  span_id?: string;
}
