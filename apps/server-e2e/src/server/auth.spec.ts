import axios from 'axios';
import {
  ADMIN_ORIGIN,
  API_ORIGIN,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  WEB_ORIGIN,
  cookieHeader,
  hasSessionCookie,
  signIn,
  signUpCustomer,
  uniqueCustomerEmail,
} from '../support/auth-client';

describe('POST /api/auth/sign-up/email', () => {
  it('should create a Customer and a Session when Origin is not the admin app', async () => {
    const res = await signUpCustomer({ origin: WEB_ORIGIN });

    expect(res.status).toBe(200);
    expect(res.data.user.role).toBe('customer');
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(true);
  });

  it('should create a Customer when Origin is the API', async () => {
    const res = await signUpCustomer({ origin: API_ORIGIN });

    expect(res.status).toBe(200);
    expect(res.data.user.role).toBe('customer');
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(true);
  });

  it('should create a Customer when Origin is missing', async () => {
    const res = await signUpCustomer();

    expect(res.status).toBe(200);
    expect(res.data.user.role).toBe('customer');
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(true);
  });

  it('should reject sign-up from the admin origin', async () => {
    const res = await signUpCustomer({ origin: ADMIN_ORIGIN });

    expect(res.status).toBeGreaterThanOrEqual(400);
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(false);
  });

  it('should ignore a client-supplied Super Admin Role and still create a Customer', async () => {
    const res = await signUpCustomer({
      origin: WEB_ORIGIN,
      role: 'superadmin',
    });

    expect(res.status).toBe(200);
    expect(res.data.user.role).toBe('customer');
  });
});

describe('POST /api/auth/sign-in/email', () => {
  it('should sign in a Customer from the web origin', async () => {
    const email = uniqueCustomerEmail();
    const password = 'customer-password-1';
    await signUpCustomer({ origin: WEB_ORIGIN, email, password });

    const res = await signIn({ email, password, origin: WEB_ORIGIN });

    expect(res.status).toBe(200);
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(true);
  });

    it('should reject a Customer signing in from the admin origin', async () => {
      const email = uniqueCustomerEmail();
      const password = 'customer-password-1';
      await signUpCustomer({ origin: WEB_ORIGIN, email, password });

      const [wrongOrigin, unknownEmail] = await Promise.all([
        signIn({ email, password, origin: ADMIN_ORIGIN }),
        signIn({
          email: uniqueCustomerEmail(),
          password,
          origin: ADMIN_ORIGIN,
        }),
      ]);

      expect(wrongOrigin.status).toBe(401);
      expect(unknownEmail.status).toBe(401);
      expect(wrongOrigin.data).toEqual(unknownEmail.data);
      expect(hasSessionCookie(wrongOrigin.headers['set-cookie'])).toBe(false);
    });

    it('should reject a Customer signing in from the admin origin even when email casing differs', async () => {
      const email = uniqueCustomerEmail();
      const password = 'customer-password-1';
      await signUpCustomer({ origin: WEB_ORIGIN, email, password });

      const res = await signIn({
        email: email.toUpperCase(),
        password,
        origin: ADMIN_ORIGIN,
      });

      expect(res.status).toBe(401);
      expect(hasSessionCookie(res.headers['set-cookie'])).toBe(false);
    });

  it('should sign in a Super Admin from the admin origin', async () => {
    const res = await signIn({
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      origin: ADMIN_ORIGIN,
    });

    expect(res.status).toBe(200);
    expect(res.data.user.role).toBe('superadmin');
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(true);
  });

  it('should reject a Super Admin signing in from the web origin', async () => {
    const [wrongOrigin, unknownEmail] = await Promise.all([
      signIn({
        email: SEED_ADMIN_EMAIL,
        password: SEED_ADMIN_PASSWORD,
        origin: WEB_ORIGIN,
      }),
      signIn({
        email: uniqueCustomerEmail(),
        password: SEED_ADMIN_PASSWORD,
        origin: WEB_ORIGIN,
      }),
    ]);

    expect(wrongOrigin.status).toBe(401);
    expect(unknownEmail.status).toBe(401);
    expect(wrongOrigin.data).toEqual(unknownEmail.data);
    expect(hasSessionCookie(wrongOrigin.headers['set-cookie'])).toBe(false);
  });

  it('should sign in a Super Admin when Origin is the API', async () => {
    const res = await signIn({
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      origin: API_ORIGIN,
    });

    expect(res.status).toBe(200);
    expect(res.data.user.role).toBe('superadmin');
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(true);
  });

  it('should sign in a Super Admin when Origin is missing', async () => {
    const res = await signIn({
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
    });

    expect(res.status).toBe(200);
    expect(res.data.user.role).toBe('superadmin');
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(true);
  });

  it('should sign in a Customer when Origin is missing', async () => {
    const email = uniqueCustomerEmail();
    const password = 'customer-password-1';
    await signUpCustomer({ email, password });

    const res = await signIn({ email, password });

    expect(res.status).toBe(200);
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(true);
  });
});

describe('GET /api/auth/get-session', () => {
  it('should not treat a caller without a Session cookie as signed in', async () => {
    const res = await axios.get('/api/auth/get-session', {
      validateStatus: () => true,
    });

    expect([200, 401]).toContain(res.status);
    expect(res.data?.user ?? res.data?.session ?? null).toBeNull();
  });

  it('should identify the signed-in User from the Session cookie', async () => {
    const email = uniqueCustomerEmail();
    const signUp = await signUpCustomer({ origin: WEB_ORIGIN, email });
    const cookie = cookieHeader(signUp.headers['set-cookie']);

    const res = await axios.get('/api/auth/get-session', {
      headers: { Cookie: cookie },
      validateStatus: () => true,
    });

    expect(res.status).toBe(200);
    expect(res.data.user.email).toBe(email);
    expect(res.data.user.role).toBe('customer');
  });
});

describe('POST /api/auth/sign-out', () => {
  it('should end the Session', async () => {
    const signUp = await signUpCustomer({ origin: WEB_ORIGIN });
    const cookie = cookieHeader(signUp.headers['set-cookie']);

    const signOut = await axios.post(
      '/api/auth/sign-out',
      {},
      {
        headers: { Cookie: cookie, Origin: WEB_ORIGIN },
        validateStatus: () => true,
      },
    );

    expect(signOut.status).toBe(200);

    const session = await axios.get('/api/auth/get-session', {
      headers: { Cookie: cookie },
      validateStatus: () => true,
    });

    expect(session.data?.user ?? session.data?.session ?? null).toBeNull();
  });
});

describe('GET /api/auth/reference', () => {
  it('should respond with the better-auth Open API reference', async () => {
    const res = await axios.get('/api/auth/reference', {
      validateStatus: () => true,
    });

    expect(res.status).toBe(200);
  });
});
