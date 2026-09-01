'use client';

import * as React from 'react';
import { Eye, EyeOff } from 'lucide-react';
import { Input as InputPrimitive } from '@base-ui/react/input';

import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';

const inputClassName =
  'h-8 w-full min-w-0 rounded-lg border border-input bg-transparent px-2.5 py-1 text-base transition-colors outline-none file:inline-flex file:h-6 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:pointer-events-none disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40';

function Input({ className, type, disabled, ...props }: React.ComponentProps<'input'>) {
  const [showPassword, setShowPassword] = React.useState(false);
  const isPassword = type === 'password';

  if (!isPassword) {
    return (
      <InputPrimitive
        type={type}
        data-slot="input"
        disabled={disabled}
        className={cn(inputClassName, className)}
        {...props}
      />
    );
  }

  return (
    <div className="relative">
      <InputPrimitive
        type={showPassword ? 'text' : 'password'}
        data-slot="input"
        disabled={disabled}
        className={cn(inputClassName, 'pr-9', className)}
        {...props}
      />
      <Button
        type="button"
        variant="ghost"
        size="icon-sm"
        className="absolute top-1/2 right-0.5 -translate-y-1/2 text-muted-foreground hover:text-foreground"
        onClick={() => setShowPassword((visible) => !visible)}
        aria-label={showPassword ? 'Hide password' : 'Show password'}
        aria-pressed={showPassword}
        disabled={disabled}
      >
        {showPassword ? (
          <EyeOff className="size-4" aria-hidden="true" />
        ) : (
          <Eye className="size-4" aria-hidden="true" />
        )}
      </Button>
    </div>
  );
}

export { Input };
