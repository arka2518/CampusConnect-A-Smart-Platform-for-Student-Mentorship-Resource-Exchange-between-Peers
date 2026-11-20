import fs from 'fs';
import path from 'path';
import { closePool, query } from '../config/db';

const MIGRATIONS_DIR = path.resolve(__dirname, 'migrations');

async function runMigrations(): Promise<void> {
  console.log('[Migrate] Connecting to PostgreSQL / Supabase...');

  await query(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      filename VARCHAR(255) PRIMARY KEY,
      applied_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
    );
  `);

  const files = fs
    .readdirSync(MIGRATIONS_DIR)
    .filter((f) => f.endsWith('.sql'))
    .sort();

  for (const file of files) {
    const existing = await query<{ filename: string }>(
      'SELECT filename FROM schema_migrations WHERE filename = $1',
      [file]
    );

    if (existing.rows.length > 0) {
      console.log(`[Migrate] Skipping already applied migration: ${file}`);
      continue;
    }

    const sqlPath = path.join(MIGRATIONS_DIR, file);
    const sql = fs.readFileSync(sqlPath, 'utf-8');

    console.log(`[Migrate] Applying ${file}...`);
    await query(sql);
    await query('INSERT INTO schema_migrations (filename) VALUES ($1)', [file]);
    console.log(`[Migrate] Applied ${file} successfully.`);
  }

  console.log('[Migrate] All migrations are up to date.');
}

runMigrations()
  .catch((err) => {
    console.error('[Migrate] Migration failed:', err);
    process.exitCode = 1;
  })
  .finally(async () => {
    await closePool();
  });
