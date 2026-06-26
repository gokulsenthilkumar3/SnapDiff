import IORedis from 'ioredis';
import type { ConnectionOptions } from 'bullmq';

const redisUrl = process.env.REDIS_URL ?? 'redis://localhost:6379';

// Use a plain URL-based connection options object for BullMQ.
// This avoids the duplicate-ioredis-version type mismatch.
export const redisConnection: ConnectionOptions = {
  url: redisUrl,
  maxRetriesPerRequest: null,
} as unknown as ConnectionOptions;

// Standalone IORedis client for direct use outside BullMQ
export const redis = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

redis.on('connect', () => console.log('[redis] Connected'));
redis.on('error', (err) => console.error('[redis] Error:', err));
