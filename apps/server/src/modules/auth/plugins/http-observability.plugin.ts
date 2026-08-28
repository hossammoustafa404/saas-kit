import type { BetterAuthPlugin, HookEndpointContext } from 'better-auth';
import type { HttpOutcomeRequest } from '../../../shared/observability/interfaces';
import type { ObservabilityService } from '../../../shared/observability/services';
import { AUTH_BASE_PATH } from '../auth.constants';

export function httpObservabilityPlugin(
  observabilityService: ObservabilityService,
): BetterAuthPlugin {
  const matcher = (ctx: { request?: unknown }) => ctx.request instanceof Request;

  return {
    id: 'http-observability',
    hooks: {
      before: [
        {
          matcher,
          handler: async (ctx) => {
            if (isHookEndpointContext(ctx)) {
              observabilityService.logIncomingReq(
                toHttpOutcomeRequest(ctx.method, ctx.path, ctx.request),
              );
            }

            return { headers: undefined };
          },
        },
      ],
      after: [
        {
          matcher,
          handler: async (ctx) => {
            if (isHookEndpointContext(ctx)) {
              observabilityService.logOutcomingRes({
                statusCode: statusCodeOf(ctx.context.returned),
                request: toHttpOutcomeRequest(
                  ctx.method,
                  ctx.path,
                  ctx.request,
                ),
                exception: ctx.context.returned,
              });
            }

            return { headers: undefined };
          },
        },
      ],
    },
  } satisfies BetterAuthPlugin;
}

function isHookEndpointContext(ctx: object): ctx is HookEndpointContext {
  return 'context' in ctx;
}

function toHttpOutcomeRequest(
  method: unknown,
  path: string | undefined,
  request: Request | undefined,
): HttpOutcomeRequest {
  return {
    method: methodOf(method, request),
    originalUrl: routeOf(path, request),
  };
}

function methodOf(
  method: unknown,
  request: Request | undefined,
): string | undefined {
  if (typeof method === 'string' && method !== '') {
    return method;
  }

  return request?.method;
}

function routeOf(
  path: string | undefined,
  request: Request | undefined,
): string | undefined {
  if (request !== undefined) {
    try {
      return new URL(request.url).pathname;
    } catch {
      return joinAuthPath(path);
    }
  }

  return joinAuthPath(path);
}

function joinAuthPath(path: string | undefined): string | undefined {
  if (path === undefined || path === '') {
    return undefined;
  }

  if (path.startsWith(AUTH_BASE_PATH)) {
    return path;
  }

  return `${AUTH_BASE_PATH}${path.startsWith('/') ? path : `/${path}`}`;
}

function statusCodeOf(returned: unknown): number {
  if (returned instanceof Response) {
    return returned.status;
  }

  if (
    typeof returned === 'object' &&
    returned !== null &&
    'statusCode' in returned &&
    typeof returned.statusCode === 'number'
  ) {
    return returned.statusCode;
  }

  return 200;
}
