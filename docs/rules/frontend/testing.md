# Testing: Playwright

## E2E Tests

- Tests live in `e2e/` or `tests/e2e/`.
- Test critical user flows: auth, CRUD operations, navigation.
- Use Playwright's `test.step` for readable reports.
- Run `npx playwright test` before considering a feature complete.

## Accessibility Audits

- Include `@axe-core/playwright` in E2E tests.
- Run a11y checks on every major page and form.
- Fail tests on WCAG AA violations.

## Component Testing (if applicable)

- Use Playwright component tests for complex interactions.
- Prefer E2E over unit tests for user-facing behavior.
