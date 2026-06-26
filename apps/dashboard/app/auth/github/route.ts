import { redirect } from 'next/navigation';
import { NextRequest, NextResponse } from 'next/server';
import { isLocalMode, LOCAL_SESSION_COOKIE, LOCAL_DEMO_USER } from '@/lib/mode';

export async function GET(request: NextRequest) {
  // ── Local demo mode: instant login ────────────────────────────
  if (isLocalMode()) {
    const response = NextResponse.redirect(new URL('/dashboard', request.url));
    response.cookies.set(
      LOCAL_SESSION_COOKIE,
      JSON.stringify({ userId: LOCAL_DEMO_USER.id, email: LOCAL_DEMO_USER.email, name: LOCAL_DEMO_USER.name }),
      {
        httpOnly: true,
        path: '/',
        maxAge: 60 * 60 * 24 * 7, // 7 days
        sameSite: 'lax',
      },
    );
    return response;
  }

  // ── Real Supabase OAuth ────────────────────────────────────────
  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  const { data, error } = await supabase.auth.signInWithOAuth({
    provider: 'github',
    options: {
      redirectTo: `${process.env.NEXT_PUBLIC_SITE_URL}/auth/callback`,
    },
  });

  if (error || !data.url) redirect('/login?error=oauth_failed');
  redirect(data.url);
}
