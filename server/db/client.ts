import { drizzle, type NodePgDatabase } from 'drizzle-orm/node-postgres';
import { Pool } from 'pg';
import * as schema from './schema.ts';

let pool: Pool | null = null;
let dbInstance: NodePgDatabase<typeof schema> | null = null;
let configuredUrl: string | null = null;
let schemaReadyPromise: Promise<void> | null = null;

function isLocalDatabaseUrl(url: string): boolean {
  return (
    url.includes('localhost') ||
    url.includes('127.0.0.1') ||
    url.includes('sslmode=disable')
  );
}

export function getDatabaseUrl(): string | null {
  const raw = process.env.DATABASE_URL?.trim();
  return raw && raw.length > 0 ? raw : null;
}

export function getDbPool(): Pool | null {
  const url = getDatabaseUrl();
  if (!url) return null;

  if (!pool || configuredUrl !== url) {
    if (pool) {
      void pool.end().catch(() => {});
    }
    pool = new Pool({
      connectionString: url,
      ssl: isLocalDatabaseUrl(url) ? false : { rejectUnauthorized: false },
      max: 5,
      idleTimeoutMillis: 30_000,
      connectionTimeoutMillis: 8_000,
    });
    pool.on('error', (err) => {
      console.error('PostgreSQL pool error:', err.message);
    });
    dbInstance = drizzle(pool, { schema });
    configuredUrl = url;
    schemaReadyPromise = null;
  }

  return pool;
}

export function getDb(): NodePgDatabase<typeof schema> | null {
  getDbPool();
  return dbInstance;
}

