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
  return axios.post('/api/auth/organization/create', body, authRequest(session));
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
