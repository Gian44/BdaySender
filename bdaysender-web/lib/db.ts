import { Pool, type QueryResult, type QueryResultRow } from "pg";

const globalForDb = globalThis as unknown as {
  pool?: Pool;
  poolConnectionString?: string;
  schemaReady?: Promise<void>;
};

function getConnectionString(): string | undefined {
  return process.env.DATABASE_URL;
}

function createPool(connectionString: string): Pool {
  const requiresSsl = /sslmode=(require|verify-full)|supabase\.co/i.test(connectionString);
  return new Pool({
    connectionString,
    ssl:
      requiresSsl || process.env.NODE_ENV === "production"
        ? { rejectUnauthorized: false }
        : false,
  });
}

function getPool(): Pool | null {
  const connectionString = getConnectionString();
  if (!connectionString) {
    return null;
  }

  if (!globalForDb.pool || globalForDb.poolConnectionString !== connectionString) {
    if (globalForDb.pool) {
      void globalForDb.pool.end().catch(() => undefined);
    }
    globalForDb.pool = createPool(connectionString);
    globalForDb.poolConnectionString = connectionString;
    globalForDb.schemaReady = undefined;
  }

  return globalForDb.pool;
}

const schemaSql = `
CREATE TABLE IF NOT EXISTS people (
  id BIGSERIAL PRIMARY KEY,
  name TEXT NOT NULL,
  nickname TEXT NOT NULL DEFAULT '',
  email TEXT NOT NULL,
  birthdate DATE NOT NULL,
  custom_template TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS nickname TEXT NOT NULL DEFAULT '';

ALTER TABLE people
  ADD COLUMN IF NOT EXISTS custom_template TEXT;

CREATE TABLE IF NOT EXISTS message_template (
  id INTEGER PRIMARY KEY CHECK (id = 1),
  body TEXT NOT NULL,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE TABLE IF NOT EXISTS send_logs (
  id BIGSERIAL PRIMARY KEY,
  person_id BIGINT NOT NULL REFERENCES people(id) ON DELETE CASCADE,
  sent_local_date DATE NOT NULL,
  sent_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  status TEXT NOT NULL CHECK (status IN ('success', 'failed')),
  error TEXT
);

CREATE UNIQUE INDEX IF NOT EXISTS send_logs_person_day_unique
  ON send_logs(person_id, sent_local_date)
  WHERE status = 'success';
`;

export async function ensureSchema(pool: Pool): Promise<void> {
  if (!globalForDb.schemaReady) {
    globalForDb.schemaReady = pool.query(schemaSql).then(() => undefined);
  }
  return globalForDb.schemaReady;
}

export async function query<T extends QueryResultRow>(
  text: string,
  params: unknown[] = [],
): Promise<QueryResult<T>> {
  const connectionString = getConnectionString();
  if (!connectionString) {
    throw new Error("DATABASE_URL is not configured.");
  }

  const pool = getPool();
  if (!pool) {
    throw new Error("DATABASE_URL is not configured.");
  }

  await ensureSchema(pool);
  return pool.query<T>(text, params);
}
