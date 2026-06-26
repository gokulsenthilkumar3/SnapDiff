'use client';

import { useState } from 'react';
import { Play, Loader2, ChevronDown, ChevronUp } from 'lucide-react';

interface TriggerRunButtonProps {
  projectId: string;
}

export function TriggerRunButton({ projectId }: TriggerRunButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [deploymentUrl, setDeploymentUrl] = useState('http://localhost:3000');
  const [pagesInput, setPagesInput] = useState('/');

  async function handleTrigger() {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const pages = pagesInput
        .split(',')
        .map((p) => p.trim())
        .filter(Boolean);

      const res = await fetch(`/api/projects/${projectId}/trigger-run`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ deploymentUrl, pages }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed to trigger run');
      setSuccess(`Run started! Refresh in a few seconds to see results.`);
      // Auto-refresh after 5s
      setTimeout(() => window.location.reload(), 5000);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="card mb-6 border-brand-800/50 bg-brand-950/20">
      <div className="flex items-center justify-between mb-3">
        <div>
          <h3 className="text-sm font-semibold text-white flex items-center gap-2">
            <Play className="w-4 h-4 text-brand-400" />
            Trigger Test Run
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">Capture screenshots and run visual diff</p>
        </div>
        <button
          onClick={() => setShowAdvanced((v) => !v)}
          className="text-xs text-gray-500 hover:text-gray-300 flex items-center gap-1 transition-colors"
        >
          {showAdvanced ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          {showAdvanced ? 'Less' : 'Options'}
        </button>
      </div>

      {showAdvanced && (
        <div className="space-y-3 mb-4">
          <div>
            <label className="block text-xs text-gray-400 mb-1">Target URL</label>
            <input
              type="text"
              value={deploymentUrl}
              onChange={(e) => setDeploymentUrl(e.target.value)}
              placeholder="http://localhost:3000"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
          <div>
            <label className="block text-xs text-gray-400 mb-1">Pages (comma separated)</label>
            <input
              type="text"
              value={pagesInput}
              onChange={(e) => setPagesInput(e.target.value)}
              placeholder="/, /about, /pricing"
              className="w-full px-3 py-2 rounded-lg bg-gray-800 border border-gray-700 text-white text-sm placeholder-gray-500 focus:outline-none focus:border-brand-500 transition-colors"
            />
          </div>
        </div>
      )}

      <div className="flex items-center gap-3">
        <button
          id="trigger-run-btn"
          onClick={handleTrigger}
          disabled={loading}
          className="btn-primary text-sm py-2 px-4 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Play className="w-3.5 h-3.5" />}
          {loading ? 'Running…' : 'Run Now'}
        </button>
        {success && <p className="text-xs text-emerald-400">{success}</p>}
        {error && <p className="text-xs text-red-400">{error}</p>}
      </div>
    </div>
  );
}
