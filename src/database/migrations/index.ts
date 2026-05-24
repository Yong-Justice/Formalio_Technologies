import type { SQLiteDatabase } from 'expo-sqlite';
import { databaseSchema, tableDefinitions } from '@/database/schema';

export type Migration = {
  version: number;
  name: string;
  sql: string;
};

function columnSql(columnName: string, columnType: string, requiredColumns: Set<string>) {
  if (columnName === 'id') return 'id TEXT PRIMARY KEY NOT NULL';
  if (columnName === 'is_synced') return "is_synced INTEGER NOT NULL DEFAULT 0";
  if (columnName === 'sync_status') return "sync_status TEXT NOT NULL DEFAULT 'pending'";
  if (columnName === 'version') return 'version INTEGER NOT NULL DEFAULT 1';
  if (columnName === 'created_at' || columnName === 'updated_at') return `${columnName} INTEGER NOT NULL`;
  const required = requiredColumns.has(columnName) ? ' NOT NULL' : '';
  return `${columnName} ${columnType}${required}`;
}

function tableSql() {
  return tableDefinitions
    .flatMap((definition) => {
      const requiredColumns = new Set(definition.requiredColumns ?? []);
      const columns = Object.entries(definition.columns)
        .map(([columnName, columnType]) => columnSql(columnName, columnType, requiredColumns))
        .join(',\n  ');
      const indexes = Array.from(new Set(definition.indexedColumns ?? [])).map(
        (columnName) =>
          `CREATE INDEX IF NOT EXISTS idx_${definition.name}_${columnName} ON ${definition.name}(${columnName});`,
      );

      return [
        `CREATE TABLE IF NOT EXISTS ${definition.name} (\n  ${columns}\n);`,
        ...indexes,
      ];
    })
    .join('\n\n');
}

export const migrations: Migration[] = [
  {
    version: 1,
    name: 'create_offline_first_domain_tables',
    sql: `
PRAGMA foreign_keys = ON;

${tableSql()}

CREATE TABLE IF NOT EXISTS sync_outbox (
  id TEXT PRIMARY KEY NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  operation TEXT NOT NULL CHECK (operation IN ('upsert', 'delete')),
  payload TEXT NOT NULL,
  attempts INTEGER NOT NULL DEFAULT 0,
  last_error TEXT,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_outbox_user_id ON sync_outbox(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_table_name ON sync_outbox(table_name);
CREATE INDEX IF NOT EXISTS idx_sync_outbox_created_at ON sync_outbox(created_at);

CREATE TABLE IF NOT EXISTS sync_state (
  key TEXT PRIMARY KEY NOT NULL,
  value TEXT NOT NULL,
  updated_at INTEGER NOT NULL
);

CREATE TABLE IF NOT EXISTS sync_conflicts (
  id TEXT PRIMARY KEY NOT NULL,
  table_name TEXT NOT NULL,
  record_id TEXT NOT NULL,
  user_id TEXT NOT NULL,
  local_payload TEXT NOT NULL,
  cloud_payload TEXT NOT NULL,
  reason TEXT NOT NULL,
  resolved_at INTEGER,
  created_at INTEGER NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_sync_conflicts_user_id ON sync_conflicts(user_id);
CREATE INDEX IF NOT EXISTS idx_sync_conflicts_record ON sync_conflicts(table_name, record_id);
`,
  },
];

export async function runMigrations(db: SQLiteDatabase) {
  await db.execAsync(`
CREATE TABLE IF NOT EXISTS schema_migrations (
  version INTEGER PRIMARY KEY NOT NULL,
  name TEXT NOT NULL,
  applied_at INTEGER NOT NULL
);
`);

  for (const migration of migrations) {
    const applied = await db.getFirstAsync<{ version: number }>(
      'SELECT version FROM schema_migrations WHERE version = ?',
      migration.version,
    );

    if (applied) continue;

    await db.withTransactionAsync(async () => {
      await db.execAsync(migration.sql);
      await db.runAsync(
        'INSERT INTO schema_migrations (version, name, applied_at) VALUES (?, ?, ?)',
        migration.version,
        migration.name,
        Date.now(),
      );
    });
  }
}

export const currentSchemaVersion = databaseSchema.version;
