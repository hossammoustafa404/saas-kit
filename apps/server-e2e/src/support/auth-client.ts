import axios from 'axios';
import { type Job, Queue } from 'bullmq';

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

export async function readVerificationToken(email: string): Promise<string> {
  const redisUrl = process.env.REDIS_URL;
  if (redisUrl === undefined) {
    throw new Error(
      'REDIS_URL is required to read the queued verification email',
    );
  }

  const queue = new Queue('mail', { connection: { url: redisUrl } });
  const deadline = Date.now() + 5000;
  try {
    while (Date.now() < deadline) {
      const token = tokenFromQueuedMail(
        email,
        await queue.getJobs([
          'waiting',
          'active',
          'delayed',
          'completed',
          'failed',
        ]),
      );
      if (token !== undefined) {
        return token;
      }
      await new Promise((resolve) => setTimeout(resolve, 100));
    }
    throw new Error(`No verification mail job for ${email}`);
  } finally {
    await queue.close();
  }
}

function tokenFromQueuedMail(email: string, jobs: Job[]): string | undefined {
  const job = jobs
    .filter((item) => item.data?.to === email)
    .sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0))[0];
  const text = job?.data?.text;
  if (text === undefined) {
    return undefined;
  }

  const urlMatch = /https?:\/\/\S+/.exec(text);
  if (urlMatch === null) {
    return undefined;
  }

  try {
    return new URL(urlMatch[0]).searchParams.get('token') ?? undefined;
  } catch {
    return undefined;
  }
}

export async function verifyCustomerEmail(email: string) {
  const token = await readVerificationToken(email);
  return axios.get('/api/auth/verify-email', {
    params: { token },
    maxRedirects: 0,
    validateStatus: () => true,
  });
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
