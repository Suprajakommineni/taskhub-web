import { join, isAbsolute } from 'path';

// UPLOADS_DIR lets a deployment point this at a mounted persistent volume.
// Both main.ts (static file serving) and upload.config.ts (where multer
// actually writes files) call this, so they can never point at different
// places even if one of them changes independently later.
export function resolveUploadsDir(): string {
  const configured = process.env.UPLOADS_DIR || './uploads';
  return isAbsolute(configured) ? configured : join(__dirname, '..', '..', configured);
}
