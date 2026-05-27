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
  if (columnName === 'sync_attempts') return 'sync_attempts INTEGER NOT NULL DEFAULT 0';
  if (columnName === 'created_offline' || columnName === 'updated_offline') return `${columnName} INTEGER NOT NULL DEFAULT 0`;
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
  {
    version: 2,
    name: 'add_fiches_table',
    sql: `
CREATE TABLE IF NOT EXISTS fiches (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  company_id TEXT,
  is_synced INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  synced_at INTEGER,
  deleted_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  last_modified_device_id TEXT,
  fiche_type TEXT NOT NULL,
  period_type TEXT NOT NULL,
  date_debut TEXT NOT NULL,
  date_fin TEXT NOT NULL,
  stock_items_json TEXT,
  service_items_json TEXT,
  expenses_json TEXT,
  revenus_theoriques REAL,
  total_depenses REAL,
  caisse_attendue REAL,
  caisse_reelle REAL,
  ecart REAL,
  ecart_percentage REAL,
  ecart_level TEXT,
  ecart_justification TEXT,
  ecart_category TEXT,
  status TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_fiches_user_id ON fiches(user_id);
CREATE INDEX IF NOT EXISTS idx_fiches_company_id ON fiches(company_id);
CREATE INDEX IF NOT EXISTS idx_fiches_updated_at ON fiches(updated_at);
CREATE INDEX IF NOT EXISTS idx_fiches_sync_status ON fiches(sync_status);
CREATE INDEX IF NOT EXISTS idx_fiches_deleted_at ON fiches(deleted_at);
CREATE INDEX IF NOT EXISTS idx_fiches_date_debut ON fiches(date_debut);
CREATE INDEX IF NOT EXISTS idx_fiches_date_fin ON fiches(date_fin);
CREATE INDEX IF NOT EXISTS idx_fiches_status ON fiches(status);
CREATE INDEX IF NOT EXISTS idx_fiches_fiche_type ON fiches(fiche_type);
`,
  },
  {
    version: 3,
    name: 'add_versements_table',
    sql: `
CREATE TABLE IF NOT EXISTS versements (
  id TEXT PRIMARY KEY NOT NULL,
  user_id TEXT NOT NULL,
  created_at INTEGER NOT NULL,
  updated_at INTEGER NOT NULL,
  company_id TEXT,
  is_synced INTEGER NOT NULL DEFAULT 0,
  sync_status TEXT NOT NULL DEFAULT 'pending',
  synced_at INTEGER,
  deleted_at INTEGER,
  version INTEGER NOT NULL DEFAULT 1,
  last_modified_device_id TEXT,
  montant REAL NOT NULL,
  destination TEXT NOT NULL,
  destination_label TEXT NOT NULL,
  description TEXT,
  versement_date TEXT NOT NULL,
  versement_time TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_versements_user_id ON versements(user_id);
CREATE INDEX IF NOT EXISTS idx_versements_company_id ON versements(company_id);
CREATE INDEX IF NOT EXISTS idx_versements_updated_at ON versements(updated_at);
CREATE INDEX IF NOT EXISTS idx_versements_sync_status ON versements(sync_status);
CREATE INDEX IF NOT EXISTS idx_versements_deleted_at ON versements(deleted_at);
CREATE INDEX IF NOT EXISTS idx_versements_destination ON versements(destination);
CREATE INDEX IF NOT EXISTS idx_versements_versement_date ON versements(versement_date);
`,
  },
  {
    version: 4,
    name: 'add_complete_sync_metadata',
    sql: '',
  },
];

const syncMetadataColumns = {
  local_id: 'TEXT',
  cloud_id: 'TEXT',
  sync_action: 'TEXT',
  sync_attempts: 'INTEGER NOT NULL DEFAULT 0',
  sync_error: 'TEXT',
  last_synced_at: 'INTEGER',
  created_offline: 'INTEGER NOT NULL DEFAULT 0',
  updated_offline: 'INTEGER NOT NULL DEFAULT 0',
  device_id: 'TEXT',
} as const;

async function addMissingSyncMetadataColumns(db: SQLiteDatabase) {
  for (const definition of tableDefinitions) {
    const existing = await db.getAllAsync<{ name: string }>(`PRAGMA table_info(${definition.name})`);
    const existingNames = new Set(existing.map((column) => column.name));

    for (const [columnName, columnSqlType] of Object.entries(syncMetadataColumns)) {
      if (existingNames.has(columnName)) continue;
      await db.execAsync(`ALTER TABLE ${definition.name} ADD COLUMN ${columnName} ${columnSqlType};`);
    }
  }
}

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
      if (migration.name === 'add_complete_sync_metadata') {
        await addMissingSyncMetadataColumns(db);
      } else {
        await db.execAsync(migration.sql);
      }
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
