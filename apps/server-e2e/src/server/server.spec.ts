import axios from 'axios';
import { hasSessionCookie } from '../support/auth-client';

describe('GET /api/health', () => {
  it('should return 200 and { status: "ok" } without a Session', async () => {
    const res = await axios.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
    expect(hasSessionCookie(res.headers['set-cookie'])).toBe(false);
  });
});

describe('GET /api/docs', () => {
  it('should return Swagger UI', async () => {
    const res = await axios.get('/api/docs');

    expect(res.status).toBe(200);
    expect(String(res.headers['content-type'])).toMatch(/html/);
    expect(String(res.data)).toMatch(/swagger/i);
  });
});

describe('GET /api/docs-json', () => {
  it('should return an OpenAPI document with Health, cookie auth, and the auth reference', async () => {
    const res = await axios.get('/api/docs-json');
    expect(res.status).toBe(200);
    expect(res.data.paths['/api/health'].get).toBeDefined();
    expect(res.data.components.schemas.HealthDto.example).toEqual({
      status: 'ok',
    });
    expect(
      res.data.components.securitySchemes['better-auth.session_token'],
    ).toEqual(
      expect.objectContaining({
        type: 'apiKey',
        in: 'cookie',
        name: 'better-auth.session_token',
      }),
    );
    expect(String(res.data.info.description)).toMatch(/\/api\/auth\/reference/);
  });
});
