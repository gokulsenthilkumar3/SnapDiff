import { Worker, Job } from 'bullmq';
import { chromium } from 'playwright';
import { redisConnection } from '../lib/redis';
import { supabase } from '../lib/supabase';
import { generateDiff } from '../lib/diff';
import { uploadImage, downloadImage } from '../lib/storage';
import { postPRComment, buildPRCommentBody } from '../lib/github';
import type { ScreenshotJobData } from '../queues/screenshotQueue';

const DASHBOARD_URL = process.env.NEXT_PUBLIC_SITE_URL ?? 'http://localhost:3000';

export function startScreenshotWorker() {
  const worker = new Worker<ScreenshotJobData>(
    'screenshot-queue',
    async (job: Job<ScreenshotJobData>) => {
      const {
        runId,
        projectId,
        deploymentUrl,
        commitSha,
        prNumber,
        githubRepo,
        githubInstallationId,
        pages,
      } = job.data;

      console.log(`[worker] Starting run ${runId} — ${deploymentUrl}`);

      // ── 1. Mark run as running ──────────────────────────────────
      await supabase
        .from('runs')
        .update({ status: 'running', updated_at: new Date().toISOString() })
        .eq('id', runId);

      const browser = await chromium.launch({ args: ['--no-sandbox'] });
      const snapshotResults: Array<{
        url: string;
        status: string;
        diffPercent: number | null;
        diffUrl: string | null;
      }> = [];

      let runFailed = false;

      try {
        for (const pagePath of pages) {
          const pageUrl = `${deploymentUrl.replace(/\/$/, '')}${pagePath}`;
          console.log(`[worker] Capturing ${pageUrl}`);

          await job.updateProgress({ page: pagePath, phase: 'screenshot' });

          // ── 2. Create snapshot record ────────────────────────────
          const { data: snapshot, error: snapshotError } = await supabase
            .from('snapshots')
            .insert({
              run_id: runId,
              project_id: projectId,
              url: pagePath,
              deployment_url: deploymentUrl,
              status: 'running',
            })
            .select()
            .single();

          if (snapshotError || !snapshot) {
            console.error('[worker] Failed to create snapshot record:', snapshotError);
            continue;
          }

          try {
            // ── 3. Capture screenshot ────────────────────────────
            const context = await browser.newContext({
              viewport: { width: 1280, height: 800 },
            });
            const page = await context.newPage();
            await page.goto(pageUrl, { waitUntil: 'networkidle', timeout: 30_000 });
            const screenshotBuffer = await page.screenshot({ fullPage: true });
            await context.close();

            // ── 4. Upload screenshot ─────────────────────────────
            const screenshotPath = `${projectId}/${runId}/${snapshot.id}/screenshot.png`;
            const screenshotUrl = await uploadImage({
              bucket: 'snapshots',
              path: screenshotPath,
              buffer: screenshotBuffer,
            });

            await supabase
              .from('snapshots')
              .update({ screenshot_url: screenshotUrl })
              .eq('id', snapshot.id);

            // ── 5. Fetch baseline ────────────────────────────────
            const { data: baseline } = await supabase
              .from('baselines')
              .select('*')
              .eq('project_id', projectId)
              .eq('url', pagePath)
              .maybeSingle();

            if (!baseline) {
              // No baseline yet — this IS the baseline
              console.log(`[worker] No baseline found for ${pagePath} — treating as new`);

              // Auto-create baseline from this snapshot
              await supabase.from('baselines').upsert(
                {
                  project_id: projectId,
                  url: pagePath,
                  screenshot_url: screenshotUrl,
                  approved_at: null, // pending manual approval
                },
                { onConflict: 'project_id,url' },
              );

              await supabase
                .from('snapshots')
                .update({
                  status: 'new',
                  baseline_url: screenshotUrl,
                  updated_at: new Date().toISOString(),
                })
                .eq('id', snapshot.id);

              snapshotResults.push({ url: pagePath, status: 'new', diffPercent: null, diffUrl: null });
              continue;
            }

            // ── 6. Download baseline & generate diff ─────────────
            await job.updateProgress({ page: pagePath, phase: 'diff' });

            const baselineBuffer = await downloadImage(baseline.screenshot_url);
            const { diffPng, diffPercent } = await generateDiff(baselineBuffer, screenshotBuffer);

            // ── 7. Upload diff image ──────────────────────────────
            const diffPath = `${projectId}/${runId}/${snapshot.id}/diff.png`;
            const diffUrl = await uploadImage({ bucket: 'diffs', path: diffPath, buffer: diffPng });

            // ── 8. Determine status ───────────────────────────────
            const DIFF_THRESHOLD = 0.1; // 0.1% pixel change = fail
            const status = diffPercent > DIFF_THRESHOLD ? 'failed' : 'passed';
            if (status === 'failed') runFailed = true;

            await supabase
              .from('snapshots')
              .update({
                status,
                baseline_url: baseline.screenshot_url,
                diff_url: diffUrl,
                diff_percent: diffPercent,
                updated_at: new Date().toISOString(),
              })
              .eq('id', snapshot.id);

            snapshotResults.push({ url: pagePath, status, diffPercent, diffUrl });
            console.log(`[worker] ${pagePath} → ${status} (${diffPercent.toFixed(2)}% diff)`);
          } catch (pageErr) {
            console.error(`[worker] Error processing page ${pagePath}:`, pageErr);
            await supabase
              .from('snapshots')
              .update({ status: 'failed', updated_at: new Date().toISOString() })
              .eq('id', snapshot.id);
            snapshotResults.push({ url: pagePath, status: 'failed', diffPercent: null, diffUrl: null });
            runFailed = true;
          }
        }
      } finally {
        await browser.close();
      }

      // ── 9. Update run status ────────────────────────────────────
      const finalStatus = runFailed ? 'failed' : 'passed';
      await supabase
        .from('runs')
        .update({ status: finalStatus, updated_at: new Date().toISOString() })
        .eq('id', runId);

      // ── 10. Post GitHub PR comment ──────────────────────────────
      if (prNumber && githubRepo && githubInstallationId) {
        const [owner, repo] = githubRepo.split('/');
        const body = buildPRCommentBody({
          runId,
          dashboardUrl: DASHBOARD_URL,
          snapshots: snapshotResults,
        });
        await postPRComment({ owner, repo, installationId: githubInstallationId, prNumber, body });
      }

      console.log(`[worker] Run ${runId} complete — ${finalStatus}`);
    },
    {
      connection: redisConnection,
      concurrency: 2,
    },
  );

  worker.on('completed', (job) => console.log(`[worker] Job ${job.id} completed`));
  worker.on('failed', (job, err) => console.error(`[worker] Job ${job?.id} failed:`, err));

  return worker;
}
