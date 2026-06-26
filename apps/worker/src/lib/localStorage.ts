/**
 * Local storage adapter for demo mode.
 * Saves screenshot/diff PNG files to the `uploads/` directory in the worker
 * and returns localhost URLs served by Express static middleware.
 */
import fs from 'fs';
import path from 'path';

const UPLOADS_DIR = path.join(process.cwd(), 'uploads');

function ensureDir(dir: string) {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
}

const WORKER_PORT = parseInt(process.env.WORKER_PORT ?? '3001', 10);
const BASE_URL = `http://localhost:${WORKER_PORT}`;

/**
 * Save a PNG buffer to uploads/{bucket}/{path} and return a localhost URL.
 */
export async function localUploadImage(params: {
  bucket: string;
  path: string;
  buffer: Buffer;
}): Promise<string> {
  const { bucket, path: filePath, buffer } = params;
  const dir = path.join(UPLOADS_DIR, bucket, path.dirname(filePath));
  ensureDir(dir);
  const fullPath = path.join(UPLOADS_DIR, bucket, filePath);
  fs.writeFileSync(fullPath, buffer);
  return `${BASE_URL}/uploads/${bucket}/${filePath}`;
}

/**
 * Download an image from a URL (works with both localhost and remote URLs).
 */
export async function localDownloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[localStorage] Failed to fetch image: ${url} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}

/**
 * Returns the absolute path to the uploads directory for Express static serving.
 */
export function getUploadsDir(): string {
  ensureDir(UPLOADS_DIR);
  return UPLOADS_DIR;
}
