/**
 * Returns true when running in local demo mode (no real Supabase/Redis configured).
 * Detection: SUPABASE_URL is missing or contains "placeholder".
 */
export function isLocalMode(): boolean {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL ?? '';
  return !url || url.includes('placeholder') || url === 'https://placeholder-project.supabase.co';
}

/** Fixed demo user used in local mode */
export const LOCAL_DEMO_USER = {
  id: 'demo-user-001',
  email: 'demo@snapdiff.dev',
  name: 'Demo User',
};

export const LOCAL_SESSION_COOKIE = 'snapdiff-local-session';
