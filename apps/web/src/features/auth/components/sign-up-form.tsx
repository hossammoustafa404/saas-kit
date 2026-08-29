'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { zodResolver } from '@hookform/resolvers/zod';
import { Controller, useForm } from 'react-hook-form';
import { SignUpSchema, type SignUpInput } from '@saas-kit/schemas';

import { Button } from '@/components/ui/button';
import {
  Field,
  FieldError,
  FieldGroup,
  FieldLabel,
} from '@/components/ui/field';
import { Input } from '@/components/ui/input';
import { signUp } from '@/lib/auth-client';

import {
  buildCheckEmailUrl,
  getAuthErrorMessage,
  getDashboardCallbackUrl,
} from '../utils';
import { AuthErrorBadge } from './auth-error-badge';

export function SignUpForm() {
  const router = useRouter();
  const [rootError, setRootError] = useState<string | null>(null);

  const form = useForm<SignUpInput>({
    resolver: zodResolver(SignUpSchema),
    defaultValues: {
      name: '',
      email: '',
      password: '',
    },
  });

  const handleSubmit = async (values: SignUpInput) => {
    setRootError(null);

    const { error } = await signUp.email({
      name: values.name,
      email: values.email,
      password: values.password,
      callbackURL: getDashboardCallbackUrl(),
    });

    if (error) {
      setRootError(getAuthErrorMessage(error));
      return;
    }

    router.push(buildCheckEmailUrl(values.email));
  };

  return (
    <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
      {rootError ? <AuthErrorBadge message={rootError} /> : null}

      <FieldGroup>
        <Controller
          control={form.control}
          name="name"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-name">Full name</FieldLabel>
              <Input
                {...field}
                id="sign-up-name"
                type="text"
                autoComplete="name"
                placeholder="Hossam Moustafa"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="email"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-email">Email</FieldLabel>
              <Input
                {...field}
                id="sign-up-email"
                type="email"
                autoComplete="email"
                placeholder="you@company.com"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />

        <Controller
          control={form.control}
          name="password"
          render={({ field, fieldState }) => (
            <Field data-invalid={fieldState.invalid}>
              <FieldLabel htmlFor="sign-up-password">Password</FieldLabel>
              <Input
                {...field}
                id="sign-up-password"
                type="password"
                autoComplete="new-password"
                placeholder="At least 8 characters"
                aria-invalid={fieldState.invalid}
              />
              {fieldState.invalid ? (
                <FieldError errors={[fieldState.error]} />
              ) : null}
            </Field>
          )}
        />
      </FieldGroup>

      <Button
        type="submit"
        className="w-full"
        loading={form.formState.isSubmitting}
      >
        Create account
      </Button>
    </form>
  );
}
