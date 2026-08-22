# Styling: Tailwind CSS + Lucide Icons

## Tailwind Rules

- Use **Tailwind utility classes exclusively**. No inline `style` props unless for dynamic CSS variables.
- Use `@apply` only in `globals.css` for base styles. Never in component files.
- Follow mobile-first responsive prefixes: `sm:`, `md:`, `lg:`, `xl:`.
- Use `cn()` from `lib/utils` for conditional class merging. Never concatenate strings manually.

## Theming

- Use **semantic design tokens** from the theme (`background`, `foreground`, `primary`, `muted`, `border`, `ring`, etc.). Never hardcode raw color values or palette-specific classes.
- Define and extend theme variables in `globals.css` only. Components consume tokens; they do not introduce new color definitions.
- Support light and dark mode via the `class` strategy. Wrap the app in `ThemeProvider` from `next-themes` at the root layout.
- Prefer token-based utilities: `bg-background`, `text-foreground`, `text-muted-foreground`, `border-border`, `ring-ring`.
- Keep theme changes global. Do not scatter per-component color overrides that bypass the token system.

## Icons: Lucide React

- **Use `lucide-react` exclusively** for all icons. No other icon libraries.
- Import icons individually — never import the entire library.
- Scale icon size to context: smaller inline with text, slightly larger in buttons, largest when standalone.
- Pass `className` for color overrides using theme tokens (e.g. `text-muted-foreground`).
- Never use emoji as icons. For loading spinners, use `Loader2` with `animate-spin`.

## Accessibility

- All interactive elements must have visible focus states using theme ring tokens.
- Use semantic HTML: `button` for actions, `a` for navigation, `form` for inputs.
- Ensure color contrast ratios meet WCAG AA.
- Use ARIA labels when visible text is insufficient (`aria-label`, `aria-describedby`).
- Icon-only buttons MUST have `aria-label` describing the action.
- Form-specific a11y rules live in `forms-validation.md`. Image rules live in `performance.md`.
