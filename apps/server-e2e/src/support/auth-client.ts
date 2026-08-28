import axios from 'axios';
import { type Job, Queue } from 'bullmq';
import type { AuthSession } from './interfaces';

export type { AuthSession } from './interfaces';

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

export function uniqueOrganizationSlug(): string {
  return `workspace-${Date.now()}-${Math.round(Math.random() * 1_000_000)}`;
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

export async function readQueuedMailText(email: string): Promise<string> {
  const queue = getMailQueue();
  const deadline = Date.now() + 5000;
  while (Date.now() < deadline) {
    const text = textFromQueuedMail(
      email,
      await queue.getJobs([
        'waiting',
        'active',
        'delayed',
        'completed',
        'failed',
      ]),
    );
    if (text !== undefined) {
      return text;
    }
    await new Promise((resolve) => setTimeout(resolve, 100));
  }
  throw new Error(`No mail job for ${email}`);
}

export async function readVerificationToken(email: string): Promise<string> {
  const text = await readQueuedMailText(email);
  const urlMatch = /https?:\/\/\S+/.exec(text);
  if (urlMatch === null) {
    throw new Error(`No verification URL in mail for ${email}`);
  }

  try {
    const token = new URL(urlMatch[0]).searchParams.get('token');
    if (token !== null && token !== '') {
      return token;
    }
  } catch {
    // invalid URL in the mail body
  }
  throw new Error(`No verification token in mail for ${email}`);
}

let mailQueue: Queue | undefined;

function getMailQueue(): Queue {
  if (mailQueue !== undefined) {
    return mailQueue;
  }

  const redisUrl = process.env.REDIS_URL;
  if (redisUrl === undefined) {
    throw new Error('REDIS_URL is required to read the queued mail');
  }

  mailQueue = new Queue('mail', { connection: { url: redisUrl } });
  return mailQueue;
}

export async function closeMailQueue(): Promise<void> {
  if (mailQueue === undefined) {
    return;
  }

  const queue = mailQueue;
  mailQueue = undefined;
  await queue.close();
}

function textFromQueuedMail(email: string, jobs: Job[]): string | undefined {
  const job = jobs
    .filter((item) => item.data?.to === email)
    .sort((left, right) => (right.timestamp ?? 0) - (left.timestamp ?? 0))[0];
  const text = job?.data?.text;
  if (typeof text !== 'string' || text === '') {
    return undefined;
  }

  return text;
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

export async function createVerifiedCustomerSession(
  options: {
    origin?: string;
    email?: string;
    password?: string;
  } = {},
) {
  const email = options.email ?? uniqueCustomerEmail();
  const password = options.password ?? 'customer-password-1';
  const origin = options.origin ?? WEB_ORIGIN;
  await signUpCustomer({ origin, email, password });
  await verifyCustomerEmail(email);
  const signInRes = await signIn({ email, password, origin });
  return {
    email,
    password,
    origin,
    cookie: cookieHeader(signInRes.headers['set-cookie']),
  };
}

export function authRequest(session: AuthSession) {
  return {
    headers: {
      Cookie: session.cookie,
      Origin: session.origin,
    },
    validateStatus: () => true,
  };
}

export function getSession(session: AuthSession) {
  return axios.get('/api/auth/get-session', authRequest(session));
}

export function signOut(session: AuthSession) {
  return axios.post('/api/auth/sign-out', {}, authRequest(session));
}

function originHeaders(origin: string | undefined): Record<string, string> {
  if (origin === undefined) {
    return {};
  }

  return { Origin: origin };
}
