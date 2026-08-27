import {
  BadRequestException,
  ConflictException,
  ForbiddenException,
  InternalServerErrorException,
  NotFoundException,
  UnauthorizedException,
  type CallHandler,
  type ExecutionContext,
} from '@nestjs/common';
import { SpanStatusCode, trace } from '@opentelemetry/api';
import { firstValueFrom, of, throwError } from 'rxjs';
import { HttpSpanStatusInterceptor } from './http-span-status.interceptor';

jest.mock('@opentelemetry/api', () => {
  const actual = jest.requireActual('@opentelemetry/api');
  return {
    ...actual,
    trace: {
      ...actual.trace,
      getActiveSpan: jest.fn(),
    },
  };
});

describe('HttpSpanStatusInterceptor', () => {
  const interceptor = new HttpSpanStatusInterceptor();
  const span = {
    recordException: jest.fn(),
    setStatus: jest.fn(),
  };

  beforeEach(() => {
    span.recordException.mockReset();
    span.setStatus.mockReset();
    jest.mocked(trace.getActiveSpan).mockReturnValue(span as never);
  });

  it.each([
    ['400 Bad Request', () => new BadRequestException()],
    ['401 Unauthorized', () => new UnauthorizedException()],
    ['403 Forbidden', () => new ForbiddenException()],
    ['404 Not Found', () => new NotFoundException()],
    ['409 Conflict', () => new ConflictException()],
  ] as const)(
    'should leave span status unset for a thrown %s',
    async (_label, createException) => {
      const exception = createException();

      await expect(
        firstValueFrom(interceptor.intercept(context(), failing(exception))),
      ).rejects.toBe(exception);

      expect(span.recordException).not.toHaveBeenCalled();
      expect(span.setStatus).not.toHaveBeenCalled();
    },
  );

  it('should mark the span Error and record the exception for a thrown 500', async () => {
    const exception = new InternalServerErrorException();

    await expect(
      firstValueFrom(interceptor.intercept(context(), failing(exception))),
    ).rejects.toBe(exception);

    expect(span.recordException).toHaveBeenCalledTimes(1);
    expect(span.recordException).toHaveBeenCalledWith(exception);
    expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
  });

  it('should mark the span Error and record an unknown throw as a server failure', async () => {
    const exception = new Error('boom');

    await expect(
      firstValueFrom(interceptor.intercept(context(), failing(exception))),
    ).rejects.toBe(exception);

    expect(span.recordException).toHaveBeenCalledWith(exception);
    expect(span.setStatus).toHaveBeenCalledWith({ code: SpanStatusCode.ERROR });
  });

  it('should not throw when a 500 is thrown and there is no active span', async () => {
    jest.mocked(trace.getActiveSpan).mockReturnValue(undefined);
    const exception = new InternalServerErrorException();

    await expect(
      firstValueFrom(interceptor.intercept(context(), failing(exception))),
    ).rejects.toBe(exception);
  });

  it('should leave the span unchanged when the handler succeeds', async () => {
    await expect(
      firstValueFrom(
        interceptor.intercept(context(), { handle: () => of({ ok: true }) }),
      ),
    ).resolves.toEqual({ ok: true });

    expect(span.recordException).not.toHaveBeenCalled();
    expect(span.setStatus).not.toHaveBeenCalled();
  });
});

function context(): ExecutionContext {
  return {} as ExecutionContext;
}

function failing(exception: unknown): CallHandler {
  return { handle: () => throwError(() => exception) };
}
