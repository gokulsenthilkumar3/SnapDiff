/**
 * In-process async job queue for local demo mode.
 * Replaces BullMQ + Redis with a simple EventEmitter-based runner.
 */
import { EventEmitter } from 'events';
import type { ScreenshotJobData } from '../queues/screenshotQueue';

type JobProcessor = (job: { data: ScreenshotJobData; updateProgress: (p: unknown) => Promise<void> }) => Promise<void>;

const emitter = new EventEmitter();
let processor: JobProcessor | null = null;

/** Register the processor function (called from startScreenshotWorker) */
export function registerLocalProcessor(fn: JobProcessor) {
  processor = fn;
}

/** Add a job to the local queue */
export async function addLocalJob(_name: string, data: ScreenshotJobData): Promise<void> {
  // Run asynchronously, don't await so webhook can return immediately
  setImmediate(async () => {
    if (!processor) {
      console.warn('[localQueue] No processor registered yet. Job dropped.');
      return;
    }
    const job = {
      data,
      updateProgress: async (p: unknown) => {
        console.log('[localQueue] Progress:', p);
      },
    };
    try {
      await processor(job);
      emitter.emit('completed', data);
    } catch (err) {
      console.error('[localQueue] Job failed:', err);
      emitter.emit('failed', data, err);
    }
  });
}

export const localQueueEmitter = emitter;
