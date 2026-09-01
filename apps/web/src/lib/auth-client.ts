import { createAuthClient } from 'better-auth/react';
import { organizationClient } from 'better-auth/client/plugins';

const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL ?? 'http://localhost:9000',
  plugins: [
    organizationClient({
      teams: { enabled: false },
      dynamicAccessControl: { enabled: false },
    }),
  ],
  fetchOptions: {
    onRequest: async (context) => {
      if (typeof window === 'undefined' && !context.headers.get('cookie')) {
        const { headers } = await import('next/headers');
        const cookie = (await headers()).get('cookie') ?? '';
        context.headers.set('cookie', cookie);
      }
    },
  },
});

export const {
  getSession,
  signIn,
  signUp,
  signOut,
  sendVerificationEmail,
  useSession,
  organization,
} = authClient;
