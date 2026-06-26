import { createClient } from '@/lib/supabase/server';
import { NextResponse } from 'next/server';

// POST /api/baselines/[id]/approve
// Approves the snapshot as the new baseline for its URL.
export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id: snapshotId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Fetch the snapshot
  const { data: snapshot, error: snapshotError } = await supabase
    .from('snapshots')
    .select('*')
    .eq('id', snapshotId)
    .maybeSingle();

  if (snapshotError || !snapshot) {
    return NextResponse.json({ error: 'Snapshot not found' }, { status: 404 });
  }

  // Verify ownership via project
  const { data: project } = await supabase
    .from('projects')
    .select('id')
    .eq('id', snapshot.project_id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!project) {
    return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
  }

  if (!snapshot.screenshot_url) {
    return NextResponse.json({ error: 'Snapshot has no screenshot URL' }, { status: 400 });
  }

  // Upsert baseline: update existing row for this project+url, or insert new
  const { error: baselineError } = await supabase.from('baselines').upsert(
    {
      project_id: snapshot.project_id,
      url: snapshot.url,
      screenshot_url: snapshot.screenshot_url,
      approved_at: new Date().toISOString(),
      approved_by: user.id,
    },
    { onConflict: 'project_id,url' },
  );

  if (baselineError) {
    return NextResponse.json({ error: baselineError.message }, { status: 500 });
  }

  // Mark snapshot as passed
  await supabase
    .from('snapshots')
    .update({ status: 'passed', updated_at: new Date().toISOString() })
    .eq('id', snapshotId);

  return NextResponse.json({ ok: true });
}
