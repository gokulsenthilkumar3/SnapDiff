import 'dotenv/config';
import express, { type Request, type Response } from 'express';
import crypto from 'crypto';
import { screenshotQueue } from './queues/screenshotQueue';
import { startScreenshotWorker } from './workers/screenshotWorker';
import { supabase } from './lib/supabase';

const app = express();

// ── Raw body for signature verification ──────────────────────────
app.use(
  express.json({
    verify: (req: Request & { rawBody?: Buffer }, _res, buf) => {
      req.rawBody = buf;
    },
  }),
);

// ─────────────────────────────────────────────────────────────────
//  Health check
// ─────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

// ─────────────────────────────────────────────────────────────────
//  Vercel Deployment Webhook
//  Register this URL in Vercel: Project → Settings → Webhooks
// ─────────────────────────────────────────────────────────────────
app.post(
  '/webhook/vercel',
  async (req: Request & { rawBody?: Buffer }, res: Response): Promise<void> => {
    // ── 1. Verify signature ─────────────────────────────────────
    const secret = process.env.VERCEL_WEBHOOK_SECRET;
    if (secret) {
      const signature = req.headers['x-vercel-signature'] as string | undefined;
      if (!signature || !req.rawBody) {
        res.status(401).json({ error: 'Missing signature' });
        return;
      }
      const expected = crypto
        .createHmac('sha1', secret)
        .update(req.rawBody)
        .digest('hex');
      if (signature !== expected) {
        res.status(401).json({ error: 'Invalid signature' });
        return;
      }
    }

    const body = req.body;

    // ── 2. Only handle successful deployments ───────────────────
    if (body.type !== 'deployment.succeeded') {
      res.status(200).json({ skipped: true, reason: 'Not a deployment.succeeded event' });
      return;
    }

    const deployment = body.payload?.deployment;
    const deploymentUrl: string = `https://${deployment?.url}`;
    const vercelProjectId: string = body.payload?.projectId ?? '';
    const commitSha: string | null = deployment?.meta?.githubCommitSha ?? null;
    const prNumber: number | null = deployment?.meta?.githubPrId
      ? parseInt(deployment.meta.githubPrId, 10)
      : null;
    const githubRepo: string | null = deployment?.meta?.githubRepo ?? null;

    console.log(`[webhook] Deployment succeeded: ${deploymentUrl} (project: ${vercelProjectId})`);

    // ── 3. Find matching SnapDiff project ───────────────────────
    const { data: project, error } = await supabase
      .from('projects')
      .select('*')
      .eq('vercel_project_id', vercelProjectId)
      .maybeSingle();

    if (error || !project) {
      console.warn(`[webhook] No project found for Vercel project ID: ${vercelProjectId}`);
      res.status(200).json({ skipped: true, reason: 'No matching project' });
      return;
    }

    // ── 4. Create run record ────────────────────────────────────
    const { data: run, error: runError } = await supabase
      .from('runs')
      .insert({
        project_id: project.id,
        commit_sha: commitSha,
        deployment_url: deploymentUrl,
        status: 'pending',
        pr_number: prNumber,
        github_repo: githubRepo ?? project.github_repo,
      })
      .select()
      .single();

    if (runError || !run) {
      console.error('[webhook] Failed to create run record:', runError);
      res.status(500).json({ error: 'Failed to create run record' });
      return;
    }

    // ── 5. Enqueue screenshot job ───────────────────────────────
    await screenshotQueue.add('capture', {
      runId: run.id,
      projectId: project.id,
      deploymentUrl,
      commitSha,
      prNumber,
      githubRepo: githubRepo ?? project.github_repo,
      githubInstallationId: null, // Will be populated from GitHub App webhook
      pages: ['/'], // v1: capture homepage; v1.1 will crawl all routes
    });

    console.log(`[webhook] Enqueued run ${run.id} for ${deploymentUrl}`);
    res.status(200).json({ ok: true, runId: run.id });
  },
);

// ─────────────────────────────────────────────────────────────────
//  GitHub App Webhook (for installation events)
// ─────────────────────────────────────────────────────────────────
app.post('/webhook/github', async (req: Request, res: Response): Promise<void> => {
  // TODO: Handle installation and push events for richer metadata
  console.log('[webhook] GitHub event:', req.headers['x-github-event']);
  res.status(200).json({ ok: true });
});

// ─────────────────────────────────────────────────────────────────
//  Start
// ─────────────────────────────────────────────────────────────────
const PORT = parseInt(process.env.WORKER_PORT ?? '3001', 10);

app.listen(PORT, () => {
  console.log(`[server] Worker listening on http://localhost:${PORT}`);
  startScreenshotWorker();
  console.log('[server] Screenshot worker started');
});
