import crypto from 'crypto';
import fs from 'fs/promises';
import path from 'path';
import { env, isSupabaseStorageConfigured } from '../config/env';
import { AppError } from '../middleware/error.middleware';
import { UPLOADS_DIR } from '../middleware/upload.middleware';

export type StorageFolder = 'resources' | 'apartments' | 'avatars';

const MIME_TO_EXT: Record<string, string> = {
  'image/jpeg': '.jpg',
  'image/jpg': '.jpg',
  'image/png': '.png',
  'image/webp': '.webp',
};

function buildUniqueFilename(file: Express.Multer.File, folder: StorageFolder): string {
  const extFromName = path.extname(file.originalname).toLowerCase();
  const ext = MIME_TO_EXT[file.mimetype] || (extFromName || '.jpg');
  const suffix = `${Date.now()}-${crypto.randomBytes(6).toString('hex')}`;
  return `${folder}-${suffix}${ext}`;
}

/**
 * Reusable media upload pipeline shared across CampusConnect modules.
 * - Primary: Uploads directly to Supabase Storage public bucket and returns a permanent CDN URL.
 * - Fallback: If SUPABASE_SERVICE_ROLE_KEY is not configured yet, saves locally under backend/uploads/.
 */
export async function uploadImage(
  file: Express.Multer.File,
  folder: StorageFolder = 'resources'
): Promise<string> {
  const filename = buildUniqueFilename(file, folder);

  if (isSupabaseStorageConfigured()) {
    const bucket = env.supabaseStorageBucket;
    const objectPath = `${folder}/${filename}`;
    const uploadEndpoint = `${env.supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`;

    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
        apikey: env.supabaseServiceRoleKey,
        'Content-Type': file.mimetype,
        'x-upsert': 'false',
      },
      body: new Uint8Array(file.buffer),
    });

    if (!res.ok) {
      const errorText = await res.text().catch(() => '');
      console.error('[Storage] Supabase upload failed:', res.status, errorText);
      throw new AppError(
        502,
        'STORAGE_UPLOAD_FAILED',
        `Cloud image upload failed (${res.status}). Make sure a public bucket named "${bucket}" exists in Supabase Storage.`
      );
    }

    return `${env.supabaseUrl}/storage/v1/object/public/${bucket}/${objectPath}`;
  }

  // Local disk fallback when SUPABASE_SERVICE_ROLE_KEY is not set
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
  await fs.writeFile(path.join(UPLOADS_DIR, filename), file.buffer);
  return `/uploads/${filename}`;
}

/**
 * Best-effort cleanup of previously uploaded images when a listing photo is replaced or deleted.
 * Never deletes static seeded assets under `/images/...`.
 */
export async function deleteImage(imageUrl: string | null | undefined): Promise<void> {
  if (!imageUrl || imageUrl.startsWith('/images/')) return;

  try {
    // 1. Delete from Supabase Storage if URL belongs to our configured bucket
    if (isSupabaseStorageConfigured()) {
      const bucket = env.supabaseStorageBucket;
      const publicPrefix = `${env.supabaseUrl}/storage/v1/object/public/${bucket}/`;
      if (imageUrl.startsWith(publicPrefix)) {
        const objectPath = imageUrl.slice(publicPrefix.length);
        await fetch(`${env.supabaseUrl}/storage/v1/object/${bucket}/${objectPath}`, {
          method: 'DELETE',
          headers: {
            Authorization: `Bearer ${env.supabaseServiceRoleKey}`,
            apikey: env.supabaseServiceRoleKey,
          },
        });
        return;
      }
    }

    // 2. Delete from local backend/uploads/ if it was saved locally
    if (imageUrl.startsWith('/uploads/')) {
      const safeName = path.basename(imageUrl);
      const localPath = path.join(UPLOADS_DIR, safeName);
      await fs.unlink(localPath).catch(() => undefined);
    }
  } catch (err) {
    console.warn('[Storage] Non-fatal error cleaning up old image:', err);
  }
}
