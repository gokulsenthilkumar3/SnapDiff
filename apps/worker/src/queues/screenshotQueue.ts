import { isLocalMode } from '../lib/localMode';
import { addLocalJob } from '../lib/localQueue';

// Lazily import BullMQ Queue to avoid Redis connection errors in local mode
let _queue: import('bullmq').Queue | null = null;

async function getQueue() {
  if (_queue) return _queue;
  const { Queue } = await import('bullmq');
  const { redisConnection } = await import('../lib/redis');
  _queue = new Queue<ScreenshotJobData>('screenshot-queue', {
    connection: redisConnection,
    defaultJobOptions: {
      attempts: 3,
      backoff: { type: 'exponential', delay: 5000 },
      removeOnComplete: 100,
      removeOnFail: 200,
    },
  });
  return _queue;
}

export interface ScreenshotJobData {
  runId: string;
  projectId: string;
  deploymentUrl: string;
  commitSha: string | null;
  prNumber: number | null;
  githubRepo: string | null;
  githubInstallationId: number | null;
  pages: string[];
}

export const screenshotQueue = {
  add: async (name: string, data: ScreenshotJobData) => {
    if (isLocalMode()) {
      await addLocalJob(name, data);
      return;
    }
    const q = await getQueue();
    await q.add(name, data);
  },
};
