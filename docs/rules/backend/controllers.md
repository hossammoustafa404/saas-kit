# Controllers & API Responses

## Controller Layer

- Controllers are thin — validate input, delegate to an action service, return result. No business logic.
- One controller per module: `user.controller.ts` → `UserController`.
- REST route paths: `kebab-case`, plural nouns — `/users`, `/order-items`. Module folder stays singular. See `naming-conventions.md`.
- Handler methods match HTTP intent — `findAll`, `findOne`, `create`, `update`, `remove`.
- Use NestJS decorators: `@Get()`, `@Post()`, `@Patch()`, `@Delete()`, `@Param()`, `@Body()`, `@Query()`.
- Auth is global by default — use `@AllowAnonymous()` for public routes. See `authentication.md`.
- Document endpoints fully on **every route** (private and public) — `@ApiOperation`, typed responses, meta examples, error codes, params. See `api-docs.md`.

## Request & Response Shapes

- Request bodies and query params are validated via Zod DTOs from the shared schemas package. See `validation.md`.
- Response bodies must match shared Zod schemas clients expect (e.g. `UserSchema`).
- Parse outgoing data with `.parse()` before returning when the shape is critical.
- Use appropriate HTTP status codes: `201` for create, `204` for delete, `404` for not found.
- API responses must be client-agnostic — no assumptions about a specific frontend framework.

## Error Responses

- Throw NestJS HTTP exceptions (`NotFoundException`, `ForbiddenException`, `BadRequestException`).
- Never leak stack traces or internal details in production responses.
- Map Zod validation failures to `400 Bad Request` via the global validation pipe.

## Example Pattern

```ts
// modules/user/user.controller.ts
import { Controller, Get, Post, Body, Param } from "@nestjs/common";
import { Session, UserSession } from "@thallesp/nestjs-better-auth";
import { CreateUserSchema, type CreateUserInput } from "@stack/schemas";
import { ZodValidationPipe } from "nestjs-zod";
import { FindOneUserService, CreateUserService } from "./services";

@Controller("users")
export class UserController {
  constructor(
    private readonly findOneUser: FindOneUserService,
    private readonly createUser: CreateUserService,
  ) {}

  @Get("me")
  me(@Session() session: UserSession) {
    return session;
  }

  @Get(":id")
  findOne(@Param("id") id: string) {
    return this.findOneUser.execute(id);
  }

  @Post()
  create(@Body(new ZodValidationPipe(CreateUserSchema)) body: CreateUserInput) {
    return this.createUser.execute(body);
  }
}
```

## Rules

- **NEVER** put Prisma calls in controllers.
- **NEVER** define request/response types inline — use shared schemas.
- **NEVER** create custom auth endpoints alongside better-auth. See `authentication.md`.
- **NEVER** inject a monolithic domain service — inject action services only.
