import { Pool, PoolClient, QueryResult, QueryResultRow } from 'pg';
import { assertDatabaseUrl, env } from './env';

let poolInstance: Pool | null = null;

export function getPool(): Pool {
  if (!poolInstance) {
    const connectionString = assertDatabaseUrl();
    poolInstance = new Pool({
      connectionString,
      ssl: env.useDatabaseSsl ? { rejectUnauthorized: false } : undefined,
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 25_000,
      keepAlive: true,
    });

    poolInstance.on('error', (err) => {
      console.error('[DB] Unexpected PostgreSQL client error:', err.message);
    });
  }
  return poolInstance;
}

export async function query<T extends QueryResultRow = QueryResultRow>(
  text: string,
  params?: unknown[]
): Promise<QueryResult<T>> {
  return getPool().query<T>(text, params);
}

/**
 * Executes a callback inside an ACID PostgreSQL transaction.
 * Automatically commits on success and rolls back on any thrown error.
 */
export async function withTransaction<T>(fn: (client: PoolClient) => Promise<T>): Promise<T> {
  const client = await getPool().connect();
  try {
    await client.query('BEGIN');
    const result = await fn(client);
    await client.query('COMMIT');
    return result;
  } catch (err) {
    try {
      await client.query('ROLLBACK');
    } catch (rollbackErr) {
      console.error('[DB] Rollback failed:', rollbackErr);
    }
    throw err;
  } finally {
    client.release();
  }
}

export async function checkDatabaseHealth(): Promise<{ connected: boolean; latencyMs?: number; error?: string }> {
  const start = Date.now();
  try {
    await query('SELECT 1');
    return { connected: true, latencyMs: Date.now() - start };
  } catch (err) {
    return {
      connected: false,
      error: err instanceof Error ? err.message : 'Unknown database error',
    };
  }
}

export async function closePool(): Promise<void> {
  if (poolInstance) {
    await poolInstance.end();
    poolInstance = null;
  }
}
