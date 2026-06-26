import { Queue } from 'bullmq';
import { redisConnection } from '../lib/redis';

export interface ScreenshotJobData {
  runId: string;
  projectId: string;
  deploymentUrl: string;
  commitSha: string | null;
  prNumber: number | null;
  githubRepo: string | null;        // "owner/repo"
  githubInstallationId: number | null;
  pages: string[];                  // URL paths to capture e.g. ["/", "/about"]
}

export const screenshotQueue = new Queue<ScreenshotJobData>('screenshot-queue', {
  connection: redisConnection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: 100,
    removeOnFail: 200,
  },
});
