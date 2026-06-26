import { supabase } from './supabase';

/**
 * Upload a PNG buffer to a Supabase Storage bucket.
 * Returns the public URL of the uploaded file.
 */
export async function uploadImage(params: {
  bucket: 'snapshots' | 'baselines' | 'diffs';
  path: string;           // e.g. "project-id/run-id/page.png"
  buffer: Buffer;
  contentType?: string;
}): Promise<string> {
  const { bucket, path, buffer, contentType = 'image/png' } = params;

  const { error } = await supabase.storage
    .from(bucket)
    .upload(path, buffer, {
      contentType,
      upsert: true,
    });

  if (error) {
    throw new Error(`[storage] Upload failed (${bucket}/${path}): ${error.message}`);
  }

  const { data } = supabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Download a file from Supabase Storage and return its buffer.
 */
export async function downloadImage(url: string): Promise<Buffer> {
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[storage] Failed to fetch image: ${url} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
