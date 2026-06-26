import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock, Camera, GitCommit } from 'lucide-react';
import type { Run } from '@snapdiff/db';

function RunStatusBadge({ status }: { status: Run['status'] }) {
  const map: Record<Run['status'], string> = {
    passed:  'badge-passed',
    failed:  'badge-failed',
    pending: 'badge-pending',
    running: 'badge-running',
    error:   'badge-error',
  };
  const icons: Record<Run['status'], React.ReactNode> = {
    passed:  <CheckCircle className="w-3 h-3" />,
    failed:  <XCircle className="w-3 h-3" />,
    pending: <Clock className="w-3 h-3" />,
    running: <Clock className="w-3 h-3 animate-spin" />,
    error:   <XCircle className="w-3 h-3" />,
  };
  return <span className={map[status]}>{icons[status]} {status}</span>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string }> }) {
  return { title: 'Project — SnapDiff' };
}

export default async function ProjectPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: project } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('owner_id', user.id)
    .maybeSingle();

  if (!project) notFound();

  const { data: runs } = await supabase
    .from('runs')
    .select('*')
    .eq('project_id', id)
    .order('created_at', { ascending: false })
    .limit(30);

  return (
    <div className="min-h-screen p-8 animate-fade-in">
      <div className="max-w-4xl mx-auto">
        {/* Breadcrumb */}
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6">
          <ArrowLeft className="w-4 h-4" /> Back to Projects
        </Link>

        {/* Header */}
        <div className="flex items-start justify-between mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-10 h-10 rounded-xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center">
                <Camera className="w-5 h-5 text-brand-400" />
              </div>
              <h1 className="text-2xl font-bold text-white">{project.name}</h1>
            </div>
            <p className="text-gray-400 text-sm ml-13">{project.github_repo}</p>
          </div>
        </div>

        {/* Runs list */}
        <div>
          <h2 className="text-lg font-semibold text-white mb-4">Run History</h2>
          {(runs ?? []).length === 0 ? (
            <div className="card text-center py-12">
              <Camera className="w-10 h-10 text-gray-600 mx-auto mb-3" />
              <p className="text-gray-400">No runs yet. Trigger a Vercel deployment to start.</p>
            </div>
          ) : (
            <div className="space-y-3">
              {(runs as Run[]).map((run) => (
                <Link
                  key={run.id}
                  href={`/projects/${id}/runs/${run.id}`}
                  className="card flex items-center justify-between group"
                >
                  <div className="flex items-center gap-4">
                    <RunStatusBadge status={run.status} />
                    <div>
                      <div className="text-sm font-medium text-white flex items-center gap-2">
                        {run.commit_sha && (
                          <span className="flex items-center gap-1 text-gray-400">
                            <GitCommit className="w-3.5 h-3.5" />
                            <code className="font-mono text-xs">{run.commit_sha.slice(0, 7)}</code>
                          </span>
                        )}
                        {run.pr_number && (
                          <span className="text-brand-400 text-xs">PR #{run.pr_number}</span>
                        )}
                      </div>
                      <div className="text-xs text-gray-500 mt-0.5 truncate max-w-xs">
                        {run.deployment_url}
                      </div>
                    </div>
                  </div>
                  <div className="text-xs text-gray-500 flex-shrink-0">
                    {new Date(run.created_at).toLocaleString()}
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
