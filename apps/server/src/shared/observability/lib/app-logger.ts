import { styleText } from 'node:util';
import type { LoggerService } from '@nestjs/common';
import {
  context as otelContext,
  isSpanContextValid,
  trace,
} from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { LogLevel } from '../enums';
import type { JsonLogLine } from '../interfaces';
import {
  LOG_SPAN_ID,
  LOG_TRACE_ID,
  OTEL_SERVICE_NAME,
} from '../observability.constants';

export class AppLogger implements LoggerService {
  log(message: unknown, ...optionalParams: unknown[]): void {
    this.write(LogLevel.Info, message, optionalParams);
  }

  error(message: unknown, ...optionalParams: unknown[]): void {
    this.write(LogLevel.Error, message, optionalParams);
  }

  warn(message: unknown, ...optionalParams: unknown[]): void {
    this.write(LogLevel.Warn, message, optionalParams);
  }

  debug(message: unknown, ...optionalParams: unknown[]): void {
    this.write(LogLevel.Debug, message, optionalParams);
  }

  verbose(message: unknown, ...optionalParams: unknown[]): void {
    this.write(LogLevel.Verbose, message, optionalParams);
  }

  fatal(message: unknown, ...optionalParams: unknown[]): void {
    this.write(LogLevel.Fatal, message, optionalParams);
  }

  private write(
    level: LogLevel,
    message: unknown,
    optionalParams: unknown[],
  ): void {
    const line: JsonLogLine = {
      timestamp: new Date().toISOString(),
      level,
      message: this.stringifyMessage(message),
    };

    this.assignOptionalParams(line, level, optionalParams);

    const spanContext = trace.getActiveSpan()?.spanContext();
    if (spanContext !== undefined && isSpanContextValid(spanContext)) {
      line[LOG_TRACE_ID] = spanContext.traceId;
      line[LOG_SPAN_ID] = spanContext.spanId;
    }

    this.writeStdout(line);
    this.emitOtel(line);
  }

  private emitOtel(line: JsonLogLine): void {
    try {
      logs.getLogger(OTEL_SERVICE_NAME).emit({
        timestamp: new Date(line.timestamp),
        severityNumber: this.severityNumber(line.level),
        severityText: line.level.toUpperCase(),
        body: line.message,
        attributes: this.otelAttributes(line),
        context: otelContext.active(),
      });
    } catch {
      return;
    }
  }

  private severityNumber(level: LogLevel): SeverityNumber {
    switch (level) {
      case LogLevel.Debug:
        return SeverityNumber.DEBUG;
      case LogLevel.Verbose:
        return SeverityNumber.TRACE;
      case LogLevel.Info:
        return SeverityNumber.INFO;
      case LogLevel.Warn:
        return SeverityNumber.WARN;
      case LogLevel.Error:
        return SeverityNumber.ERROR;
      case LogLevel.Fatal:
        return SeverityNumber.FATAL;
    }
  }

  private assignOptionalParams(
    line: JsonLogLine,
    level: LogLevel,
    optionalParams: unknown[],
  ): void {
    if (level === LogLevel.Error || level === LogLevel.Fatal) {
      const stack = this.stackFrom(optionalParams);
      if (stack !== undefined) {
        line.stack = stack;
      }

      const context = this.errorContextFrom(optionalParams);
      if (context !== undefined) {
        line.context = context;
      }

      return;
    }

    const context = this.contextFrom(optionalParams);
    if (context !== undefined) {
      line.context = context;
    }
  }

  private otelAttributes(line: JsonLogLine): Record<string, string> | undefined {
    if (line.context === undefined && line.stack === undefined) {
      return undefined;
    }

    return {
      ...(line.context === undefined ? {} : { context: line.context }),
      ...(line.stack === undefined ? {} : { stack: line.stack }),
    };
  }

  private stackFrom(optionalParams: unknown[]): string | undefined {
    if (optionalParams.length === 0) {
      return undefined;
    }

    const first = optionalParams[0];
    if (typeof first !== 'string' || first === '') {
      return undefined;
    }

    if (optionalParams.length === 1 && !this.isStack(first)) {
      return undefined;
    }

    return first;
  }

  private errorContextFrom(optionalParams: unknown[]): string | undefined {
    if (optionalParams.length >= 2) {
      const last = optionalParams[optionalParams.length - 1];
      return typeof last === 'string' && last !== '' ? last : undefined;
    }

    const only = optionalParams[0];
    if (typeof only === 'string' && only !== '' && !this.isStack(only)) {
      return only;
    }

    return undefined;
  }

  private isStack(value: string): boolean {
    return value.includes('\n') || value.startsWith('Error:');
  }

  private contextFrom(optionalParams: unknown[]): string | undefined {
    if (optionalParams.length === 0) {
      return undefined;
    }

    const last = optionalParams[optionalParams.length - 1];
    return typeof last === 'string' ? last : undefined;
  }

  private stringifyMessage(message: unknown): string {
    if (typeof message === 'string') {
      return message;
    }

    if (message instanceof Error) {
      return message.message;
    }

    return JSON.stringify(message);
  }

  private writeStdout(line: JsonLogLine): void {
    process.stdout.write(
      `${styleText(this.colorByLevel(line.level), JSON.stringify(line))}\n`,
    );
  }

  private colorByLevel(
    level: LogLevel,
  ): 'magentaBright' | 'cyanBright' | 'green' | 'yellow' | 'red' | 'bold' {
    switch (level) {
      case LogLevel.Debug:
        return 'magentaBright';
      case LogLevel.Verbose:
        return 'cyanBright';
      case LogLevel.Info:
        return 'green';
      case LogLevel.Warn:
        return 'yellow';
      case LogLevel.Error:
        return 'red';
      case LogLevel.Fatal:
        return 'bold';
    }
  }
}
