// SnapDiff — Shared TypeScript types mirroring the Supabase schema

export type SnapshotStatus = 'pending' | 'running' | 'passed' | 'failed' | 'new';
export type RunStatus = 'pending' | 'running' | 'passed' | 'failed' | 'error';

export interface Project {
  id: string;
  name: string;
  github_repo: string;       // "owner/repo"
  vercel_project_id: string | null;
  owner_id: string;
  created_at: string;
  updated_at: string;
}

export interface Baseline {
  id: string;
  project_id: string;
  url: string;               // page path e.g. "/"
  screenshot_url: string;    // Supabase Storage URL
  approved_at: string | null;
  approved_by: string | null;
  created_at: string;
}

export interface Run {
  id: string;
  project_id: string;
  commit_sha: string | null;
  deployment_url: string;
  status: RunStatus;
  pr_number: number | null;
  github_repo: string | null;
  created_at: string;
  updated_at: string;
}

export interface Snapshot {
  id: string;
  run_id: string;
  project_id: string;
  url: string;
  deployment_url: string;
  screenshot_url: string | null;
  baseline_url: string | null;
  diff_url: string | null;
  diff_percent: number | null;
  status: SnapshotStatus;
  created_at: string;
  updated_at: string;
}

// ─── Supabase database type map (for createClient<Database>()) ────
export type Database = {
  public: {
    Tables: {
      projects: {
        Row: Project;
        Insert: Omit<Project, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Project, 'id' | 'created_at'>>;
      };
      baselines: {
        Row: Baseline;
        Insert: Omit<Baseline, 'id' | 'created_at'>;
        Update: Partial<Omit<Baseline, 'id' | 'created_at'>>;
      };
      runs: {
        Row: Run;
        Insert: Omit<Run, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Run, 'id' | 'created_at'>>;
      };
      snapshots: {
        Row: Snapshot;
        Insert: Omit<Snapshot, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Snapshot, 'id' | 'created_at'>>;
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: Record<string, never>;
  };
};
