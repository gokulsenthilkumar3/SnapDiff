'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft, Plus, Loader2 } from 'lucide-react';

export default function NewProjectPage() {
  const router = useRouter();
  const [name, setName] = useState('');
  const [githubRepo, setGithubRepo] = useState('');
  const [vercelProjectId, setVercelProjectId] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/projects', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name, github_repo: githubRepo, vercel_project_id: vercelProjectId || undefined }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to create project');
      router.push(`/projects/${json.project.id}`);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen p-8 animate-fade-in">
      <div className="max-w-lg mx-auto">
        <Link href="/dashboard" className="inline-flex items-center gap-2 text-sm text-gray-400 hover:text-white transition-colors mb-8">
          <ArrowLeft className="w-4 h-4" /> Back to Dashboard
        </Link>

        <h1 className="text-2xl font-bold text-white mb-2">New Project</h1>
        <p className="text-gray-400 mb-8">Connect a GitHub repo + Vercel project to start visual regression testing.</p>

        <form onSubmit={handleSubmit} className="card space-y-5">
          <div>
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1.5">
              Project Name *
            </label>
            <input
              id="name"
              type="text"
              required
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="My App"
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="github-repo" className="block text-sm font-medium text-gray-300 mb-1.5">
              GitHub Repository * <span className="text-gray-500 font-normal">(owner/repo)</span>
            </label>
            <input
              id="github-repo"
              type="text"
              required
              value={githubRepo}
              onChange={(e) => setGithubRepo(e.target.value)}
              placeholder="acme/my-app"
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
          </div>

          <div>
            <label htmlFor="vercel-project-id" className="block text-sm font-medium text-gray-300 mb-1.5">
              Vercel Project ID <span className="text-gray-500 font-normal">(optional)</span>
            </label>
            <input
              id="vercel-project-id"
              type="text"
              value={vercelProjectId}
              onChange={(e) => setVercelProjectId(e.target.value)}
              placeholder="prj_xxxxxxxxxxxx"
              className="w-full px-3.5 py-2.5 rounded-lg bg-gray-800 border border-gray-700 text-white placeholder-gray-500 text-sm focus:outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1.5">
              Found in Vercel Dashboard → Project → Settings → General → Project ID
            </p>
          </div>

          {error && (
            <div className="rounded-lg bg-red-900/30 border border-red-800 px-4 py-3 text-sm text-red-400">
              {error}
            </div>
          )}

          <button
            id="create-project-btn"
            type="submit"
            disabled={loading}
            className="btn-primary w-full justify-center py-3 disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? 'Creating…' : 'Create Project'}
          </button>
        </form>
      </div>
    </div>
  );
}
