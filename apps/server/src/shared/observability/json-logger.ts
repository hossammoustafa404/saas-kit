import type { LoggerService } from '@nestjs/common';
import {
  context as otelContext,
  isSpanContextValid,
  trace,
} from '@opentelemetry/api';
import { logs, SeverityNumber } from '@opentelemetry/api-logs';
import { LogLevel } from './enums';
import type { JsonLogLine } from './interfaces';
import {
  LOG_SPAN_ID,
  LOG_TRACE_ID,
  OTEL_SERVICE_NAME,
} from './observability.constants';

export class JsonLogger implements LoggerService {
  private readonly otelLogger = logs.getLogger(OTEL_SERVICE_NAME);

  constructor(
    private readonly writeLine: (line: string) => void = JsonLogger.writeStdout,
  ) {}

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
      level,
      message: this.stringifyMessage(message),
    };
    const context = this.contextFrom(optionalParams);
    if (context !== undefined) {
      line.context = context;
    }

    const spanContext = trace.getActiveSpan()?.spanContext();
    if (spanContext !== undefined && isSpanContextValid(spanContext)) {
      line[LOG_TRACE_ID] = spanContext.traceId;
      line[LOG_SPAN_ID] = spanContext.spanId;
    }

    this.writeLine(JSON.stringify(line));
    this.emitOtel(line);
  }

  private emitOtel(line: JsonLogLine): void {
    try {
      this.otelLogger.emit({
        severityNumber: this.severityNumber(line.level),
        severityText: line.level.toUpperCase(),
        body: line.message,
        attributes:
          line.context === undefined ? undefined : { context: line.context },
        context: otelContext.active(),
      });
    } catch (error) {
      this.writeLine(
        JSON.stringify({
          level: LogLevel.Error,
          message: `Failed to emit OpenTelemetry Log${
            error instanceof Error ? `: ${error.message}` : ''
          }`,
          context: JsonLogger.name,
        }),
      );
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

  private static writeStdout(line: string): void {
    process.stdout.write(`${line}\n`);
  }
}
