# Forms & Validation: react-hook-form + Zod + shadcn/ui

## Form Architecture

- **All forms are Client Components** using `react-hook-form`.
- Wrap forms in `Form` from `shadcn/ui` with `zodResolver` from `@hookform/resolvers/zod`.
- Import schemas and exported types from the shared schemas package. See `api-services.md`.
- Submit via `useMutation` from `services/mutations.ts`.

## react-hook-form Patterns

- Use `useForm<LoginInput>()` with the exported type — not `z.infer` at the call site.
- Default values must match the schema shape to prevent uncontrolled warnings.
- Use `control` for complex fields (arrays, nested objects). Avoid `register` for custom shadcn inputs.
- Use `useWatch` sparingly; prefer `watch` only when necessary for conditional rendering.
- Use `useFieldArray` for dynamic lists. Always provide `keyName` or use stable `id` fields.
- Reset form after successful submission: `form.reset()` inside `onSuccess`.
- Map API errors in the mutation's `onError` to `form.setError("root", { message })` or `form.setError(field, { message })`.

## shadcn/ui Form Components

- Use `Form`, `FormField`, `FormItem`, `FormLabel`, `FormControl`, `FormMessage`, `FormDescription`.
- Never use raw `input` or `select` without wrapping in `FormControl`.
- `FormLabel` must point to the correct input via `htmlFor`.
- `FormMessage` displays validation errors automatically.

## Example Pattern

```tsx
"use client";

import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { LoginSchema, type LoginInput } from "@stack/schemas";
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Loader2 } from "lucide-react";

export function LoginForm() {
  const form = useForm<LoginInput>({
    resolver: zodResolver(LoginSchema),
    defaultValues: { email: "", password: "" },
  });

  const onSubmit = async (data: LoginInput) => {
    // useLoginMutation().mutate(data) — see services/mutations.ts
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email</FormLabel>
              <FormControl>
                <Input placeholder="you@example.com" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        <Button type="submit" disabled={form.formState.isSubmitting}>
          {form.formState.isSubmitting && (
            <Loader2 className="mr-2 h-4 w-4 animate-spin" />
          )}
          Sign In
        </Button>
      </form>
    </Form>
  );
}
```

## Accessibility in Forms

- All inputs must have an associated `label` via `FormLabel`.
- Use `aria-invalid` and `aria-describedby` automatically via shadcn Form primitives.
- Error messages must be descriptive and actionable.
- Group related fields with `fieldset` and `legend` when semantically appropriate.
