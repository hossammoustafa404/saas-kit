# Component Design

## General Rules

- Components are **small, focused, and single-responsibility**.
- Props interface is always explicit and exported if reused.
- Default to named exports. Use `export { Component }` pattern.

## Server & Client Components

- Default to Server Components. See `nextjs.md` for `"use client"` criteria, data fetching, and boundary placement.
- Mark Client Components with `"use client"` at the **top of the file**.
- Co-locate React Query hooks, Zustand selectors, and react-hook-form logic near the component.

## shadcn/ui Usage

- Import from `@/components/ui/*`. Never duplicate shadcn components.
- Customize via `className` prop and Tailwind utilities. See `styling.md`.
- For new UI primitives, add to `components/ui/` via `npx shadcn add <component>`.
- Do not fork shadcn internals into `features/`.
