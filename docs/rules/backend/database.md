# Database: Prisma + PostgreSQL

## Directory Structure

```text
prisma/
├── schema.prisma
└── migrations/
src/
└── shared/
    └── prisma/
        ├── prisma.module.ts      # Global Prisma module
        └── prisma.service.ts     # Extends PrismaClient, handles lifecycle
```

## Prisma Service

- Create a single `PrismaService` extending `PrismaClient` with `OnModuleInit` / `OnModuleDestroy`.
- Register `PrismaModule` as `@Global()` in `shared/prisma/` so feature modules inject `PrismaService` without re-importing.
- **NEVER** instantiate `PrismaClient` outside `PrismaService`.

## Schema Conventions

See `naming-conventions.md` for full rules:

- Tables: `snake_case`, **singular** — `user`, `order_item`.
- Columns: `camelCase` — `createdAt`, `userId`.
- Primary keys: `id`. Foreign keys: `{relatedTable}Id`.
- Map Prisma `@@map` and `@map` to match database naming when Prisma model names differ.
- **No entity files** — use Prisma-generated types in action services; expose API shapes via shared Zod schemas.

## Data Access Rules

- All Prisma calls live in **action services** — never in controllers or guards.
- Use `findUniqueOrThrow` / `findFirstOrThrow` and map to `NotFoundException` at the service boundary.
- Wrap multi-step writes in `prisma.$transaction()` when atomicity is required.
- Select only needed fields — avoid `findMany()` without `select` on large tables.
- Use `include` / `select` deliberately — avoid N+1 queries; prefer single queries with joins where appropriate.

## Migrations

- **ALWAYS** create migrations for schema changes — `npx prisma migrate dev`.
- **NEVER** edit production data via `prisma db push` without a migration strategy.
- Seed scripts live in `prisma/seed.ts` — idempotent, safe to re-run in dev.

## Rules

- **NEVER** expose password hashes, tokens, or internal IDs unnecessarily in API responses.
- **NEVER** build raw SQL unless Prisma cannot express the query — document why if you do.
- **NEVER** duplicate types — infer from Prisma client types internally; validate API output with shared Zod schemas.
