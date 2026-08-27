import type { ClientRequest, IncomingMessage } from 'node:http';
import { join } from 'node:path';
import { Logger } from '@nestjs/common';
import type { Span } from '@opentelemetry/api';
import { getNodeAutoInstrumentations } from '@opentelemetry/auto-instrumentations-node';
import { OTLPTraceExporter } from '@opentelemetry/exporter-trace-otlp-proto';
import { resourceFromAttributes } from '@opentelemetry/resources';
import { NodeSDK } from '@opentelemetry/sdk-node';
import { ATTR_SERVICE_NAME } from '@opentelemetry/semantic-conventions';
import { PrismaInstrumentation } from '@prisma/instrumentation';
import { config as loadEnv } from 'dotenv';
import {
  DEFAULT_POSTHOG_HOST,
  HEALTH_TRACE_METHOD,
  HEALTH_TRACE_PATH,
  OTEL_SERVICE_NAME,
} from './observability.constants';
import { isObservabilityEnabled, posthogOtlp } from './utils';

const logger = new Logger('Otel');

let sdk: NodeSDK | undefined;
let shutdownPromise: Promise<void> | undefined;

export async function startOtel(): Promise<void> {
  loadEnv({ path: join(process.cwd(), 'apps/server/.env') });

  const env = {
    POSTHOG_API_KEY: process.env.POSTHOG_API_KEY?.trim() || undefined,
    POSTHOG_HOST: process.env.POSTHOG_HOST || DEFAULT_POSTHOG_HOST,
  };

  if (!isObservabilityEnabled(env)) {
    return;
  }

  const token = env.POSTHOG_API_KEY;
  if (token === undefined) {
    return;
  }

  const otlp = posthogOtlp({
    POSTHOG_API_KEY: token,
    POSTHOG_HOST: env.POSTHOG_HOST,
  });

  try {
    sdk = new NodeSDK({
      resource: resourceFromAttributes({
        [ATTR_SERVICE_NAME]: OTEL_SERVICE_NAME,
      }),
      traceExporter: new OTLPTraceExporter({
        url: otlp.traces,
        headers: {
          Authorization: `Bearer ${token}`,
        },
      }),
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

  process.once('SIGTERM', () => {
    void shutdownOtel();
  });
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
