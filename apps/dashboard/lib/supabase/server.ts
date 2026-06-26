import { createServerClient, type CookieOptions } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { isLocalMode, LOCAL_SESSION_COOKIE, LOCAL_DEMO_USER } from '@/lib/mode';
import { createLocalDbClient } from '@/lib/localStore';

// ─────────────────────────────────────────────────────────────────
//  Local-mode client (no Supabase needed)
// ─────────────────────────────────────────────────────────────────

function createLocalClient() {
  const db = createLocalDbClient();
  return {
    ...db,
    auth: {
      getUser: async () => {
        try {
          const cookieStore = await cookies();
          const sessionCookie = cookieStore.get(LOCAL_SESSION_COOKIE);
          if (!sessionCookie) return { data: { user: null }, error: null };
          const session = JSON.parse(sessionCookie.value);
          return {
            data: {
              user: {
                id: session.userId ?? LOCAL_DEMO_USER.id,
                email: session.email ?? LOCAL_DEMO_USER.email,
                user_metadata: { name: session.name ?? LOCAL_DEMO_USER.name },
              },
            },
            error: null,
          };
        } catch {
          return { data: { user: null }, error: null };
        }
      },
      signInWithOAuth: async ({ options }: { provider: string; options?: { redirectTo?: string } }) => {
        // In local mode, redirect to a local callback that sets the cookie
        const redirectTo = options?.redirectTo ?? '/dashboard';
        return {
          data: { url: `/api/local-auth/callback?redirectTo=${encodeURIComponent(redirectTo)}` },
          error: null,
        };
      },
      signOut: async () => {
        return { error: null };
      },
    },
  };
}

// ─────────────────────────────────────────────────────────────────
//  Real Supabase client
// ─────────────────────────────────────────────────────────────────

export async function createClient() {
  if (isLocalMode()) {
    return createLocalClient() as any;
  }

  const cookieStore = await cookies();

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet: { name: string; value: string; options?: CookieOptions }[]) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options),
            );
          } catch {
            // setAll can be called from Server Components — ignore errors
          }
        },
      },
    },
  );
}
