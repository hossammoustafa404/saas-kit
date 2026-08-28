import axios from 'axios';
import { authRequest, type AuthSession } from './auth-client';

export function listOrganizations(session: AuthSession) {
  return axios.get('/api/auth/organization/list', authRequest(session));
}

export function getFullOrganization(session: AuthSession) {
  return axios.get(
    '/api/auth/organization/get-full-organization',
    authRequest(session),
  );
}

export function getActiveMember(session: AuthSession) {
  return axios.get(
    '/api/auth/organization/get-active-member',
    authRequest(session),
  );
}

export function createOrganization(
  session: AuthSession,
  body: {
    name: string;
    slug: string;
    keepCurrentActiveOrganization?: boolean;
  },
) {
  return axios.post(
    '/api/auth/organization/create',
    body,
    authRequest(session),
  );
}

export function setActiveOrganization(
  session: AuthSession,
  body: { organizationId: string | null },
) {
  return axios.post(
    '/api/auth/organization/set-active',
    body,
    authRequest(session),
  );
}

export function inviteMember(
  session: AuthSession,
  body: { email: string; role: string; organizationId?: string },
) {
  return axios.post(
    '/api/auth/organization/invite-member',
    body,
    authRequest(session),
  );
}

export function acceptInvitation(
  session: AuthSession,
  body: { invitationId: string },
) {
  return axios.post(
    '/api/auth/organization/accept-invitation',
    body,
    authRequest(session),
  );
}

export function rejectInvitation(
  session: AuthSession,
  body: { invitationId: string },
) {
  return axios.post(
    '/api/auth/organization/reject-invitation',
    body,
    authRequest(session),
  );
}

export function cancelInvitation(
  session: AuthSession,
  body: { invitationId: string },
) {
  return axios.post(
    '/api/auth/organization/cancel-invitation',
    body,
    authRequest(session),
  );
}

export function getInvitation(session: AuthSession, invitationId: string) {
  return axios.get('/api/auth/organization/get-invitation', {
    ...authRequest(session),
    params: { id: invitationId },
  });
}

export function getInvitationAnonymous(invitationId: string) {
  return axios.get('/api/auth/organization/get-invitation', {
    params: { id: invitationId },
    validateStatus: () => true,
  });
}

export function listInvitations(session: AuthSession, organizationId: string) {
  return axios.get('/api/auth/organization/list-invitations', {
    ...authRequest(session),
    params: { organizationId },
  });
}

export function listUserInvitations(session: AuthSession) {
  return axios.get(
    '/api/auth/organization/list-user-invitations',
    authRequest(session),
  );
}

export function addMember(
  session: AuthSession,
  body: { userId: string; role: string; organizationId?: string },
) {
  return axios.post(
    '/api/auth/organization/add-member',
    body,
    authRequest(session),
  );
}

export function updateMemberRole(
  session: AuthSession,
  body: { memberId: string; role: string; organizationId?: string },
) {
  return axios.post(
    '/api/auth/organization/update-member-role',
    body,
    authRequest(session),
  );
}

export function removeMember(
  session: AuthSession,
  body: { memberIdOrEmail: string; organizationId?: string },
) {
  return axios.post(
    '/api/auth/organization/remove-member',
    body,
    authRequest(session),
  );
}

export function leaveOrganization(
  session: AuthSession,
  body: { organizationId: string },
) {
  return axios.post('/api/auth/organization/leave', body, authRequest(session));
}

export function deleteOrganization(
  session: AuthSession,
  body: { organizationId: string },
) {
  return axios.post(
    '/api/auth/organization/delete',
    body,
    authRequest(session),
  );
}
