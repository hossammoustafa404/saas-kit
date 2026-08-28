import type { ClientRequest, IncomingMessage } from 'node:http';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import type { Span } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPLogExporter } from '@opentelemetry/exporter-logs-otlp-proto';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { BatchLogRecordProcessor } from '@opentelemetry/sdk-logs';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { NoopSpanProcessor } from '@opentelemetry/sdk-trace';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { config as loadEnv } from 'dotenv';
import {
  HEALTH_TRACE_METHOD,
  HEALTH_TRACE_PATH,
  OTEL_SERVICE_NAME,
  OTEL_SHUTDOWN_KEEP_ALIVE_MS,
  POSTHOG_OTLP_LOGS_PATH,
  POSTHOG_OTLP_TRACES_PATH,
} from '../observability.constants';

const logger = new Logger('Otel');

let sdk: NodeSDK | undefined;
let shutdownPromise: Promise<void> | undefined;

export async function startOtel(): Promise<void> {
  loadEnv({ path: join(process.cwd(), 'apps/server/.env') });

  try {
    const traces = posthogOtlpExporterOptions(POSTHOG_OTLP_TRACES_PATH);
    const logs = posthogOtlpExporterOptions(POSTHOG_OTLP_LOGS_PATH);

    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
      }),
      metricReaders: [],
      ...(traces === undefined
        ? { spanProcessors: [new NoopSpanProcessor()] }
        : { traceExporter: new OTLPTraceExporter(traces) }),
      logRecordProcessors:
        logs === undefined
          ? []
          : [
              new BatchLogRecordProcessor({
                exporter: new OTLPLogExporter(logs),
              }),
            ],
      instrumentations: [
        getNodeAutoInstrumentations({
          '@opentelemetry/instrumentation-http': {
            ignoreIncomingRequestHook: isHealthTrace,
            requestHook: nameIncomingHttpSpan,
          },
          '@opentelemetry/instrumentation-nestjs-core': {
            enabled: false,
          },
        }),
        new PrismaInstrumentation(),
      ],
    });
    sdk.start();
  } catch (error) {
    sdk = undefined;
    logger.error(
      'Failed to start OpenTelemetry',
      error instanceof Error ? error.stack : undefined,
    );
    return;
  }

  process.once('SIGTERM', handleOtelSigterm);
}

export async function shutdownOtel(): Promise<void> {
  if (shutdownPromise !== undefined) {
    return shutdownPromise;
  }

  if (sdk === undefined) {
    return;
  }

  const running = sdk;
  sdk = undefined;

  shutdownPromise = running.shutdown().catch((error: unknown) => {
    logger.error(
      'Failed to shutdown OpenTelemetry',
      error instanceof Error ? error.stack : undefined,
    );
  });

  return shutdownPromise;
}

export async function handleOtelSigterm(): Promise<void> {
  const keepAlive = setInterval(() => undefined, OTEL_SHUTDOWN_KEEP_ALIVE_MS);
  try {
    await shutdownOtel();
  } finally {
    clearInterval(keepAlive);
  }
}

function posthogOtlpExporterOptions(path: string) {
  const token = process.env.POSTHOG_API_KEY;
  const host = process.env.POSTHOG_HOST;

  if (!token || !host) {
    return undefined;
  }

  return {
    url: `${host}${path}`,
    headers: { Authorization: `Bearer ${token}` },
  };
}

function isHealthTrace(request: IncomingMessage): boolean {
  return (
    request.method === HEALTH_TRACE_METHOD &&
    pathWithoutQuery(request.url) === HEALTH_TRACE_PATH
  );
}

function nameIncomingHttpSpan(
  span: Span,
  request: IncomingMessage | ClientRequest,
): void {
  if (!isIncomingMessage(request) || request.method === undefined) {
    return;
  }

  const path = pathWithoutQuery(request.url);
  if (path === undefined) {
    return;
  }

  span.updateName(`${request.method} ${path}`);
}

function isIncomingMessage(
  request: IncomingMessage | ClientRequest,
): request is IncomingMessage {
  return 'url' in request;
}

function pathWithoutQuery(url: string | undefined): string | undefined {
  if (url === undefined || url === '') {
    return undefined;
  }

  const queryIndex = url.search(/[?#]/);
  return queryIndex === -1 ? url : url.slice(0, queryIndex);
}
