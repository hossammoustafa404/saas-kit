export const VERIFICATION_EMAIL_SUBJECT = 'Verify your email';
export const AUTH_BASE_PATH = '/api/auth';
export const AUTH_DOCS_ROUTE = `${AUTH_BASE_PATH}/reference`;
export const AUTH_EVENT_SOURCE = 'server';

export const AuthEvents = {
  UserSignedUp: 'user signed up',
  UserSignedIn: 'user signed in',
  UserSignedOut: 'user signed out',
} as const;

export const AuthPaths = {
  SignUpEmail: '/sign-up/email',
  SignInEmail: '/sign-in/email',
  SignOut: '/sign-out',
} as const;
