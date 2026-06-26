/**
 * Returns true when the worker is running in local demo mode.
 * Detection: SUPABASE_URL is missing or uses placeholder values.
 */
export function isLocalMode(): boolean {
  const url = process.env.SUPABASE_URL ?? '';
  return !url || url.includes('placeholder');
}

export const DASHBOARD_INTERNAL_URL =
  process.env.DASHBOARD_INTERNAL_URL ?? 'http://localhost:3000';
