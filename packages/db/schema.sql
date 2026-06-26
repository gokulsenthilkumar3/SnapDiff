-- ─────────────────────────────────────────────────────────────────
-- SnapDiff — Database Schema
-- Run this in your Supabase SQL editor to initialize the database.
-- ─────────────────────────────────────────────────────────────────

-- Enable UUID extension (already enabled on Supabase by default)
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- ── Projects ─────────────────────────────────────────────────────
-- A project maps to a single Vercel + GitHub repo combination.
CREATE TABLE IF NOT EXISTS projects (
  id                uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name              text NOT NULL,
  github_repo       text NOT NULL,              -- "owner/repo"
  vercel_project_id text,
  owner_id          uuid REFERENCES auth.users ON DELETE CASCADE,
  created_at        timestamptz NOT NULL DEFAULT now(),
  updated_at        timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_projects_owner_id ON projects (owner_id);

-- ── Baselines ─────────────────────────────────────────────────────
-- An approved reference screenshot for a specific URL path.
CREATE TABLE IF NOT EXISTS baselines (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  url            text NOT NULL,               -- page path e.g. "/"
  screenshot_url text NOT NULL,               -- Supabase Storage URL
  approved_at    timestamptz,
  approved_by    uuid REFERENCES auth.users,
  created_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_baselines_project_id ON baselines (project_id);
CREATE UNIQUE INDEX IF NOT EXISTS idx_baselines_project_url ON baselines (project_id, url);

-- ── Runs ──────────────────────────────────────────────────────────
-- One run = one Vercel deployment event.
CREATE TABLE IF NOT EXISTS runs (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id     uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  commit_sha     text,
  deployment_url text NOT NULL,
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'running', 'passed', 'failed', 'error')),
  pr_number      integer,
  github_repo    text,
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_runs_project_id ON runs (project_id);
CREATE INDEX IF NOT EXISTS idx_runs_status ON runs (status);

-- ── Snapshots ─────────────────────────────────────────────────────
-- One snapshot = one page captured within a run.
CREATE TABLE IF NOT EXISTS snapshots (
  id             uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  run_id         uuid NOT NULL REFERENCES runs ON DELETE CASCADE,
  project_id     uuid NOT NULL REFERENCES projects ON DELETE CASCADE,
  url            text NOT NULL,               -- page path e.g. "/"
  deployment_url text NOT NULL,
  screenshot_url text,                        -- Supabase Storage URL
  baseline_url   text,                        -- baseline used for diff
  diff_url       text,                        -- diff image URL
  diff_percent   float,                       -- 0-100
  status         text NOT NULL DEFAULT 'pending'
                   CHECK (status IN ('pending', 'running', 'passed', 'failed', 'new')),
  created_at     timestamptz NOT NULL DEFAULT now(),
  updated_at     timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_snapshots_run_id ON snapshots (run_id);
CREATE INDEX IF NOT EXISTS idx_snapshots_project_id ON snapshots (project_id);

-- ── Row Level Security ────────────────────────────────────────────
ALTER TABLE projects  ENABLE ROW LEVEL SECURITY;
ALTER TABLE baselines ENABLE ROW LEVEL SECURITY;
ALTER TABLE runs      ENABLE ROW LEVEL SECURITY;
ALTER TABLE snapshots ENABLE ROW LEVEL SECURITY;

-- Projects: owners can do everything
CREATE POLICY "projects_owner_all" ON projects
  FOR ALL USING (auth.uid() = owner_id);

-- Baselines: accessible if user owns the project
CREATE POLICY "baselines_owner_all" ON baselines
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = baselines.project_id AND projects.owner_id = auth.uid())
  );

-- Runs: accessible if user owns the project
CREATE POLICY "runs_owner_all" ON runs
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = runs.project_id AND projects.owner_id = auth.uid())
  );

-- Snapshots: accessible if user owns the project
CREATE POLICY "snapshots_owner_all" ON snapshots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM projects WHERE projects.id = snapshots.project_id AND projects.owner_id = auth.uid())
  );

-- ── Storage Buckets ───────────────────────────────────────────────
-- Run these manually in Supabase Dashboard → Storage or via the CLI.
-- INSERT INTO storage.buckets (id, name, public) VALUES ('snapshots', 'snapshots', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('baselines', 'baselines', true);
-- INSERT INTO storage.buckets (id, name, public) VALUES ('diffs', 'diffs', true);
