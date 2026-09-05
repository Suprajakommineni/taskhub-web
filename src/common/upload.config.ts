import { diskStorage } from 'multer';
import { extname } from 'path';
import { BadRequestException } from '@nestjs/common';
import { resolveUploadsDir } from './uploads-dir';

// Shared between UsersController (self photo upload) and TeamsController
// (setting a new member's photo at add-time) so both endpoints validate
// and store images the same way. Left untyped (no explicit MulterOptions
// annotation) so it structurally matches whatever FileInterceptor expects.
export const imageUploadOptions = {
  storage: diskStorage({
    destination: resolveUploadsDir(),
    filename: (_req, file, cb) => {
      const unique = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
      cb(null, `${unique}${extname(file.originalname)}`);
    },
  }),
  fileFilter: (_req, file, cb) => {
    if (!/^image\/(jpe?g|png|gif|webp)$/.test(file.mimetype)) {
      cb(new BadRequestException('Only JPG, PNG, GIF, or WEBP images are allowed'), false);
      return;
    }
    cb(null, true);
  },
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
};
