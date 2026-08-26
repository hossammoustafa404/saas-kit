import axios from 'axios';
import {
  ADMIN_ORIGIN,
  SEED_ADMIN_EMAIL,
  SEED_ADMIN_PASSWORD,
  WEB_ORIGIN,
  cookieHeader,
  signIn,
  signUpCustomer,
  uniqueCustomerEmail,
  verifyCustomerEmail,
} from '../support/auth-client';

describe('GET /api/queues', () => {
  it('should reject a caller without a Session', async () => {
    const res = await axios.get('/api/queues', {
      validateStatus: () => true,
    });

    expect(res.status).toBe(401);
  });

  it('should reject a Customer Session', async () => {
    const email = uniqueCustomerEmail();
    const password = 'customer-password-1';
    await signUpCustomer({ origin: WEB_ORIGIN, email, password });
    await verifyCustomerEmail(email);
    const signInRes = await signIn({ email, password, origin: WEB_ORIGIN });
    const cookie = cookieHeader(signInRes.headers['set-cookie']);

    const res = await axios.get('/api/queues', {
      headers: { Cookie: cookie },
      validateStatus: () => true,
    });

    expect(res.status).toBe(403);
  });

  it('should return Bull Board for a Super Admin Session', async () => {
    const signInRes = await signIn({
      email: SEED_ADMIN_EMAIL,
      password: SEED_ADMIN_PASSWORD,
      origin: ADMIN_ORIGIN,
    });
    const cookie = cookieHeader(signInRes.headers['set-cookie']);

    const res = await axios.get('/api/queues', {
      headers: { Cookie: cookie },
      validateStatus: () => true,
    });

    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'])).toMatch(/html/);
    expect(String(res.data)).toMatch(/bull/i);
  });
});
