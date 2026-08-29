import {
  AUTH_ERROR_MESSAGES,
  AUTH_ROUTES,
  CHECK_EMAIL_CALLBACK_QUERY_PARAM,
  CHECK_EMAIL_QUERY_PARAM,
} from './constants';

interface AuthClientError {
  code?: string;
  message?: string;
  status?: number;
}

export function isEmailNotVerifiedError(
  error: AuthClientError | null | undefined,
): boolean {
  if (!error) {
    return false;
  }

  return error.code === 'EMAIL_NOT_VERIFIED' || error.status === 403;
}

export function getDashboardCallbackUrl(): string {
  if (typeof window === 'undefined') {
    return AUTH_ROUTES.dashboard;
  }

  return `${window.location.origin}${AUTH_ROUTES.dashboard}`;
}

export function resolveCallbackUrl(callbackUrl?: string): string {
  if (!callbackUrl) {
    return getDashboardCallbackUrl();
  }

  if (callbackUrl.startsWith('http://') || callbackUrl.startsWith('https://')) {
    return callbackUrl;
  }

  if (typeof window === 'undefined') {
    return callbackUrl;
  }

  return `${window.location.origin}${callbackUrl.startsWith('/') ? callbackUrl : `/${callbackUrl}`}`;
}

export function buildCheckEmailUrl(email: string, callbackUrl?: string): string {
  const params = new URLSearchParams({
    [CHECK_EMAIL_QUERY_PARAM]: email,
  });

  if (callbackUrl && callbackUrl !== AUTH_ROUTES.dashboard) {
    params.set(CHECK_EMAIL_CALLBACK_QUERY_PARAM, callbackUrl);
  }

  return `${AUTH_ROUTES.checkEmail}?${params.toString()}`;
}

export function getAuthErrorMessage(error: AuthClientError | null | undefined): string {
  if (!error) {
    return AUTH_ERROR_MESSAGES.DEFAULT;
  }

  if (error.code && error.code in AUTH_ERROR_MESSAGES) {
    return AUTH_ERROR_MESSAGES[error.code as keyof typeof AUTH_ERROR_MESSAGES];
  }

  if (error.status === 403) {
    return AUTH_ERROR_MESSAGES.EMAIL_NOT_VERIFIED;
  }

  if (error.message) {
    return error.message;
  }

  return AUTH_ERROR_MESSAGES.DEFAULT;
}