const SCHEMA_STATEMENTS = [
  `CREATE TABLE IF NOT EXISTS users (
    id TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    name TEXT NOT NULL,
    subtitle TEXT NOT NULL DEFAULT '',
    branch TEXT NOT NULL DEFAULT 'CSE',
    password_hash TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS users_role_email_idx ON users (role, email)`,
  `CREATE TABLE IF NOT EXISTS student_profiles (
    user_id TEXT PRIMARY KEY REFERENCES users(id) ON DELETE CASCADE,
    usn TEXT NOT NULL DEFAULT '',
    branch TEXT NOT NULL DEFAULT 'CSE',
    semester INTEGER NOT NULL DEFAULT 6,
    target_skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    target_domain TEXT NOT NULL DEFAULT 'Machine Learning & AI',
    target_company TEXT NOT NULL DEFAULT '',
    resume_url TEXT NOT NULL DEFAULT '',
    resume_text TEXT NOT NULL DEFAULT '',
    github_url TEXT NOT NULL DEFAULT '',
    linkedin_url TEXT NOT NULL DEFAULT '',
    leetcode_url TEXT NOT NULL DEFAULT '',
    avatar_url TEXT NOT NULL DEFAULT '',
    looking_for_internship BOOLEAN NOT NULL DEFAULT TRUE,
    looking_for_project_help BOOLEAN NOT NULL DEFAULT TRUE,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS avatar_url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS resume_text TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS github_url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS linkedin_url TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE student_profiles ADD COLUMN IF NOT EXISTS leetcode_url TEXT NOT NULL DEFAULT ''`,
  `CREATE TABLE IF NOT EXISTS alumni_profiles (
    id TEXT PRIMARY KEY,
    owner_uid TEXT NOT NULL,
    name TEXT NOT NULL,
    graduation_year INTEGER NOT NULL DEFAULT 2022,
    branch TEXT NOT NULL DEFAULT 'CSE',
    role TEXT NOT NULL,
    company TEXT NOT NULL,
    domain TEXT NOT NULL,
    skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    location TEXT NOT NULL DEFAULT 'Bengaluru',
    bio TEXT NOT NULL DEFAULT '',
    avatar_url TEXT,
    reg_number TEXT NOT NULL,
    source TEXT NOT NULL DEFAULT 'self-registered',
    verification_status TEXT NOT NULL DEFAULT 'pending',
    open_to_internship_referrals BOOLEAN NOT NULL DEFAULT TRUE,
    open_to_project_mentoring BOOLEAN NOT NULL DEFAULT TRUE,
    shared_project_guides_count INTEGER NOT NULL DEFAULT 0,
    submitted_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS alumni_status_idx ON alumni_profiles (verification_status)`,
  `CREATE TABLE IF NOT EXISTS alumni_private_contacts (
    alumni_id TEXT PRIMARY KEY REFERENCES alumni_profiles(id) ON DELETE CASCADE,
    email TEXT NOT NULL DEFAULT '',
    phone TEXT NOT NULL DEFAULT '',
    linkedin_url TEXT NOT NULL DEFAULT '',
    updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS mentorship_requests (
    id TEXT PRIMARY KEY,
    student_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    student_name TEXT NOT NULL,
    student_branch TEXT NOT NULL DEFAULT 'CSE',
    student_semester INTEGER NOT NULL DEFAULT 6,
    student_usn TEXT NOT NULL DEFAULT '',
    alumni_id TEXT NOT NULL REFERENCES alumni_profiles(id) ON DELETE CASCADE,
    alumni_owner_uid TEXT NOT NULL,
    alumni_name TEXT NOT NULL,
    alumni_role TEXT NOT NULL,
    alumni_company TEXT NOT NULL,
    alumni_branch TEXT NOT NULL DEFAULT 'CSE',
    alumni_graduation_year INTEGER NOT NULL DEFAULT 2022,
    alumni_avatar_url TEXT,
    goal TEXT NOT NULL,
    message TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'pending',
    student_last_read_at TIMESTAMPTZ,
    alumni_last_read_at TIMESTAMPTZ,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    responded_at TIMESTAMPTZ
  )`,
  `CREATE INDEX IF NOT EXISTS mentorship_student_idx ON mentorship_requests (student_id)`,
  `CREATE INDEX IF NOT EXISTS mentorship_alumni_idx ON mentorship_requests (alumni_owner_uid)`,
  `CREATE TABLE IF NOT EXISTS mentorship_messages (
    id TEXT PRIMARY KEY,
    mentorship_id TEXT NOT NULL REFERENCES mentorship_requests(id) ON DELETE CASCADE,
    sender_id TEXT NOT NULL,
    sender_name TEXT NOT NULL,
    sender_role TEXT NOT NULL,
    text TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS mentorship_messages_thread_idx ON mentorship_messages (mentorship_id, created_at)`,
  `CREATE TABLE IF NOT EXISTS mentorship_sessions (
    id TEXT PRIMARY KEY,
    mentorship_id TEXT NOT NULL UNIQUE REFERENCES mentorship_requests(id) ON DELETE CASCADE,
    slot_label TEXT NOT NULL,
    topic TEXT NOT NULL,
    status TEXT NOT NULL DEFAULT 'requested',
    meeting_link TEXT NOT NULL,
    booked_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS opportunities (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    company TEXT NOT NULL,
    type TEXT NOT NULL,
    domain TEXT NOT NULL,
    location TEXT NOT NULL DEFAULT 'Bengaluru',
    stipend_or_ctc TEXT NOT NULL DEFAULT 'Competitive',
    skills TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[],
    description TEXT NOT NULL,
    apply_url TEXT NOT NULL DEFAULT '',
    posted_by_id TEXT NOT NULL,
    posted_by_alumni_id TEXT NOT NULL,
    posted_by_name TEXT NOT NULL,
    posted_by_role TEXT NOT NULL,
    is_remote BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS knowledge_guides (
    id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    domain TEXT NOT NULL,
    summary TEXT NOT NULL,
    content TEXT NOT NULL,
    read_time_minutes INTEGER NOT NULL DEFAULT 5,
    author_id TEXT NOT NULL,
    author_alumni_id TEXT NOT NULL,
    author_name TEXT NOT NULL,
    author_role TEXT NOT NULL,
    author_company TEXT NOT NULL,
    author_batch TEXT NOT NULL,
    upvotes INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS guide_upvotes (
    guide_id TEXT NOT NULL REFERENCES knowledge_guides(id) ON DELETE CASCADE,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (guide_id, user_id)
  )`,
  `CREATE TABLE IF NOT EXISTS user_bookmarks (
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    target_id TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (user_id, kind, target_id)
  )`,
  `CREATE TABLE IF NOT EXISTS notifications (
    id TEXT PRIMARY KEY,
    user_id TEXT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    kind TEXT NOT NULL,
    title TEXT NOT NULL,
    body TEXT NOT NULL,
    email_sent BOOLEAN NOT NULL DEFAULT FALSE,
    is_read BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE INDEX IF NOT EXISTS notifications_user_idx ON notifications (user_id, created_at DESC)`,
  `CREATE TABLE IF NOT EXISTS password_resets (
    key TEXT PRIMARY KEY,
    role TEXT NOT NULL,
    email TEXT NOT NULL,
    code_hash TEXT NOT NULL,
    expires_at TIMESTAMPTZ NOT NULL,
    attempts INTEGER NOT NULL DEFAULT 0
  )`,
  `CREATE TABLE IF NOT EXISTS senior_intake_forms (
    form_id TEXT PRIMARY KEY,
    title TEXT NOT NULL,
    responder_uri TEXT NOT NULL,
    edit_uri TEXT NOT NULL,
    created_by_uid TEXT NOT NULL,
    created_by_email TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
  )`,
  `CREATE TABLE IF NOT EXISTS imported_form_responses (
    form_id TEXT NOT NULL REFERENCES senior_intake_forms(form_id) ON DELETE CASCADE,
    response_id TEXT NOT NULL,
    alumni_id TEXT NOT NULL,
    imported_by_uid TEXT NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    PRIMARY KEY (form_id, response_id)
  )`,
];

export async function ensureDatabaseSchema(): Promise<void> {
  const activePool = getDbPool();
  if (!activePool) {
    throw new Error(
      'Supabase PostgreSQL is not configured yet. Add DATABASE_URL in AI Studio Settings → Secrets.',
    );
  }

  if (!schemaReadyPromise) {
    schemaReadyPromise = (async () => {
      const client = await activePool.connect();
      try {
        for (const sql of SCHEMA_STATEMENTS) {
          await client.query(sql);
        }
      } finally {
        client.release();
      }
    })().catch((err) => {
      schemaReadyPromise = null;
      throw err;
    });
  }

  await schemaReadyPromise;
}

export async function checkDatabaseHealth(): Promise<{
  databaseConfigured: boolean;
  databaseConnected: boolean;
  databaseError?: string;
}> {
  if (!getDatabaseUrl()) {
    return {
      databaseConfigured: false,
      databaseConnected: false,
      databaseError:
        'DATABASE_URL secret is not set yet. Add your Supabase PostgreSQL pooler URI in Settings → Secrets.',
    };
  }

  try {
    await ensureDatabaseSchema();
    const activePool = getDbPool();
    if (activePool) {
      await activePool.query('SELECT 1');
    }
    return {
      databaseConfigured: true,
      databaseConnected: true,
    };
  } catch (err) {
    return {
      databaseConfigured: true,
      databaseConnected: false,
      databaseError:
        err instanceof Error ? err.message : 'Unable to reach Supabase PostgreSQL.',
    };
  }
}
