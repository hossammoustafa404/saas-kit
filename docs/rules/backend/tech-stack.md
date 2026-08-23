# Tech Stack

Approved technologies for the NestJS backend. **NEVER** introduce alternatives without updating this file first.

## Stack Overview

| Layer          | Technology                             | Rule file                |
| -------------- | -------------------------------------- | ------------------------ |
| Framework      | NestJS                                 | `nestjs.md`             |
| Language       | TypeScript                             | `naming-conventions.md` |
| Architecture   | Feature modules + `shared/` infra      | `architecture.md`       |
| Database       | PostgreSQL + Prisma (`shared/prisma/`) | `database.md`           |
| Validation     | Zod (shared package) + `nestjs-zod`    | `validation.md`         |
| Authentication | `@thallesp/nestjs-better-auth`         | `authentication.md`     |
| Authorization  | CASL (`@casl/ability`)                 | `authorization.md`      |
| API            | REST (JSON) — any HTTP client          | `controllers.md`        |
| API docs       | `@nestjs/swagger` + better-auth `openAPI()` | `api-docs.md`         |
| Config         | `@nestjs/config` (`shared/config/`)    | `nestjs.md`             |
| Logging        | NestJS built-in `Logger`               | `nestjs.md`             |
| Testing        | Jest + Supertest                       | `testing.md`            |
