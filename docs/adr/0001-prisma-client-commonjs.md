# Generate Prisma Client as CommonJS

Prisma 7 defaults to ESM (`"type": "module"`). `apps/server` is a NestJS + Nx webpack app that compiles to CommonJS. Converting the server to ESM is a separate migration.

We generate Prisma Client with `moduleFormat = "cjs"` and keep Nest on CommonJS, matching the NestJS Prisma recipe. Runtime still uses `@prisma/adapter-pg`.
