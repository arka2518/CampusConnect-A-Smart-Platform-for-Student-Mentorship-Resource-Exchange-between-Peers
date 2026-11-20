import dotenv from 'dotenv';
import path from 'path';

dotenv.config({ path: path.resolve(__dirname, '../../.env') });

const databaseUrl = process.env.DATABASE_URL || '';
const rawDomains = (process.env.ALLOWED_EMAIL_DOMAINS || '*').trim();
const allowedEmailDomains =
  rawDomains === '*' || rawDomains === ''
    ? ['*']
    : rawDomains
        .split(',')
        .map((d) => d.trim().toLowerCase().replace(/^@/, ''))
        .filter(Boolean);

const nodeEnv = process.env.NODE_ENV || 'development';
const enableDemoAuth =
  process.env.ENABLE_DEMO_AUTH !== undefined
    ? process.env.ENABLE_DEMO_AUTH.toLowerCase() === 'true'
    : nodeEnv !== 'production';

export const env = {
  port: Number(process.env.PORT || 4000),
  nodeEnv,
  databaseUrl,
  corsOrigin: process.env.CORS_ORIGIN || 'http://localhost:5173',
  supabaseUrl: (process.env.SUPABASE_URL || '').replace(/\/+$/, ''),
  supabaseAnonKey: process.env.SUPABASE_ANON_KEY || '',
  supabaseServiceRoleKey: process.env.SUPABASE_SERVICE_ROLE_KEY || '',
  supabaseStorageBucket: process.env.SUPABASE_STORAGE_BUCKET || 'resource-images',
  allowedEmailDomains,
  enableDemoAuth,
  useDatabaseSsl:
    process.env.DATABASE_SSL === 'true' ||
    databaseUrl.includes('supabase.com') ||
    databaseUrl.includes('supabase.co') ||
    databaseUrl.includes('sslmode=require'),
};

export function isSupabaseAuthConfigured(): boolean {
  return Boolean(
    env.supabaseUrl &&
      env.supabaseAnonKey &&
      !env.supabaseUrl.includes('YOUR_PROJECT_REF') &&
      !env.supabaseAnonKey.includes('YOUR_SUPABASE')
  );
}

export function isSupabaseStorageConfigured(): boolean {
  return Boolean(
    env.supabaseUrl &&
      env.supabaseServiceRoleKey &&
      !env.supabaseUrl.includes('YOUR_PROJECT_REF') &&
      !env.supabaseServiceRoleKey.includes('YOUR_SUPABASE')
  );
}

export function assertDatabaseUrl(): string {
  if (!env.databaseUrl || env.databaseUrl.includes('YOUR_PROJECT_REF')) {
    throw new Error(
      'DATABASE_URL is not configured. Copy backend/.env.example to backend/.env and paste your Supabase Session Pooler URI.'
    );
  }
  return env.databaseUrl;
}
