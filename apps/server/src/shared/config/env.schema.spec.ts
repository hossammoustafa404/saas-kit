import { EnvSchema } from './env.schema';

describe('EnvSchema', () => {
  it('should reject missing DATABASE_URL', () => {
    const result = EnvSchema.safeParse({ PORT: '3000' });

    expect(result.success).toBe(false);
  });

  it('should reject an empty DATABASE_URL', () => {
    const result = EnvSchema.safeParse({ DATABASE_URL: '', PORT: '3000' });

    expect(result.success).toBe(false);
  });

  it('should reject a non-postgres DATABASE_URL', () => {
    const result = EnvSchema.safeParse({
      DATABASE_URL: 'https://example.com',
      PORT: '3000',
    });

    expect(result.success).toBe(false);
  });

  it('should default PORT to 3000 when omitted', () => {
    expect(
      EnvSchema.parse({
        DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/saas_kit',
      }),
    ).toEqual({
      DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/saas_kit',
      PORT: 3000,
    });
  });

  it('should coerce PORT from an env string', () => {
    expect(
      EnvSchema.parse({
        DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/saas_kit',
        PORT: '4000',
      }),
    ).toEqual({
      DATABASE_URL: 'postgresql://postgres:secret@localhost:5432/saas_kit',
      PORT: 4000,
    });
  });
});
