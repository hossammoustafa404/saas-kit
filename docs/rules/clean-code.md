# Clean Code TypeScript - Core Rules

## 1. Variables & Naming

- Use meaningful, pronounceable names: `customer` not `cust`, `generationTimestamp` not `genymdhms`
- Maintain consistent vocabulary: prefer `getUser()` over mixing `getUserInfo()`, `getUserDetails()`, `getUserData()`
- Avoid mental mapping: explicit names over implicit abbreviations (`user` not `u`)
- Don't add redundant context: `car.make` not `car.carMake` when the type is already `Car`
- Use searchable names for magic values in the area constants file: `{name}.constants.ts` on the server (`auth.constants.ts`, `mail.constants.ts`), `constants.ts` in a frontend feature. `VERIFICATION_EMAIL_SUBJECT`, not `'Verify your email'` inline in a service.
- Use default parameters instead of short-circuiting: `function loadPages(count = 10)` not `count || 10`
- Use enums to document intent over string constants

## 2. Functions

- Limit arguments to 2 or fewer; use destructured objects for 3+
- Functions should do ONE thing only
- Function names must describe what they do: `addMonthToDate(date, 1)` not `addToDate(date, 1)`
- Keep one level of abstraction per function
- Remove duplicate code through proper abstraction
- Use Object.assign/spread or destructuring defaults for object defaults
- NEVER use boolean flags as parameters—split into two functions
- Avoid side effects: don't mutate inputs, return new values instead
- Don't write to global functions or prototype pollution
- Favor functional programming (map/filter/reduce) over imperative loops
- Encapsulate conditionals into named functions
- Avoid negative conditionals: `if (!isEmailUsed(email))` not `if (isEmailNotUsed(email))`
- Replace conditionals with polymorphism where possible
- Avoid manual type checking—let TypeScript handle it via interfaces
- Don't over-optimize prematurely (e.g., caching `list.length` in loops)
- Remove dead code immediately
- Use iterators/generators for streaming data

## 3. Objects & Data Structures

- Use getters/setters for controlled access and validation
- Make members private/protected by default
- Prefer immutability: `readonly` properties, `ReadonlyArray<T>`, `as const` assertions
- Use `interface` for object shapes (in the module `interfaces/` folder). Use `type` only for unions, intersections, mapped types, function types, and Zod `z.infer`.

## 4. Classes

- Classes should be small (single responsibility)
- Maintain high cohesion and low coupling
- Prefer composition over inheritance
- Use method chaining (return `this`) for fluent APIs

## 5. SOLID Principles

- **SRP**: One reason to change per class
- **OCP**: Open for extension, closed for modification (use abstractions)
- **LSP**: Subtypes must be substitutable without altering correctness
- **ISP**: Split fat interfaces into focused ones
- **DIP**: Depend on abstractions, not concrete implementations

## 6. Error Handling

- Always throw/reject with `Error` instances, not strings
- Never ignore caught errors—log them properly
- Never ignore rejected promises

## 7. Concurrency

- Prefer Promises over callbacks
- Prefer async/await over raw Promise chains

## 8. Formatting

- Use consistent capitalization: `PascalCase` for types/classes, `camelCase` for variables/functions, `SNAKE_CASE` for constants
- Keep callers and callees vertically close
- Organize imports: alphabetized, grouped, unused imports removed
- Use `import type` when importing only types
- Import order: polyfills → Node built-ins → external → internal → parent → sibling
- Use TypeScript path aliases (`@services/User`) over deep relative paths (`../../../services/User`)

## 9. Comments

- Prefer self-explanatory code over comments
- Never leave commented-out code in the codebase
- No journal comments—use git history
- No positional markers (section dividers)
- Use `// TODO:` for temporary notes, but don't use them as excuses for bad code

## 10. Testing

- Write tests for every new feature/module
- Follow F.I.R.S.T.: Fast, Independent, Repeatable, Self-Validating, Timely
- One concept/assert per test
- Test names must reveal intention: `it('should handle leap year')` not `it('2/29/2020')`
