import { CircleAlert } from 'lucide-react';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface AuthErrorBadgeProps {
  message: string;
  className?: string;
}

export function AuthErrorBadge({ message, className }: AuthErrorBadgeProps) {
  return (
    <div role="alert" className={cn('flex justify-center', className)}>
      <Badge
        variant="destructive"
        className="h-auto max-w-full gap-1.5 rounded-md px-3 py-1.5 text-sm whitespace-normal"
      >
        <CircleAlert aria-hidden="true" />
        {message}
      </Badge>
    </div>
  );
}
