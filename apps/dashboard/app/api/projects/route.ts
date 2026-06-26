import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// GET /api/projects — list authenticated user's projects
export async function GET() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { data, error } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ projects: data });
}

// POST /api/projects — create a new project
export async function POST(request: Request) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await request.json();
  const { name, github_repo, vercel_project_id } = body;

  if (!name || !github_repo) {
    return NextResponse.json({ error: 'name and github_repo are required' }, { status: 400 });
  }

  const { data, error } = await supabase
    .from('projects')
    .insert({ name, github_repo, vercel_project_id: vercel_project_id ?? null, owner_id: user.id })
    .select()
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ project: data }, { status: 201 });
}
