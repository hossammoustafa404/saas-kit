import { redirect } from 'next/navigation';

import { CheckEmailView } from '@/features/auth';
import {
  AUTH_ROUTES,
  CHECK_EMAIL_CALLBACK_QUERY_PARAM,
  CHECK_EMAIL_QUERY_PARAM,
} from '@/features/auth/constants';

interface CheckEmailPageProps {
  searchParams: Promise<Record<string, string | string[] | undefined>>;
}

function getParam(
  params: Record<string, string | string[] | undefined>,
  key: string,
): string | undefined {
  const value = params[key];
  return Array.isArray(value) ? value[0] : value;
}

export default async function CheckEmailPage({ searchParams }: CheckEmailPageProps) {
  const params = await searchParams;
  const email = getParam(params, CHECK_EMAIL_QUERY_PARAM);
  const callbackUrl = getParam(params, CHECK_EMAIL_CALLBACK_QUERY_PARAM);

  if (!email) {
    redirect(AUTH_ROUTES.signUp);
  }

  return <CheckEmailView email={email} callbackUrl={callbackUrl} />;
}
