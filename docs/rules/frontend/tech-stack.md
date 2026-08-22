# Tech Stack

Approved technologies for the Next.js frontend. **NEVER** introduce alternatives without updating this file first.

## Stack Overview

| Layer          | Technology                            | Rule file                                  |
| -------------- | ------------------------------------- | ------------------------------------------ |
| Framework      | Next.js (App Router)                  | `nextjs.md`                               |
| Language       | TypeScript                            | `naming-conventions.md`                   |
| Architecture   | Feature-based modules                 | `architecture.md`                         |
| HTTP client    | Axios                                 | `api-services.md`                         |
| Server state   | TanStack Query (React Query)          | `state-management.md`                     |
| Client state   | Zustand                               | `state-management.md`                     |
| Forms          | react-hook-form                       | `forms-validation.md`                     |
| Validation     | Zod (shared package)                  | `api-services.md`, `forms-validation.md` |
| Authentication | better-auth client → Backend          | `authentication.md`                       |
| Authorization  | CASL (`@casl/ability`, `@casl/react`) | `authorization.md`                        |
| UI components  | shadcn/ui                             | `components.md`, `styling.md`            |
| Styling        | Tailwind CSS                          | `styling.md`                              |
| Icons          | Lucide React                          | `styling.md`                              |
| Theming        | next-themes                           | `styling.md`                              |
| Testing        | Playwright (+ `@axe-core/playwright`) | `testing.md`                              |
