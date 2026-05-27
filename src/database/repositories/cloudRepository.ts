import { isSupabaseConfigured, supabase } from '@/services/api/supabase';
import { getColumnNames, syncableTableNames } from '@/database/schema';
import type { CloudRepository, DatabaseTableName, SyncableRecord } from '@/types/database.types';

type AnyRecord = SyncableRecord & Record<string, unknown>;

const timestampColumns = new Set([
  'created_at',
  'updated_at',
  'deleted_at',
  'synced_at',
  'recorded_at',
  'subscription_expires_at',
  'last_sold_at',
  'last_restocked_at',
  'moved_at',
  'record_date',
  'received_at',
  'reviewed_at',
  'calculated_at',
  'disbursed_at',
  'repayment_start_date',
  'submitted_at',
  'decision_at',
  'due_date',
  'paid_date',
  'period_start',
  'period_end',
  'generated_at',
  'shared_at',
]);

const localOnlyColumns = new Set([
  'local_id',
  'cloud_id',
  'last_synced_at',
  'sync_action',
  'sync_attempts',
  'sync_error',
  'created_offline',
  'updated_offline',
  'device_id',
]);

const companyIdCache = new Map<string, string | null>();

function toCloudTimestamp(value: unknown) {
  if (value == null || value === '') return null;
  if (typeof value === 'number') return new Date(value).toISOString();
  if (typeof value === 'string' && /^\d+$/.test(value)) return new Date(Number(value)).toISOString();
  return value;
}

function fromCloudTimestamp(value: unknown) {
  if (value == null || typeof value === 'number') return value;
  if (typeof value === 'string') {
    const parsed = Date.parse(value);
    return Number.isNaN(parsed) ? value : parsed;
  }
  return value;
}

function isUuid(value: unknown) {
  return typeof value === 'string' && /^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(value);
}

async function getPrimaryCompanyId(userId: string) {
  if (companyIdCache.has(userId)) return companyIdCache.get(userId) ?? null;
  if (!isSupabaseConfigured) return null;

  const { data, error } = await supabase
    .from('company_memberships')
    .select('company_id')
    .eq('user_id', userId)
    .eq('status', 'active')
    .limit(1)
    .maybeSingle();

  if (error) {
    companyIdCache.set(userId, null);
    return null;
  }

  const companyId = typeof data?.company_id === 'string' ? data.company_id : null;
  companyIdCache.set(userId, companyId);
  return companyId;
}

function filterKnownColumns(tableName: DatabaseTableName, record: Record<string, unknown>) {
  const allowed = new Set(getColumnNames(tableName));
  const result: Record<string, unknown> = {};

  for (const [key, value] of Object.entries(record)) {
    if (!allowed.has(key)) continue;
    if (localOnlyColumns.has(key)) continue;
    result[key] = timestampColumns.has(key) ? toCloudTimestamp(value) : value;
  }

  return result;
}

async function toCloudRecord(tableName: DatabaseTableName, record: AnyRecord) {
  const payload = filterKnownColumns(tableName, record);
  const companyId = typeof payload.company_id === 'string' ? payload.company_id : await getPrimaryCompanyId(record.user_id);

  if (tableName === 'transactions' && !isUuid(payload.id)) {
    delete payload.id;
  }

  if (companyId) {
    payload.company_id = companyId;
  }

  if (tableName === 'stock_items') {
    payload.quantity = payload.current_quantity ?? 0;
    payload.price_type = 'fixed';
    payload.unit_price = Number(payload.selling_price_per_unit ?? payload.purchase_price_per_unit) || 1;
    payload.metadata = {
      barcode: payload.barcode ?? null,
      notes: payload.notes ?? null,
      synced_from: 'sqlite',
    };
  }

  if (tableName === 'loan_requests') {
    payload.amount = payload.amount ?? payload.amount_requested ?? 0;
    payload.mosika_score_at_application = payload.mosika_score_at_application ?? payload.mosika_score_at_apply ?? null;
  }

  if (tableName === 'transactions') {
    payload.occurred_at = payload.occurred_at ?? payload.recorded_at ?? payload.created_at;
    payload.transaction_date =
      payload.transaction_date ??
      (typeof payload.recorded_at === 'string' ? payload.recorded_at.slice(0, 10) : new Date().toISOString().slice(0, 10));
    payload.metadata = {
      category: payload.category ?? null,
      subcategory: payload.subcategory ?? null,
      synced_from: 'sqlite',
    };
  }

  return payload;
}

function fromCloudRecord<T extends AnyRecord>(tableName: DatabaseTableName, record: Record<string, unknown>) {
  const local: Record<string, unknown> = {};
  const columns = new Set(getColumnNames(tableName));

  for (const [key, value] of Object.entries(record)) {
    if (!columns.has(key)) continue;
    local[key] = timestampColumns.has(key) ? fromCloudTimestamp(value) : value;
  }

  if (tableName === 'stock_items') {
    local.current_quantity = local.current_quantity ?? record.quantity ?? 0;
    local.selling_price_per_unit = local.selling_price_per_unit ?? record.unit_price ?? 0;
  }

  if (tableName === 'ai_conversations') {
    local.session_id = local.session_id ?? record.session_id ?? record.id;
    local.role = local.role ?? record.role ?? 'assistant';
    local.content = local.content ?? record.content ?? '';
  }

  local.is_synced = true;
  local.sync_status = 'synced';
  local.synced_at = Date.now();
  local.last_synced_at = Date.now();
  local.sync_action = null;
  local.sync_attempts = 0;
  local.sync_error = null;
  local.created_offline = false;
  local.updated_offline = false;
  local.cloud_id = typeof record.id === 'string' ? record.id : local.cloud_id;
  local.version = Number(local.version ?? 1);

  return local as T;
}

export function createCloudRepository<T extends AnyRecord>(tableName: DatabaseTableName): CloudRepository<T> {
  return {
    async upsertRecord(record) {
      if (!isSupabaseConfigured) throw new Error('Supabase is not configured');

      const payload = await toCloudRecord(tableName, record);
      const { data, error } = await supabase
        .from(tableName)
        .upsert(payload, { onConflict: 'id' })
        .select('*')
        .single();

      if (error) throw error;
      return fromCloudRecord<T>(tableName, data as Record<string, unknown>);
    },

    async getRecords(userId, since) {
      if (!isSupabaseConfigured) return [];

      let query = supabase.from(tableName).select('*').eq('user_id', userId).order('updated_at', { ascending: true });

      if (since) {
        query = query.gt('updated_at', new Date(since).toISOString());
      }

      const { data, error } = await query;
      if (error) throw error;
      return (data ?? []).map((row) => fromCloudRecord<T>(tableName, row as Record<string, unknown>));
    },
  };
}

export const cloudRepositories = Object.fromEntries(
  syncableTableNames.map((tableName) => [tableName, createCloudRepository(tableName)]),
) as Record<DatabaseTableName, CloudRepository<AnyRecord>>;
