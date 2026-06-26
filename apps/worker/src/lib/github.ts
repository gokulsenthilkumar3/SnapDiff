import { App } from '@octokit/app';
import { Octokit } from '@octokit/rest';

const appId = process.env.GITHUB_APP_ID!;
const privateKey = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n') ?? '';
const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET ?? '';

if (!appId || !privateKey || !webhookSecret) {
  console.warn('[github] Warning: GitHub App credentials missing. PR comments will be disabled.');
}

const isNumeric = (val: string) => /^\d+$/.test(val);

const githubApp =
  appId && privateKey && isNumeric(appId)
    ? new App({ appId: Number(appId), privateKey, webhooks: { secret: webhookSecret } })
    : null;


/**
 * Post a comment on a GitHub PR.
 */
export async function postPRComment(params: {
  owner: string;
  repo: string;
  installationId: number;
  prNumber: number;
  body: string;
}): Promise<void> {
  if (!githubApp) {
    console.warn('[github] Skipping PR comment — GitHub App not configured.');
    return;
  }

  const { owner, repo, installationId, prNumber, body } = params;

  try {
    // getInstallationOctokit returns an Octokit-like instance — cast it to use @octokit/rest methods
    const appOctokit = await githubApp.getInstallationOctokit(installationId);
    const octokit = new Octokit({
      auth: await getInstallationToken(installationId),
    });

    await octokit.rest.issues.createComment({
      owner,
      repo,
      issue_number: prNumber,
      body,
    });
    console.log(`[github] Posted PR comment on ${owner}/${repo}#${prNumber}`);
  } catch (err) {
    console.error('[github] Failed to post PR comment:', err);
  }
}

async function getInstallationToken(installationId: number): Promise<string> {
  if (!githubApp) throw new Error('GitHub App not configured');

  // Use the App's auth plugin to get an installation token
  const octokit = await githubApp.getInstallationOctokit(installationId);
  // The octokit instance from getInstallationOctokit already has auth built in.
  // Create an Octokit instance using the same auth factory.
  const { token } = await (octokit as unknown as { auth: (args: { type: string }) => Promise<{ token: string }> })
    .auth({ type: 'installation' });
  return token;
}

/**
 * Build the markdown body for a SnapDiff PR comment.
 */
export function buildPRCommentBody(params: {
  runId: string;
  dashboardUrl: string;
  snapshots: Array<{
    url: string;
    status: string;
    diffPercent: number | null;
    diffUrl: string | null;
  }>;
}): string {
  const { runId, dashboardUrl, snapshots } = params;
  const passed = snapshots.filter((s) => s.status === 'passed').length;
  const failed = snapshots.filter((s) => s.status === 'failed').length;
  const isNew = snapshots.filter((s) => s.status === 'new').length;

  const statusEmoji = failed > 0 ? '🔴' : '✅';
  const rows = snapshots
    .map((s) => {
      const pct = s.diffPercent != null ? `${s.diffPercent.toFixed(2)}%` : '—';
      const diffImg = s.diffUrl ? `![diff](${s.diffUrl})` : '—';
      return `| \`${s.url}\` | ${s.status} | ${pct} | ${diffImg} |`;
    })
    .join('\n');

  return `## ${statusEmoji} SnapDiff Visual Regression Report

**Run:** \`${runId}\` — [View full report](${dashboardUrl}/runs/${runId})

| Page | Status | Diff % | Preview |
|------|--------|--------|---------|
${rows}

**Summary:** ${passed} passed · ${failed} failed · ${isNew} new baselines

<sub>Powered by [SnapDiff](${dashboardUrl})</sub>`;
}
