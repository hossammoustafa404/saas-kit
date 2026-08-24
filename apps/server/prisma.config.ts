import { dirname, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { config as loadEnv } from 'dotenv';
import { defineConfig } from 'prisma/config';

const serverRoot = dirname(fileURLToPath(import.meta.url));
loadEnv({ path: resolve(serverRoot, '.env') });

export default defineConfig({
  schema: 'src/shared/prisma/schema.prisma',
  migrations: {
    path: 'src/shared/prisma/migrations',
    seed: 'npx tsx src/shared/prisma/seed.ts',
  },
  datasource: {
    url:
      process.env.DATABASE_URL ??
      'postgresql://postgres:password@localhost:5432/saas_kit',
  },
});
