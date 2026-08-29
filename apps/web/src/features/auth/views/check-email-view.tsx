import { AuthCard, RedirectIfAuthenticated, VerifyEmailNotice } from '../components';

interface CheckEmailViewProps {
  email: string;
  callbackUrl?: string;
}

export function CheckEmailView({ email, callbackUrl }: CheckEmailViewProps) {
  return (
    <AuthCard
      title="Check your email"
      description="We sent a verification link. Once you open it, you will be signed in automatically."
    >
      <RedirectIfAuthenticated />
      <VerifyEmailNotice email={email} callbackUrl={callbackUrl} />
    </AuthCard>
  );
}
