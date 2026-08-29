export const SESSION_COOKIE_NAME = 'better-auth.session_token';
export const CHECK_EMAIL_QUERY_PARAM = 'email';
export const CHECK_EMAIL_CALLBACK_QUERY_PARAM = 'callbackUrl';

export const AUTH_ROUTES = {
  signIn: '/sign-in',
  signUp: '/sign-up',
  checkEmail: '/check-email',
  dashboard: '/dashboard',
  acceptInvitation: '/accept-invitation',
} as const;

export const AUTH_ERROR_MESSAGES = {
  INVALID_EMAIL_OR_PASSWORD: 'Invalid email or password.',
  USER_ALREADY_EXISTS_USE_ANOTHER_EMAIL:
    'An account with this email already exists. Sign in instead.',
  EMAIL_NOT_VERIFIED:
    'Verify your email before signing in. Check your inbox for the verification link — you will be signed in automatically once verified.',
  VERIFICATION_EMAIL_SENT: 'Verification email sent. Check your inbox.',
  RESEND_VERIFICATION_FAILED:
    'Unable to resend the verification email. Please try again.',
  DEFAULT: 'Something went wrong. Please try again.',
} as const;
