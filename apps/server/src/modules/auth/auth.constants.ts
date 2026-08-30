export const VERIFICATION_EMAIL_SUBJECT = 'Verify your email';
export const INVITATION_EMAIL_SUBJECT = 'You are invited to an Organization';
export const ACCEPT_INVITATION_PATH = '/accept-invitation';
export const DASHBOARD_PATH = '/dashboard';
export const SUPER_ADMIN_CANNOT_HAVE_MEMBERSHIP =
  'Super Admin cannot have a Membership';
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
