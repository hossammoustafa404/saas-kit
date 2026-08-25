import axios from 'axios';

export const WEB_ORIGIN = 'http://localhost:3000';
export const ADMIN_ORIGIN = 'http://localhost:3001';
export const API_ORIGIN = 'http://localhost:9000';

export const SEED_ADMIN_EMAIL =
  process.env.SEED_ADMIN_EMAIL ?? 'admin@example.com';
export const SEED_ADMIN_PASSWORD =
  process.env.SEED_ADMIN_PASSWORD ?? 'password';

export function uniqueCustomerEmail(): string {
  return `customer-${Date.now()}-${Math.round(Math.random() * 1_000_000)}@example.com`;
}

export function cookieHeader(setCookie: string[] | string | undefined): string {
  if (setCookie === undefined) {
    return '';
  }

  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  return values.map((cookie) => cookie.split(';')[0]).join('; ');
}

export function hasSessionCookie(
  setCookie: string[] | string | undefined,
): boolean {
  if (setCookie === undefined) {
    return false;
  }

  const values = Array.isArray(setCookie) ? setCookie : [setCookie];
  return values.some((cookie) => cookie.includes('better-auth.session_token'));
}

export async function signUpCustomer(
  options: {
    origin?: string;
    email?: string;
    name?: string;
    password?: string;
    role?: string;
  } = {},
) {
  return axios.post(
    '/api/auth/sign-up/email',
    {
      name: options.name ?? 'Casey Customer',
      email: options.email ?? uniqueCustomerEmail(),
      password: options.password ?? 'customer-password-1',
      ...(options.role === undefined ? {} : { role: options.role }),
    },
    {
      headers: originHeaders(options.origin),
      validateStatus: () => true,
    },
  );
}

export async function signIn(options: {
  email: string;
  password: string;
  origin?: string;
}) {
  return axios.post(
    '/api/auth/sign-in/email',
    {
      email: options.email,
      password: options.password,
    },
    {
      headers: originHeaders(options.origin),
      validateStatus: () => true,
    },
  );
}

function originHeaders(origin: string | undefined): Record<string, string> {
  if (origin === undefined) {
    return {};
  }

  return { Origin: origin };
}
