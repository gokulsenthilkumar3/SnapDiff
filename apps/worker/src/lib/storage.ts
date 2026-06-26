import { isLocalMode } from '../lib/localMode';
import { localUploadImage, localDownloadImage } from '../lib/localStorage';
import { supabase as cloudSupabase } from './supabase';

/**
 * Upload a PNG buffer to storage.
 * In local mode: saves to uploads/ directory and returns localhost URL.
 * In cloud mode: uploads to Supabase Storage.
 */
export async function uploadImage(params: {
  bucket: 'snapshots' | 'baselines' | 'diffs';
  path: string;
  buffer: Buffer;
  contentType?: string;
}): Promise<string> {
  if (isLocalMode()) {
    return localUploadImage(params);
  }

  const { bucket, path, buffer, contentType = 'image/png' } = params;
  const { error } = await cloudSupabase.storage.from(bucket).upload(path, buffer, {
    contentType,
    upsert: true,
  });
  if (error) {
    throw new Error(`[storage] Upload failed (${bucket}/${path}): ${error.message}`);
  }
  const { data } = cloudSupabase.storage.from(bucket).getPublicUrl(path);
  return data.publicUrl;
}

/**
 * Download a file from any URL and return its buffer.
 */
export async function downloadImage(url: string): Promise<Buffer> {
  if (isLocalMode()) {
    return localDownloadImage(url);
  }
  const response = await fetch(url);
  if (!response.ok) {
    throw new Error(`[storage] Failed to fetch image: ${url} (${response.status})`);
  }
  const arrayBuffer = await response.arrayBuffer();
  return Buffer.from(arrayBuffer);
}
