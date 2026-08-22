# Authorization: CASL

Authorization controls **what** an authenticated user can do. Use **`@casl/ability`** on the backend — this is the enforcement layer. Client-side checks are UX only.

## Directory Structure

```text
src/
├── shared/
│   └── ability/                  # Cross-cutting ability factory
│       ├── define-ability.ts
│       └── types.ts
└── modules/
    └── user/
        └── guards/               # Module-scoped policy guards (if needed)
            └── can-update-user.guard.ts
```

- `define-ability.ts` and `types.ts` live in `shared/ability/` — used by multiple modules.
- Module-specific policy guards live in that module's `guards/` folder.

## Ability Definition

- Define `Actions` and `Subjects` types in `shared/ability/types.ts`.
- Build abilities in `define-ability.ts` using `AbilityBuilder` from `@casl/ability`.
- Create a factory (e.g. `defineAbilityFor(user)`) from the user's permissions stored in the database.
- Permissions are data-driven — **never** hardcode role checks as string literals scattered in action services.

## Enforcement in Action Services

```ts
// modules/post/services/update-post/update-post.service.ts
@Injectable()
export class UpdatePostService {
  constructor(private readonly prisma: PrismaService) {}

  async execute(userId: string, postId: string, input: UpdatePostInput) {
    const post = await this.prisma.post.findUniqueOrThrow({ where: { id: postId } });
    const ability = defineAbilityFor(await this.getUserPermissions(userId));

    if (ability.cannot("update", subject("Post", post))) {
      throw new ForbiddenException();
    }

    return this.prisma.post.update({ where: { id: postId }, data: input });
  }
}
```

- Check permissions in **action services** — route decorators (`@Roles`, `@UserHasPermission`) are coarse; services enforce resource-level rules.
- Throw `ForbiddenException` when `ability.cannot()` — never return `null` to hide unauthorized access.

## Permissions Payload for Clients

- Include a serializable permissions/rules payload in the session or a `/me` endpoint.
- Use `packRules` / `unpackRules` from `@casl/ability/extra` for transfer to any client.
- Rules must match between backend enforcement and client-side ability rebuild.

## Rules

- **NEVER** define permission rules inline in controllers. Centralize in `define-ability.ts`.
- **NEVER** rely on client-only checks — every mutating endpoint must verify CASL server-side.
- **NEVER** return resources the user cannot read — filter at query level when possible (e.g. `accessibleBy`).
