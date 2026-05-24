import { getDatabase, getDeviceId } from '@/database';
import { getBooleanColumns, getColumnNames, getTableDefinition, syncableTableNames } from '@/database/schema';
import type { SQLiteBindValue } from 'expo-sqlite';
import type {
  DatabaseTableName,
  LocalRepository,
  QueryOptions,
  SyncOutboxItem,
  SyncableRecord,
} from '@/types/database.types';
import { createUuid } from '@/utils/uuid';

type LocalRow = SyncableRecord & Record<string, unknown>;
type SyncTableRunner = (tableName: DatabaseTableName, userId: string) => Promise<import('@/types/database.types').SyncSummary>;

let syncTableRunner: SyncTableRunner | null = null;

export function registerSyncTableRunner(runner: SyncTableRunner) {
  syncTableRunner = runner;
}

function placeholders(count: number) {
  return Array.from({ length: count }, () => '?').join(', ');
}

function now() {
  return Date.now();
}

function normalizeValue(value: unknown, columnName: string, tableName: DatabaseTableName) {
  if (value === undefined) return null;
  if (typeof value === 'boolean') return value ? 1 : 0;

  const definition = getTableDefinition(tableName);
  if (definition.jsonColumns?.includes(columnName) && value != null && typeof value !== 'string') {
    return JSON.stringify(value);
  }

  return value;
}

function toBindValue(value: unknown): SQLiteBindValue {
  if (value == null) return null;
  if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean') return value;
  if (value instanceof Uint8Array) return value;
  return JSON.stringify(value);
}

function bindValues(values: unknown[]) {
  return values.map(toBindValue);
}

function serializeRecord(tableName: DatabaseTableName, record: Record<string, unknown>) {
  const columns = getColumnNames(tableName);
  return Object.fromEntries(
    columns
      .filter((columnName) => Object.prototype.hasOwnProperty.call(record, columnName))
      .map((columnName) => [columnName, normalizeValue(record[columnName], columnName, tableName)]),
  );
}

function coerceRecord<T extends LocalRow>(tableName: DatabaseTableName, row: Record<string, unknown>) {
  const booleanColumns = getBooleanColumns(tableName);
  const definition = getTableDefinition(tableName);
  const next: Record<string, unknown> = { ...row };

  for (const columnName of booleanColumns) {
    if (Object.prototype.hasOwnProperty.call(next, columnName)) {
      next[columnName] = Boolean(next[columnName]);
    }
  }

  for (const columnName of definition.jsonColumns ?? []) {
    const value = next[columnName];
    if (typeof value === 'string' && value.trim()) {
      try {
        next[columnName] = JSON.parse(value);
      } catch {
        next[columnName] = value;
      }
    }
  }

  return next as T;
}

async function enqueueSync(tableName: DatabaseTableName, record: LocalRow, operation: 'upsert' | 'delete') {
  const db = await getDatabase();
  const timestamp = now();
  const payload = JSON.stringify(record);

  await db.runAsync(
    `INSERT OR REPLACE INTO sync_outbox
      (id, table_name, record_id, user_id, operation, payload, attempts, last_error, created_at, updated_at)
     VALUES (?, ?, ?, ?, ?, ?, COALESCE((SELECT attempts FROM sync_outbox WHERE table_name = ? AND record_id = ?), 0), NULL, ?, ?)`,
    `${tableName}:${record.id}`,
    tableName,
    record.id,
    record.user_id,
    operation,
    payload,
    tableName,
    record.id,
    timestamp,
    timestamp,
  );
}

export async function getOutboxItems(userId: string, tableName?: DatabaseTableName) {
  const db = await getDatabase();
  const where = tableName ? 'WHERE user_id = ? AND table_name = ?' : 'WHERE user_id = ?';
  const params = tableName ? [userId, tableName] : [userId];
  return db.getAllAsync<SyncOutboxItem>(
    `SELECT * FROM sync_outbox ${where} ORDER BY created_at ASC`,
    ...params,
  );
}

export async function markOutboxItemSynced(item: SyncOutboxItem) {
  const db = await getDatabase();
  await db.runAsync('DELETE FROM sync_outbox WHERE id = ?', item.id);
}

export async function removeOutboxRecord(tableName: DatabaseTableName, recordId: string, userId: string) {
  const db = await getDatabase();
  await db.runAsync(
    'DELETE FROM sync_outbox WHERE table_name = ? AND record_id = ? AND user_id = ?',
    tableName,
    recordId,
    userId,
  );
}

export async function markOutboxItemFailed(item: SyncOutboxItem, error: unknown) {
  const db = await getDatabase();
  const message = error instanceof Error ? error.message : String(error);
  await db.runAsync(
    'UPDATE sync_outbox SET attempts = attempts + 1, last_error = ?, updated_at = ? WHERE id = ?',
    message,
    now(),
    item.id,
  );
}

