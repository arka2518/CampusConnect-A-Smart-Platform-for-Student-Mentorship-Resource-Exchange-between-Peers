import fs from 'fs';
import path from 'path';
import multer from 'multer';
import { AppError } from './error.middleware';

export const UPLOADS_DIR = path.resolve(__dirname, '../../uploads');

if (!fs.existsSync(UPLOADS_DIR)) {
  fs.mkdirSync(UPLOADS_DIR, { recursive: true });
}

const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/jpg',
  'image/png',
  'image/webp',
]);

/**
 * Uses memoryStorage so uploaded image buffers can be streamed straight to
 * Supabase Storage (with automatic local disk fallback in storage.service.ts).
 */
export const uploadResourceImage = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB max
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
      cb(null, true);
    } else {
      cb(new AppError(400, 'INVALID_FILE_TYPE', 'Only JPEG, PNG, and WebP images are supported.'));
    }
  },
});
