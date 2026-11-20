import { createApp } from './app';
import { checkDatabaseHealth, closePool } from './config/db';
import { env } from './config/env';

async function bootstrap(): Promise<void> {
  const app = createApp();

  const server = app.listen(env.port, async () => {
    console.log('========================================================');
    console.log(`  CampusConnect Backend API running on port ${env.port}`);
    console.log(`  Health check: http://localhost:${env.port}/api/v1/health`);
    console.log(`  Resources API: http://localhost:${env.port}/api/v1/resources`);
    console.log('========================================================');

    const health = await checkDatabaseHealth();
    if (health.connected) {
      console.log(`[DB] Connected to Supabase PostgreSQL (${health.latencyMs}ms)`);
    } else {
      console.warn(`[DB] Not connected yet: ${health.error}`);
      console.warn('[DB] Make sure backend/.env has your Supabase Session Pooler DATABASE_URL.');
    }
  });

  const shutdown = async (signal: string) => {
    console.log(`\n[Server] Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      await closePool();
      process.exit(0);
    });
  };

  process.on('SIGINT', () => void shutdown('SIGINT'));
  process.on('SIGTERM', () => void shutdown('SIGTERM'));
}

void bootstrap();