export async function recordSyncConflict(params: {
  tableName: DatabaseTableName;
  recordId: string;
  userId: string;
  localPayload: unknown;
  cloudPayload: unknown;
  reason: string;
}) {
  const db = await getDatabase();
  const timestamp = now();
  await db.runAsync(
    `INSERT OR REPLACE INTO sync_conflicts
      (id, table_name, record_id, user_id, local_payload, cloud_payload, reason, resolved_at, created_at)
     VALUES (?, ?, ?, ?, ?, ?, ?, NULL, ?)`,
    `${params.tableName}:${params.recordId}`,
    params.tableName,
    params.recordId,
    params.userId,
    JSON.stringify(params.localPayload),
    JSON.stringify(params.cloudPayload),
    params.reason,
    timestamp,
  );
}

export async function getSyncState(key: string) {
  const db = await getDatabase();
  const row = await db.getFirstAsync<{ value: string }>('SELECT value FROM sync_state WHERE key = ?', key);
  return row?.value ?? null;
}

export async function setSyncState(key: string, value: string) {
  const db = await getDatabase();
  await db.runAsync(
    'INSERT OR REPLACE INTO sync_state (key, value, updated_at) VALUES (?, ?, ?)',
    key,
    value,
    now(),
  );
}

export async function upsertCloudRecordLocally<T extends LocalRow>(
  tableName: DatabaseTableName,
  input: Record<string, unknown>,
  status: 'synced' | 'conflict' = 'synced',
) {
  const db = await getDatabase();
  const record = {
    ...input,
    is_synced: status === 'synced',
    sync_status: status,
    synced_at: status === 'synced' ? now() : input.synced_at,
  };
  const serialized = serializeRecord(tableName, record);
  const columns = Object.keys(serialized);
  const values = bindValues(columns.map((columnName) => serialized[columnName]));
  const assignments = columns
    .filter((columnName) => columnName !== 'id')
    .map((columnName) => `${columnName} = excluded.${columnName}`)
    .join(', ');

  await db.runAsync(
    `INSERT INTO ${tableName} (${columns.join(', ')}) VALUES (${placeholders(columns.length)})
     ON CONFLICT(id) DO UPDATE SET ${assignments}`,
    ...values,
  );

  const row = await db.getFirstAsync<Record<string, unknown>>(`SELECT * FROM ${tableName} WHERE id = ?`, String(input.id));
  if (!row) throw new Error(`Failed to read local ${tableName} record after cloud upsert`);
  return coerceRecord<T>(tableName, row);
}

export async function markLocalRecordSynced(tableName: DatabaseTableName, recordId: string, userId: string) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${tableName}
     SET is_synced = 1, sync_status = 'synced', synced_at = ?, updated_at = COALESCE(updated_at, ?)
     WHERE id = ? AND user_id = ?`,
    now(),
    now(),
    recordId,
    userId,
  );
}

export async function markLocalRecordFailed(tableName: DatabaseTableName, recordId: string, userId: string) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${tableName} SET is_synced = 0, sync_status = 'failed' WHERE id = ? AND user_id = ?`,
    recordId,
    userId,
  );
}

export async function markLocalRecordConflict(tableName: DatabaseTableName, recordId: string, userId: string) {
  const db = await getDatabase();
  await db.runAsync(
    `UPDATE ${tableName} SET is_synced = 0, sync_status = 'conflict' WHERE id = ? AND user_id = ?`,
    recordId,
    userId,
  );
}

