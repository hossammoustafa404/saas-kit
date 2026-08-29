import { cn } from '@/lib/utils';

interface AuthPageShellProps {
  children: React.ReactNode;
  className?: string;
}

export function AuthPageShell({ children, className }: AuthPageShellProps) {
  return (
    <div className="relative min-h-svh overflow-hidden">
      <div className="absolute inset-0 bg-background" aria-hidden="true" />
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_80%_60%_at_50%_-20%,var(--color-primary)/0.15,transparent)]"
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 bg-[linear-gradient(to_right,var(--color-border)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-border)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_110%)] opacity-40"
        aria-hidden="true"
      />
      <div
        className={cn(
          'relative z-10 flex min-h-svh w-full flex-col',
          className,
        )}
      >
        {children}
      </div>
    </div>
  );
}
