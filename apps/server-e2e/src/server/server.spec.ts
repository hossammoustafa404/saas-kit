import axios from 'axios';

describe('GET /api/health', () => {
  it('should return 200 and { status: "ok" }', async () => {
    const res = await axios.get('/api/health');

    expect(res.status).toBe(200);
    expect(res.data).toEqual({ status: 'ok' });
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
  it('should return an OpenAPI document with the Health path and example', async () => {
    const res = await axios.get('/api/docs-json');
    expect(res.status).toBe(200);
    expect(res.data.paths['/api/health'].get).toBeDefined();
    expect(res.data.components.schemas.HealthDto.example).toEqual({
      status: 'ok',
    });
  });
});
