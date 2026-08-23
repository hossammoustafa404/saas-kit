# Project Rules

This is an Nx monorepo: `apps/web` and `apps/admin` (Next.js), `apps/server` (NestJS API), `packages/schemas` (@stack/schemas, shared Zod schemas). Detailed engineering standards live in `docs/rules/`.

## External File Loading

CRITICAL: Rule references below (e.g., @docs/rules/monorepo.md) are mandatory instructions for the SPECIFIC task at hand. Load them on a need-to-know basis with the Read tool:

- Do NOT preemptively load all references — lazy-load based on actual need
- When loaded, treat content as mandatory instructions that override defaults
- Follow references between rule files recursively when needed

## General — read immediately, applies to all tasks

- @docs/rules/monorepo.md — Nx monorepo layout, apps, packages, module boundaries
- @docs/rules/naming-conventions.md — universal naming conventions for files, symbols, database
- @docs/rules/clean-code.md — core clean code principles for TypeScript

## Backend — load when working in apps/server/

- @docs/rules/backend/role.md — senior backend engineer role and expertise
- @docs/rules/backend/tech-stack.md — approved backend technologies and libraries
- @docs/rules/backend/architecture.md — feature-based NestJS module architecture
- @docs/rules/backend/nestjs.md — framework discipline, DI, module patterns
- @docs/rules/backend/controllers.md — controller layer and API response conventions
- @docs/rules/backend/validation.md — Zod validation with nestjs-zod and shared schemas
- @docs/rules/backend/database.md — Prisma and PostgreSQL patterns
- @docs/rules/backend/authentication.md — better-auth integration via nestjs-better-auth
- @docs/rules/backend/authorization.md — CASL authorization and guards
- @docs/rules/backend/security.md — security practices and secrets handling
- @docs/rules/backend/api-docs.md — Swagger/OpenAPI documentation requirements
- @docs/rules/backend/testing.md — Jest and Supertest conventions

## Frontend — load when working in apps/web/ or apps/admin/

- @docs/rules/frontend/role.md — senior frontend engineer role and expertise
- @docs/rules/frontend/tech-stack.md — approved frontend technologies and libraries
- @docs/rules/frontend/architecture.md — feature-based architecture, views, public API boundaries
- @docs/rules/frontend/nextjs.md — App Router patterns, server/client component discipline
- @docs/rules/frontend/components.md — React component design and composition
- @docs/rules/frontend/state-management.md — React Query and Zustand patterns
- @docs/rules/frontend/forms-validation.md — react-hook-form, Zod, shadcn/ui forms
- @docs/rules/frontend/api-services.md — API service layer, fetchers, React Query integration
- @docs/rules/frontend/styling.md — Tailwind CSS and Lucide icons
- @docs/rules/frontend/authentication.md — better-auth client integration and sessions
- @docs/rules/frontend/authorization.md — CASL ability checks and permission UI
- @docs/rules/frontend/performance.md — performance optimization patterns
- @docs/rules/frontend/security.md — client-side security boundaries
- @docs/rules/frontend/testing.md — Playwright E2E conventions

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->
