'use client';

import { useState } from 'react';
import { createClient } from '@/lib/supabase/client';
import { CheckCircle, XCircle, Loader2 } from 'lucide-react';
import type { Snapshot } from '@snapdiff/db';

interface ApproveButtonProps {
  snapshot: Snapshot;
  projectId: string;
}

export function ApproveButton({ snapshot, projectId }: ApproveButtonProps) {
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleApprove() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/baselines/${snapshot.id}/approve`, { method: 'POST' });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? 'Failed');
      setDone(true);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Unknown error');
    } finally {
      setLoading(false);
    }
  }

  if (done) {
    return (
      <span className="badge-passed">
        <CheckCircle className="w-3.5 h-3.5" /> Approved
      </span>
    );
  }

  return (
    <div className="flex flex-col items-start gap-1">
      <button
        id={`approve-btn-${snapshot.id}`}
        onClick={handleApprove}
        disabled={loading}
        className="btn-primary py-2 px-4 text-xs disabled:opacity-60"
      >
        {loading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <CheckCircle className="w-3.5 h-3.5" />}
        {loading ? 'Approving…' : 'Approve Baseline'}
      </button>
      {error && <p className="text-xs text-red-400">{error}</p>}
    </div>
  );
}
