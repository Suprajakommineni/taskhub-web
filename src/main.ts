import 'dotenv/config';
import { NestFactory } from '@nestjs/core';
import { AppModule } from './app.module';
import { ValidationPipe } from '@nestjs/common';
import { NestExpressApplication } from '@nestjs/platform-express';
import { existsSync, mkdirSync } from 'fs';
import { resolveUploadsDir } from './common/uploads-dir';

async function bootstrap() {
  // See common/uploads-dir.ts — on most hosting platforms local disk storage
  // does not persist across redeploys, UPLOADS_DIR is the escape hatch for a
  // mounted persistent volume if your platform provides one.
  const uploadsDir = resolveUploadsDir();
  if (!existsSync(uploadsDir)) mkdirSync(uploadsDir, { recursive: true });

  const app = await NestFactory.create<NestExpressApplication>(AppModule);

  // CORS_ORIGIN supports a single URL or a comma-separated list, e.g.
  // "https://taskhub.vercel.app,https://staging-taskhub.vercel.app"
  const corsOrigin = process.env.CORS_ORIGIN
    ? process.env.CORS_ORIGIN.split(',').map((o) => o.trim())
    : 'http://localhost:5173';
  app.enableCors({ origin: corsOrigin });

  app.useGlobalPipes(new ValidationPipe());
  app.useStaticAssets(uploadsDir, { prefix: '/uploads' });
  await app.listen(process.env.PORT ?? 3000);
}
bootstrap();
