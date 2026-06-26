import { createClient } from '@/lib/supabase/server';
import { redirect, notFound } from 'next/navigation';
import Image from 'next/image';
import Link from 'next/link';
import { ArrowLeft, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import { ApproveButton } from './ApproveButton';
import type { Run, Snapshot } from '@snapdiff/db';

function SnapshotStatusBadge({ status }: { status: Snapshot['status'] }) {
  const map: Record<Snapshot['status'], string> = {
    passed:  'badge-passed',
    failed:  'badge-failed',
    pending: 'badge-pending',
    running: 'badge-running',
    new:     'badge-new',
  };
  const icons: Record<Snapshot['status'], React.ReactNode> = {
    passed:  <CheckCircle className="w-3 h-3" />,
    failed:  <XCircle className="w-3 h-3" />,
    pending: <Clock className="w-3 h-3" />,
    running: <Clock className="w-3 h-3 animate-spin" />,
    new:     <AlertCircle className="w-3 h-3" />,
  };
  return <span className={map[status]}>{icons[status]} {status}</span>;
}

export async function generateMetadata({ params }: { params: Promise<{ id: string; runId: string }> }) {
  return { title: 'Run Detail — SnapDiff' };
}

export default async function RunDetailPage({
  params,
}: {
  params: Promise<{ id: string; runId: string }>;
}) {
  const { id, runId } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: run } = await supabase
    .from('runs')
    .select('*')
    .eq('id', runId)
    .eq('project_id', id)
    .maybeSingle();

  if (!run) notFound();

  const { data: snapshots } = await supabase
    .from('snapshots')
    .select('*')
    .eq('run_id', runId)
    .order('created_at', { ascending: true });

  const failedCount = (snapshots ?? []).filter((s: Snapshot) => s.status === 'failed').length;
  const passedCount = (snapshots ?? []).filter((s: Snapshot) => s.status === 'passed').length;
  const newCount = (snapshots ?? []).filter((s: Snapshot) => s.status === 'new').length;

  return (
    <div className="min-h-screen p-8 animate-fade-in">
      <div className="max-w-6xl mx-auto">
        {/* Breadcrumb */}
        <Link
          href={`/projects/${id}`}
          className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-6"
        >
          <ArrowLeft className="w-4 h-4" /> Back to Project
        </Link>

        {/* Run header */}
        <div className="card mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <h1 className="text-xl font-bold text-white mb-1">
                Run <code className="font-mono text-brand-400 text-base">{runId.slice(0, 8)}</code>
              </h1>
              <p className="text-sm text-gray-400 truncate">{(run as Run).deployment_url}</p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-sm text-gray-400">
                {passedCount} passed · {failedCount} failed · {newCount} new
              </span>
            </div>
          </div>
        </div>

        {/* Snapshots */}
        <div className="space-y-8">
          {(snapshots as Snapshot[]).map((snapshot) => (
            <div key={snapshot.id} className="card">
              {/* Snapshot header */}
              <div className="flex items-center justify-between mb-5 flex-wrap gap-3">
                <div className="flex items-center gap-3">
                  <code className="text-sm font-mono text-gray-300 bg-gray-800 px-2.5 py-1 rounded">
                    {snapshot.url}
                  </code>
                  <SnapshotStatusBadge status={snapshot.status} />
                  {snapshot.diff_percent != null && (
                    <span className={`text-sm font-semibold ${snapshot.diff_percent > 0.1 ? 'text-red-400' : 'text-emerald-400'}`}>
                      {snapshot.diff_percent.toFixed(2)}% diff
                    </span>
                  )}
                </div>
                {(snapshot.status === 'failed' || snapshot.status === 'new') && (
                  <ApproveButton snapshot={snapshot} projectId={id} />
                )}
              </div>

              {/* Image comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                {/* Baseline */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Baseline</div>
                  {snapshot.baseline_url ? (
                    <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900 aspect-video">
                      <Image
                        src={snapshot.baseline_url}
                        alt="Baseline screenshot"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-700 bg-gray-900 aspect-video flex items-center justify-center">
                      <span className="text-xs text-gray-500">No baseline</span>
                    </div>
                  )}
                </div>

                {/* Current snapshot */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold">Current</div>
                  {snapshot.screenshot_url ? (
                    <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900 aspect-video">
                      <Image
                        src={snapshot.screenshot_url}
                        alt="Current screenshot"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-700 bg-gray-900 aspect-video flex items-center justify-center">
                      <span className="text-xs text-gray-500">Pending</span>
                    </div>
                  )}
                </div>

                {/* Diff */}
                <div>
                  <div className="text-xs text-gray-500 uppercase tracking-wider mb-2 font-semibold flex items-center gap-1.5">
                    Diff
                    {snapshot.diff_percent != null && (
                      <span className={`normal-case font-normal ${snapshot.diff_percent > 0.1 ? 'text-red-400' : 'text-emerald-400'}`}>
                        ({snapshot.diff_percent.toFixed(2)}%)
                      </span>
                    )}
                  </div>
                  {snapshot.diff_url ? (
                    <div className="relative rounded-lg overflow-hidden border border-gray-700 bg-gray-900 aspect-video">
                      <Image
                        src={snapshot.diff_url}
                        alt="Diff image"
                        fill
                        className="object-contain"
                        unoptimized
                      />
                    </div>
                  ) : (
                    <div className="rounded-lg border border-gray-700 bg-gray-900 aspect-video flex items-center justify-center">
                      <span className="text-xs text-gray-500">
                        {snapshot.status === 'new' ? 'First capture' : 'No diff'}
                      </span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
