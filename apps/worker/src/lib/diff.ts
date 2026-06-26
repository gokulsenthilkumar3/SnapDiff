import { PNG } from 'pngjs';
import pixelmatch from 'pixelmatch';

export interface DiffResult {
  diffPng: Buffer;
  diffPercent: number;
  totalPixels: number;
  diffPixels: number;
}

/**
 * Compare two PNG buffers pixel-by-pixel and return a diff image + metrics.
 *
 * @param baselinePng - Buffer of the baseline (approved) PNG
 * @param snapshotPng - Buffer of the new snapshot PNG
 * @param threshold   - pixelmatch threshold (0–1, default 0.1)
 */
export async function generateDiff(
  baselinePng: Buffer,
  snapshotPng: Buffer,
  threshold = 0.1,
): Promise<DiffResult> {
  const baseline = PNG.sync.read(baselinePng);
  const snapshot = PNG.sync.read(snapshotPng);

  // Resize to the larger of the two dimensions to handle layout shifts
  const width = Math.max(baseline.width, snapshot.width);
  const height = Math.max(baseline.height, snapshot.height);

  const baselineData = padImage(baseline, width, height);
  const snapshotData = padImage(snapshot, width, height);

  const diff = new PNG({ width, height });
  const diffPixels = pixelmatch(
    baselineData,
    snapshotData,
    diff.data,
    width,
    height,
    { threshold, includeAA: true },
  );

  const totalPixels = width * height;
  const diffPercent = (diffPixels / totalPixels) * 100;
  const diffPng = PNG.sync.write(diff);

  return { diffPng, diffPercent, totalPixels, diffPixels };
}

/**
 * Pad an image's pixel data to a target width × height (fills with transparent pixels).
 */
function padImage(png: PNG, width: number, height: number): Buffer {
  if (png.width === width && png.height === height) {
    return png.data;
  }

  const padded = Buffer.alloc(width * height * 4, 0); // transparent
  for (let y = 0; y < Math.min(png.height, height); y++) {
    const srcOffset = y * png.width * 4;
    const dstOffset = y * width * 4;
    png.data.copy(padded, dstOffset, srcOffset, srcOffset + Math.min(png.width, width) * 4);
  }
  return padded;
}