export function createLocalRepository<T extends LocalRow>(tableName: DatabaseTableName): LocalRepository<T> {
  const definition = getTableDefinition(tableName);
  const columns = new Set(getColumnNames(tableName));

  async function findById(id: string, userId: string) {
    const db = await getDatabase();
    const row = await db.getFirstAsync<Record<string, unknown>>(
      `SELECT * FROM ${tableName} WHERE id = ? AND user_id = ?`,
      id,
      userId,
    );
    return row ? coerceRecord<T>(tableName, row) : null;
  }

  return {
    async createRecord(input) {
      const timestamp = now();
      const deviceId = await getDeviceId();
      const record = {
        id: input.id ?? createUuid(),
        ...input,
        created_at: input.created_at ?? timestamp,
        updated_at: input.updated_at ?? timestamp,
        deleted_at: input.deleted_at ?? null,
        synced_at: input.synced_at ?? null,
        is_synced: false,
        sync_status: 'pending',
        version: input.version ?? 1,
        last_modified_device_id: input.last_modified_device_id ?? deviceId,
      } as LocalRow;
      const serialized = serializeRecord(tableName, record);
      const columnNames = Object.keys(serialized);
      const values = bindValues(columnNames.map((columnName) => serialized[columnName]));
      const db = await getDatabase();

      await db.runAsync(
        `INSERT OR REPLACE INTO ${tableName} (${columnNames.join(', ')}) VALUES (${placeholders(columnNames.length)})`,
        ...values,
      );
      await enqueueSync(tableName, record, record.deleted_at ? 'delete' : 'upsert');

      const saved = await findById(record.id, record.user_id);
      if (!saved) throw new Error(`Failed to save ${tableName} record`);
      return saved;
    },

    async getRecords(userId: string, options: QueryOptions = {}) {
      const db = await getDatabase();
      const orderColumn = options.orderBy && columns.has(options.orderBy) ? options.orderBy : 'updated_at';
      const direction = options.direction === 'asc' ? 'ASC' : 'DESC';
      const where = ['user_id = ?'];
      const params: unknown[] = [userId];

      if (!options.includeDeleted) where.push('deleted_at IS NULL');
      if (options.since) {
        where.push('updated_at > ?');
        params.push(options.since);
      }

      const limit = options.limit ? ` LIMIT ${Math.max(1, Math.floor(options.limit))}` : '';
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM ${tableName} WHERE ${where.join(' AND ')} ORDER BY ${orderColumn} ${direction}${limit}`,
        ...bindValues(params),
      );
      return rows.map((row) => coerceRecord<T>(tableName, row));
    },

    async updateRecord(id, userId, patch) {
      const existing = await findById(id, userId);
      if (!existing) throw new Error(`${tableName} record not found`);

      const timestamp = now();
      const deviceId = await getDeviceId();
      const next = {
        ...patch,
        updated_at: timestamp,
        is_synced: false,
        sync_status: 'pending',
        version: Number(existing.version ?? 0) + 1,
        last_modified_device_id: deviceId,
      } as Record<string, unknown>;
      const serialized = serializeRecord(tableName, next);
      const updateColumns = Object.keys(serialized).filter((columnName) => columnName !== 'id' && columnName !== 'user_id');
      const values = bindValues(updateColumns.map((columnName) => serialized[columnName]));
      const db = await getDatabase();

      await db.runAsync(
        `UPDATE ${tableName} SET ${updateColumns.map((columnName) => `${columnName} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
        ...values,
        id,
        userId,
      );

      const updated = await findById(id, userId);
      if (!updated) throw new Error(`Failed to update ${tableName} record`);
      await enqueueSync(tableName, updated, updated.deleted_at ? 'delete' : 'upsert');
      return updated;
    },

    async deleteRecord(id, userId) {
      const existing = await findById(id, userId);
      if (!existing) throw new Error(`${tableName} record not found`);

      const timestamp = now();
      const deviceId = await getDeviceId();
      const patch: Record<string, unknown> = {
        deleted_at: timestamp,
        updated_at: timestamp,
        is_synced: false,
        sync_status: 'pending',
        version: Number(existing.version ?? 0) + 1,
        last_modified_device_id: deviceId,
      };

      if (Object.prototype.hasOwnProperty.call(definition.columns, 'is_deleted')) {
        patch.is_deleted = true;
      }

      const serialized = serializeRecord(tableName, patch);
      const updateColumns = Object.keys(serialized);
      const values = bindValues(updateColumns.map((columnName) => serialized[columnName]));
      const db = await getDatabase();

      await db.runAsync(
        `UPDATE ${tableName} SET ${updateColumns.map((columnName) => `${columnName} = ?`).join(', ')} WHERE id = ? AND user_id = ?`,
        ...values,
        id,
        userId,
      );

      const deleted = await findById(id, userId);
      if (!deleted) throw new Error(`Failed to delete ${tableName} record`);
      await enqueueSync(tableName, deleted, 'delete');
      return deleted;
    },

    async syncRecords(userId) {
      if (!syncTableRunner) return { pushed: 0, pulled: 0, failed: 0, conflicts: 0 };
      return syncTableRunner(tableName, userId);
    },

    async getPendingSyncItems(userId) {
      const db = await getDatabase();
      const rows = await db.getAllAsync<Record<string, unknown>>(
        `SELECT * FROM ${tableName}
         WHERE user_id = ? AND sync_status IN ('pending', 'failed')
         ORDER BY updated_at ASC`,
        userId,
      );
      return rows.map((row) => coerceRecord<T>(tableName, row));
    },
  };
}

export const repositories = Object.fromEntries(
  syncableTableNames.map((tableName) => [tableName, createLocalRepository(tableName)]),
) as Record<DatabaseTableName, LocalRepository<LocalRow>>;
