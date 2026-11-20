import cors from 'cors';
import express from 'express';
import helmet from 'helmet';
import { checkDatabaseHealth } from './config/db';
import { env, isSupabaseAuthConfigured, isSupabaseStorageConfigured } from './config/env';
import { errorHandler, notFoundHandler } from './middleware/error.middleware';
import { UPLOADS_DIR } from './middleware/upload.middleware';
import { authRouter } from './modules/auth/auth.routes';
import { cartRouter, ordersRouter } from './modules/orders/orders.routes';
import { reservationsRouter, resourcesRouter } from './modules/resources/resources.routes';

export function createApp(): express.Express {
  const app = express();

  // Security headers (allow cross-origin images for uploaded resource photos)
  app.use(
    helmet({
      crossOriginResourcePolicy: { policy: 'cross-origin' },
    })
  );

  // CORS configuration (supports comma-separated origins, '*' or Vercel deployments)
  const allowedOrigins = env.corsOrigin
    .split(',')
    .map((o) => o.trim().replace(/\/+$/, ''))
    .filter(Boolean);

  app.use(
    cors({
      origin: (origin, callback) => {
        // Same-origin / server-to-server / health checks have no Origin header
        if (!origin) return callback(null, true);

        const normalized = origin.replace(/\/+$/, '');
        if (
          allowedOrigins.includes('*') ||
          allowedOrigins.includes(normalized) ||
          (process.env.VERCEL && normalized.endsWith('.vercel.app'))
        ) {
          return callback(null, true);
        }

        return callback(null, false);
      },
      credentials: true,
    })
  );

  // Body parsing
  app.use(express.json({ limit: '1mb' }));
  app.use(express.urlencoded({ extended: true }));

  // Serve uploaded media assets
  app.use('/uploads', express.static(UPLOADS_DIR));

  // Health & Database connectivity check
  app.get('/api/v1/health', async (_req, res) => {
    const dbStatus = await checkDatabaseHealth();
    res.status(dbStatus.connected ? 200 : 503).json({
      success: dbStatus.connected,
      service: 'campusconnect-backend',
      version: '1.0.0',
      academicCycle: 'Academic Year 26-27',
      auth: {
        supabaseConfigured: isSupabaseAuthConfigured(),
        allowedEmailDomains: env.allowedEmailDomains,
        demoAuthEnabled: env.enableDemoAuth,
      },
      storage: {
        supabaseConfigured: isSupabaseStorageConfigured(),
        bucket: env.supabaseStorageBucket,
      },
      database: dbStatus,
    });
  });

  // =========================================================================
  // Active API Modules
  // =========================================================================
  app.use('/api/v1/auth', authRouter);
  app.use('/api/v1/resources', resourcesRouter);
  app.use('/api/v1/reservations', reservationsRouter);
  app.use('/api/v1/cart', cartRouter);
  app.use('/api/v1/orders', ordersRouter);

  // Future Phase Modules (drop-in mounts using the same anchor DB tables):
  // app.use('/api/v1/accommodations', accommodationsRouter);
  // app.use('/api/v1/mentors', mentorshipRouter);
  // app.use('/api/v1/departures', departuresRouter);

  // 404 & Global Error Handler
  app.use(notFoundHandler);
  app.use(errorHandler);

  return app;
}
