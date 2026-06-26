import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Camera, Plus, FolderOpen, GitBranch, CheckCircle, XCircle, Clock } from 'lucide-react';
import type { Project, Run } from '@snapdiff/db';

function StatusBadge({ status }: { status: Run['status'] }) {
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
  return (
    <span className={map[status]}>
      {icons[status]} {status}
    </span>
  );
}

export const metadata = { title: 'Dashboard — SnapDiff' };

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect('/login');

  const { data: projects } = await supabase
    .from('projects')
    .select('*')
    .eq('owner_id', user.id)
    .order('created_at', { ascending: false });

  // Fetch latest run for each project
  const projectIds = (projects ?? []).map((p: Project) => p.id);
  const { data: latestRuns } = projectIds.length
    ? await supabase
        .from('runs')
        .select('*')
        .in('project_id', projectIds)
        .order('created_at', { ascending: false })
        .limit(50)
    : { data: [] };

  const latestRunByProject = (latestRuns ?? []).reduce<Record<string, Run>>((acc, run: Run) => {
    if (!acc[run.project_id]) acc[run.project_id] = run;
    return acc;
  }, {});

  return (
    <div className="min-h-screen">
      {/* Sidebar */}
      <aside className="fixed left-0 top-0 bottom-0 w-60 border-r border-gray-800 bg-gray-950 flex flex-col">
        <div className="p-5 border-b border-gray-800">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-lg bg-brand-600 flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-white" />
            </div>
            <span className="font-bold text-white">SnapDiff</span>
          </div>
        </div>
        <nav className="flex-1 p-4 space-y-1">
          <Link
            href="/dashboard"
            className="flex items-center gap-3 px-3 py-2 rounded-lg bg-brand-600/10 text-brand-400 text-sm font-medium"
          >
            <FolderOpen className="w-4 h-4" /> Projects
          </Link>
        </nav>
        <div className="p-4 border-t border-gray-800">
          <form action="/auth/signout" method="POST">
            <button className="w-full text-left text-xs text-gray-500 hover:text-gray-300 transition-colors px-3 py-2">
              Sign out
            </button>
          </form>
        </div>
      </aside>

      {/* Main content */}
      <main className="ml-60 p-8 animate-fade-in">
        <div className="max-w-5xl">
          {/* Header */}
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-2xl font-bold text-white">Projects</h1>
              <p className="text-gray-400 text-sm mt-1">
                {(projects ?? []).length} project{(projects ?? []).length !== 1 ? 's' : ''}
              </p>
            </div>
            <Link href="/projects/new" className="btn-primary">
              <Plus className="w-4 h-4" /> New Project
            </Link>
          </div>

          {/* Project grid */}
          {(projects ?? []).length === 0 ? (
            <div className="flex flex-col items-center justify-center py-24 text-center">
              <div className="w-16 h-16 rounded-2xl bg-brand-600/10 border border-brand-500/20 flex items-center justify-center mb-4">
                <Camera className="w-8 h-8 text-brand-400" />
              </div>
              <h2 className="text-xl font-semibold text-white mb-2">No projects yet</h2>
              <p className="text-gray-400 mb-6 max-w-sm">
                Create your first project to start catching visual regressions on your Vercel deployments.
              </p>
              <Link href="/projects/new" className="btn-primary">
                <Plus className="w-4 h-4" /> Create First Project
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {(projects as Project[]).map((project) => {
                const latestRun = latestRunByProject[project.id];
                return (
                  <Link
                    key={project.id}
                    href={`/projects/${project.id}`}
                    className="card group block"
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-2.5">
                        <div className="w-9 h-9 rounded-lg bg-brand-600/10 border border-brand-500/20 flex items-center justify-center group-hover:bg-brand-600/20 transition-colors">
                          <Camera className="w-4 h-4 text-brand-400" />
                        </div>
                        <div>
                          <div className="font-semibold text-white text-sm">{project.name}</div>
                          <div className="flex items-center gap-1 text-xs text-gray-500 mt-0.5">
                            <GitBranch className="w-3 h-3" />
                            {project.github_repo}
                          </div>
                        </div>
                      </div>
                      {latestRun && <StatusBadge status={latestRun.status} />}
                    </div>
                    <div className="text-xs text-gray-500">
                      {latestRun
                        ? `Last run ${new Date(latestRun.created_at).toLocaleDateString()}`
                        : 'No runs yet'}
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
