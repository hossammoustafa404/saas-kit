'use client';

import Link from 'next/link';
import { useCallback, useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button, buttonVariants } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { organization, useSession } from '@/lib/auth-client';

import { AUTH_ROUTES } from '../constants';
import { getAuthErrorMessage } from '../utils';

interface AcceptInvitationPanelProps {
  invitationId: string;
}

interface InvitationDetails {
  email: string;
  role: string;
  organizationName: string;
}

export function AcceptInvitationPanel({
  invitationId,
}: AcceptInvitationPanelProps) {
  const router = useRouter();
  const { data: session, isPending } = useSession();
  const [invitation, setInvitation] = useState<InvitationDetails | null>(null);
  const [isLoadingInvitation, setIsLoadingInvitation] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isComplete, setIsComplete] = useState(false);

  const callbackUrl = `${AUTH_ROUTES.acceptInvitation}/${invitationId}`;

  const loadInvitation = useCallback(async () => {
    if (!session) {
      return;
    }

    setIsLoadingInvitation(true);
    setError(null);

    try {
      const { data, error } = await organization.getInvitation({
        query: { id: invitationId },
      });

      if (error) {
        setError(getAuthErrorMessage(error));
        return;
      }

      if (!data) {
        setError('Unable to load this invitation.');
        return;
      }

      const organizationName = data.organizationName || 'this organization';

      setInvitation({
        email: data.email,
        role: data.role,
        organizationName,
      });
    } catch {
      setError('Unable to load this invitation.');
    } finally {
      setIsLoadingInvitation(false);
    }
  }, [invitationId, session]);

  useEffect(() => {
    void loadInvitation();
  }, [loadInvitation]);

  const handleAccept = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await organization.acceptInvitation({
        invitationId,
      });

      if (error) {
        setError(getAuthErrorMessage(error));
        return;
      }

      setIsComplete(true);
      router.push(AUTH_ROUTES.dashboard);
      router.refresh();
    } catch {
      setError('Unable to accept this invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleReject = async () => {
    setIsSubmitting(true);
    setError(null);

    try {
      const { error } = await organization.rejectInvitation({
        invitationId,
      });

      if (error) {
        setError(getAuthErrorMessage(error));
        return;
      }

      router.push(AUTH_ROUTES.dashboard);
      router.refresh();
    } catch {
      setError('Unable to reject this invitation.');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (isPending) {
    return (
      <div className="flex justify-center py-8">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  if (!session) {
    return (
      <div className="space-y-4">
        <p className="text-sm text-muted-foreground">
          Sign in or create an account with the invited email address to accept
          this invitation.
        </p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Link
            href={`${AUTH_ROUTES.signIn}?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className={cn(buttonVariants(), 'flex-1')}
          >
            Sign in
          </Link>
          <Link
            href={`${AUTH_ROUTES.signUp}?callbackUrl=${encodeURIComponent(callbackUrl)}`}
            className={cn(buttonVariants({ variant: 'outline' }), 'flex-1')}
          >
            Create account
          </Link>
        </div>
      </div>
    );
  }

  if (isComplete) {
    return (
      <Alert>
        <AlertDescription>
          Invitation accepted. Redirecting to your dashboard…
        </AlertDescription>
      </Alert>
    );
  }

  if (isLoadingInvitation) {
    return (
      <div className="flex justify-center py-8">
        <Loader2
          className="size-6 animate-spin text-muted-foreground"
          aria-hidden="true"
        />
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {error ? (
        <Alert variant="destructive">
          <AlertDescription>{error}</AlertDescription>
        </Alert>
      ) : null}

      {invitation ? (
        <div className="rounded-lg border bg-muted/40 p-4 text-sm">
          <p>
            You were invited to join{' '}
            <strong>{invitation.organizationName}</strong> as{' '}
            <strong>{invitation.role}</strong>.
          </p>
          <p className="mt-2 text-muted-foreground">
            Invitation sent to {invitation.email}.
          </p>
        </div>
      ) : null}

      <div className="flex flex-col gap-2 sm:flex-row">
        <Button
          type="button"
          className="flex-1"
          disabled={!invitation || isSubmitting}
          onClick={() => void handleAccept()}
        >
          {isSubmitting ? (
            <Loader2 className="animate-spin" aria-hidden="true" />
          ) : null}
          Accept invitation
        </Button>
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={!invitation || isSubmitting}
          onClick={() => void handleReject()}
        >
          Decline
        </Button>
      </div>
    </div>
  );
}
