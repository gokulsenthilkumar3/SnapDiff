import { NextRequest, NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

/**
 * POST /api/projects/[id]/trigger-run
 * Manually triggers a screenshot run for a project (local demo mode).
 * Simulates a Vercel deployment event by POSTing to the worker.
 */
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> },
) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  // Get project
  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!project) return NextResponse.json({ error: 'Project not found' }, { status: 404 });

  const body = await request.json().catch(() => ({}));
  const deploymentUrl = body.deploymentUrl ?? 'http://localhost:3000';
  const pages = body.pages ?? ['/'];

  // Simulate a Vercel webhook event to the worker
  const workerUrl = process.env.WORKER_INTERNAL_URL ?? 'http://localhost:3001';

  const workerPayload = {
    type: 'deployment.succeeded',
    payload: {
      projectId: project.vercel_project_id ?? id,
      _snapdiffProjectId: id, // used by worker in local mode to find project by id directly
      deployment: {
        url: deploymentUrl.replace(/^https?:\/\//, ''),
        meta: {
          githubCommitSha: null,
          githubPrId: null,
          githubRepo: project.github_repo,
        },
      },
    },
  };

  try {
    const workerRes = await fetch(`${workerUrl}/webhook/vercel`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(workerPayload),
    });
    const workerJson = await workerRes.json();
    return NextResponse.json({ ok: true, ...workerJson });
  } catch (err) {
    console.error('[trigger-run] Failed to reach worker:', err);
    return NextResponse.json(
      { error: 'Worker not reachable. Is the worker running on port 3001?' },
      { status: 503 },
    );
  }
}
