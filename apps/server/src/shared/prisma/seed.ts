import { resolve } from 'node:path';
import { PrismaPg } from '@prisma/adapter-pg';
import { config as loadEnv } from 'dotenv';
import { EnvSchema } from '../config/env.schema';
import { createAuth } from '../../modules/auth';
import { PrismaClient } from './generated/client';
import { SeedAdminEnvSchema } from './seed-admin-env.schema';

loadEnv({ path: resolve(process.cwd(), '.env') });

async function seed(): Promise<void> {
  const seedAdmin = SeedAdminEnvSchema.parse(process.env);
  const env = EnvSchema.parse(process.env);
  const prisma = new PrismaClient({
    adapter: new PrismaPg({ connectionString: env.DATABASE_URL }),
  });

  try {
    const existing = await prisma.user.findUnique({
      where: { email: seedAdmin.SEED_ADMIN_EMAIL },
      select: { id: true },
    });
    if (existing) {
      return;
    }

    const auth = createAuth(prisma);

    await auth.api.createUser({
      body: {
        email: seedAdmin.SEED_ADMIN_EMAIL,
        password: seedAdmin.SEED_ADMIN_PASSWORD,
        name: seedAdmin.SEED_ADMIN_NAME,
        role: 'admin',
      },
    });
  } finally {
    await prisma.$disconnect();
  }
}

seed().catch((error: unknown) => {
  console.error('Seed failed', error);
  process.exitCode = 1;
});
