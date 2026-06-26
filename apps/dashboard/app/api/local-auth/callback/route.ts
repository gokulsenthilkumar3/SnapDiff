import { NextRequest, NextResponse } from 'next/server';
import { isLocalMode, LOCAL_SESSION_COOKIE, LOCAL_DEMO_USER } from '@/lib/mode';

/**
 * Local-auth callback route — used in local demo mode to set the session cookie
 * after the "fake" OAuth redirect. Called by app/auth/github/route.ts in local mode.
 */
export async function GET(request: NextRequest) {
  if (isLocalMode()) {
    const { searchParams } = new URL(request.url);
    const redirectTo = searchParams.get('redirectTo') ?? '/dashboard';
    const response = NextResponse.redirect(new URL(redirectTo, request.url));
    response.cookies.set(
      LOCAL_SESSION_COOKIE,
      JSON.stringify({ userId: LOCAL_DEMO_USER.id, email: LOCAL_DEMO_USER.email }),
      { httpOnly: true, path: '/', maxAge: 60 * 60 * 24 * 7, sameSite: 'lax' },
    );
    return response;
  }
  return NextResponse.redirect(new URL('/login', request.url));
}
