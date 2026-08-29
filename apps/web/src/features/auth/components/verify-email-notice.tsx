'use client';

import { useState } from 'react';

import { Alert, AlertDescription } from '@/components/ui/alert';
import { Button } from '@/components/ui/button';
import { sendVerificationEmail } from '@/lib/auth-client';

import { AUTH_ERROR_MESSAGES } from '../constants';
import { getAuthErrorMessage, resolveCallbackUrl } from '../utils';

interface VerifyEmailNoticeProps {
  email: string;
  callbackUrl?: string;
}

export function VerifyEmailNotice({ email, callbackUrl }: VerifyEmailNoticeProps) {
  const [isResending, setIsResending] = useState(false);
  const [resendMessage, setResendMessage] = useState<string | null>(null);
  const [resendError, setResendError] = useState<string | null>(null);

  const handleResend = async () => {
    setIsResending(true);
    setResendMessage(null);
    setResendError(null);

    const { error } = await sendVerificationEmail({
      email,
      callbackURL: resolveCallbackUrl(callbackUrl),
    });

    setIsResending(false);

    if (error) {
      setResendError(
        getAuthErrorMessage(error) ?? AUTH_ERROR_MESSAGES.RESEND_VERIFICATION_FAILED,
      );
      return;
    }

    setResendMessage(AUTH_ERROR_MESSAGES.VERIFICATION_EMAIL_SENT);
  };

  return (
    <div className="space-y-4">
      <Alert>
        <AlertDescription className="text-center">
          We sent a verification link to <strong>{email}</strong>. Open it to
          verify your email and go straight to your dashboard.
        </AlertDescription>
      </Alert>

      {resendMessage ? (
        <Alert>
          <AlertDescription className="text-center">{resendMessage}</AlertDescription>
        </Alert>
      ) : null}

      {resendError ? (
        <Alert variant="destructive">
          <AlertDescription className="text-center">{resendError}</AlertDescription>
        </Alert>
      ) : null}

      <Button
        type="button"
        variant="outline"
        className="w-full"
        loading={isResending}
        onClick={() => void handleResend()}
      >
        Resend verification email
      </Button>
    </div>
  );
}
