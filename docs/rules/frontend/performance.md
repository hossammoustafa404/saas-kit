# Performance

## Images

- Use `next/image` for all images — never raw `<img>`.
- Provide `width`/`height` or `fill` with a sized container to prevent layout shift.
- Use appropriate `priority` for above-the-fold images only.
- Every image must have meaningful `alt` text.

## Bundle & Client Components

- Lazy-load heavy Client Components with `next/dynamic` only when necessary. Prefer SSR unless the component requires browser-only APIs.
- Prefer tree-shakeable, named imports. Avoid pulling in full libraries when only a subset is needed.
- See `nextjs.md` for client boundary placement and `styling.md` for icon import rules.

## Server Rendering

- Use `React.cache` to deduplicate requests within a single Server Component render.
- Use `generateStaticParams` for dynamic routes when paths are known at build time. Use `dynamicParams` when unknown paths should render on demand.

## General

- Monitor bundle size when adding Client Components or new dependencies.
- Profile before optimizing — Server Components and prefetching cover most cases without premature micro-optimizations.
