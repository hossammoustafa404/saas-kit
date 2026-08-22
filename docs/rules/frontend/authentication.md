# Authentication: better-auth

Authentication confirms **who** the user is. The **NestJS backend** owns better-auth via an external package. Next.js is **frontend only** — no auth server config, no auth API routes.

## Directory Structure

```text
lib/
└── auth-client.ts    # createAuthClient — points to NestJS backend
features/
└── auth/
    ├── index.ts
    ├── components/     # login-form.tsx, sign-up-form.tsx, etc.
    ├── views/          # sign-in-view.tsx, sign-up-view.tsx
    ├── hooks/
    └── services/       # Session fetch for Server Components
```

## Client Setup

- Create the client once in `lib/auth-client.ts` with `createAuthClient` from `better-auth/react`.
- Set `baseURL` to the NestJS backend URL (e.g. `NEXT_PUBLIC_API_URL`).
- Export auth methods and hooks from the client instance (`signIn`, `signUp`, `signOut`, `useSession`, etc.).
- Auth UI lives in `features/auth/`. Forms follow `forms-validation.md`.

## Session

- **Client Components**: use `useSession` from `auth-client.ts`.
- **Server Components**: fetch the session from the backend by forwarding cookies via `features/auth/services/`.
- Session and user types come from the shared schemas package or backend auth package — do not duplicate them in the frontend.

## Route Protection

- Use middleware (or Next.js proxy) for **optimistic redirects only** (cookie presence checks). This is UX, not security.
- For server-rendered protected routes, confirm the session with the backend before rendering.

## Rules

- **NEVER** mount better-auth handlers in `app/api/` on Next.js.
- **NEVER** roll custom session/token management alongside better-auth.
- **NEVER** scatter auth logic across components. Centralize in `lib/auth-client.ts` and `features/auth/`.
- **NEVER** use `publicFetcher` or custom endpoints for sign-in, sign-up, or sign-out — use the better-auth client.
- **NEVER** store passwords or secrets in client state.
