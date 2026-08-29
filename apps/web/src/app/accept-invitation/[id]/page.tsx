import { AcceptInvitationView } from '@/features/auth';

interface AcceptInvitationPageProps {
  params: Promise<{ id: string }>;
}

export default async function AcceptInvitationPage({
  params,
}: AcceptInvitationPageProps) {
  const { id } = await params;

  return <AcceptInvitationView invitationId={id} />;
}
