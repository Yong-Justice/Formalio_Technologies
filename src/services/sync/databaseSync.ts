import { getDatabase } from '@/database';
import { cloudRepositories } from '@/database/repositories/cloudRepository';
import {
  getOutboxItems,
  getSyncState,
  markLocalRecordConflict,
  markLocalRecordFailed,
  markLocalRecordSynced,
  markOutboxItemFailed,
  markOutboxItemSynced,
  recordSyncConflict,
  registerSyncTableRunner,
  removeOutboxRecord,
  setSyncState,
  upsertCloudRecordLocally,
} from '@/database/repositories';
import { syncableTableNames } from '@/database/schema';
import { isSupabaseConfigured } from '@/services/api/supabase';
import { useNetworkStore } from '@/services/sync/network';
import type { DatabaseTableName, SyncSummary, SyncableRecord } from '@/types/database.types';

type LocalRow = SyncableRecord & Record<string, unknown>;

function emptySummary(): SyncSummary {
  return { pushed: 0, pulled: 0, failed: 0, conflicts: 0 };
}

function mergeSummary(total: SyncSummary, next: SyncSummary) {
  total.pushed += next.pushed;
  total.pulled += next.pulled;
  total.failed += next.failed;
  total.conflicts += next.conflicts;
  return total;
}

function timestamp(value: unknown) {
  return typeof value === 'number' ? value : 0;
}

function stableStringify(value: unknown) {
  if (value == null || typeof value !== 'object') return JSON.stringify(value);
  const object = value as Record<string, unknown>;
  return JSON.stringify(
    Object.keys(object)
      .sort()
      .reduce<Record<string, unknown>>((result, key) => {
        if (key === 'synced_at' || key === 'sync_status' || key === 'is_synced') return result;
        result[key] = object[key];
        return result;
      }, {}),
  );
}

async function getLocalRow(tableName: DatabaseTableName, recordId: string, userId: string) {
  const db = await getDatabase();
  return db.getFirstAsync<LocalRow>(`SELECT * FROM ${tableName} WHERE id = ? AND user_id = ?`, recordId, userId);
}

async function pushPending(tableName: DatabaseTableName, userId: string) {
  let pushed = 0;
  let failed = 0;
  const outboxItems = await getOutboxItems(userId, tableName);
  const cloudRepository = cloudRepositories[tableName];

  for (const item of outboxItems) {
    try {
      const payload = JSON.parse(item.payload) as LocalRow;
      const cloudRecord = await cloudRepository.upsertRecord(payload);
      await upsertCloudRecordLocally(tableName, cloudRecord);
      await markLocalRecordSynced(tableName, payload.id, userId);
      await markOutboxItemSynced(item);
      pushed += 1;
      console.debug(`[sync] Cloud update successful`, { tableName, recordId: payload.id });
    } catch (error) {
      await markOutboxItemFailed(item, error);
      await markLocalRecordFailed(tableName, item.record_id, userId);
      failed += 1;
      console.debug(`[sync] Sync failed`, { tableName, recordId: item.record_id, error });
    }
  }

  return { pushed, failed };
}

async function pullCloud(tableName: DatabaseTableName, userId: string) {
  const cloudRepository = cloudRepositories[tableName];
  const syncKey = `sync:lastPull:${tableName}:${userId}`;
  const lastSync = Number(await getSyncState(syncKey)) || undefined;
  const cloudRows = await cloudRepository.getRecords(userId, lastSync);
  let pulled = 0;
  let conflicts = 0;

  for (const cloudRow of cloudRows) {
    const localRow = await getLocalRow(tableName, cloudRow.id, userId);

    if (!localRow) {
      await upsertCloudRecordLocally(tableName, cloudRow);
      pulled += 1;
      continue;
    }

    const localPending = localRow.sync_status === 'pending' || localRow.sync_status === 'failed';
    const localUpdated = timestamp(localRow.updated_at);
    const cloudUpdated = timestamp(cloudRow.updated_at);
    const differentPayload = stableStringify(localRow) !== stableStringify(cloudRow);

    if (localPending && differentPayload) {
      await recordSyncConflict({
        tableName,
        recordId: cloudRow.id,
        userId,
        localPayload: localRow,
        cloudPayload: cloudRow,
        reason: localUpdated === cloudUpdated ? 'ambiguous_timestamp' : 'concurrent_update',
      });
      conflicts += 1;

      if (cloudUpdated > localUpdated) {
        await upsertCloudRecordLocally(tableName, cloudRow);
        await removeOutboxRecord(tableName, cloudRow.id, userId);
        pulled += 1;
      } else if (cloudUpdated === localUpdated) {
        await markLocalRecordConflict(tableName, cloudRow.id, userId);
      }
      continue;
    }

    if (cloudUpdated >= localUpdated) {
      await upsertCloudRecordLocally(tableName, cloudRow);
      pulled += 1;
    }
  }

  await setSyncState(syncKey, String(Date.now()));
  return { pulled, conflicts };
}

export async function syncTable(tableName: DatabaseTableName, userId: string): Promise<SyncSummary> {
  if (!userId || !isSupabaseConfigured || !useNetworkStore.getState().isOnline) {
    return emptySummary();
  }

  console.debug('[sync] Sync started', { tableName, userId });
  const summary = emptySummary();

  const pushResult = await pushPending(tableName, userId);
  summary.pushed += pushResult.pushed;
  summary.failed += pushResult.failed;

  try {
    const pullResult = await pullCloud(tableName, userId);
    summary.pulled += pullResult.pulled;
    summary.conflicts += pullResult.conflicts;
    console.debug('[sync] Sync completed', { tableName, ...summary });
  } catch (error) {
    summary.failed += 1;
    console.debug('[sync] Sync failed', { tableName, error });
  }

  return summary;
}

export async function syncAllTables(userId?: string | null) {
  if (!userId) return emptySummary();

  const summary = emptySummary();
  for (const tableName of syncableTableNames) {
    mergeSummary(summary, await syncTable(tableName, userId));
  }
  return summary;
}

registerSyncTableRunner(syncTable);
