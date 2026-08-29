import { AuthCard, AcceptInvitationPanel } from '../components';

interface AcceptInvitationViewProps {
  invitationId: string;
}

export function AcceptInvitationView({ invitationId }: AcceptInvitationViewProps) {
  return (
    <AuthCard
      title="Organization invitation"
      description="Review and respond to your workspace invitation."
    >
      <AcceptInvitationPanel invitationId={invitationId} />
    </AuthCard>
  );
}
