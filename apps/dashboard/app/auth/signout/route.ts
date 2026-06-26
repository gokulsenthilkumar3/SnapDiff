import { redirect } from 'next/navigation';
import { NextResponse } from 'next/server';
import { isLocalMode, LOCAL_SESSION_COOKIE } from '@/lib/mode';

export async function POST() {
  if (isLocalMode()) {
    const response = NextResponse.redirect(
      new URL('/login', process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000'),
    );
    response.cookies.set(LOCAL_SESSION_COOKIE, '', { maxAge: 0, path: '/' });
    return response;
  }

  const { createClient } = await import('@/lib/supabase/server');
  const supabase = await createClient();
  await supabase.auth.signOut();
  redirect('/login');
}
