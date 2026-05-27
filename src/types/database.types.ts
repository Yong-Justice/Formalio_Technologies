export type SyncStatus = 'synced' | 'pending' | 'syncing' | 'failed' | 'conflict' | 'deleted_pending';
export type SyncAction = 'create' | 'update' | 'delete';

export type DatabaseTableName =
  | 'business_profiles'
  | 'transactions'
  | 'stock_items'
  | 'stock_movements'
  | 'treasury_records'
  | 'momo_sms'
  | 'contact_classifications'
  | 'mosika_scores'
  | 'loan_requests'
  | 'loan_repayments'
  | 'tax_obligations'
  | 'ai_conversations'
  | 'generated_reports'
  | 'fiches'
  | 'versements';

export interface SyncableRecord {
  id: string;
  local_id?: string | null;
  cloud_id?: string | null;
  user_id: string;
  company_id?: string | null;
  created_at: number;
  updated_at?: number;
  deleted_at?: number | null;
  synced_at?: number | null;
  last_synced_at?: number | null;
  is_synced: boolean;
  sync_status: SyncStatus;
  sync_action?: SyncAction | null;
  sync_attempts?: number | null;
  sync_error?: string | null;
  created_offline?: boolean;
  updated_offline?: boolean;
  version: number;
  device_id?: string | null;
  last_modified_device_id?: string | null;
}

export interface QueryOptions {
  includeDeleted?: boolean;
  limit?: number;
  since?: number;
  orderBy?: string;
  direction?: 'asc' | 'desc';
}

export interface LocalRepository<T extends SyncableRecord> {
  createRecord(input: Partial<T> & { user_id: string }): Promise<T>;
  getRecords(userId: string, options?: QueryOptions): Promise<T[]>;
  updateRecord(id: string, userId: string, patch: Partial<T>): Promise<T>;
  deleteRecord(id: string, userId: string): Promise<T>;
  syncRecords(userId: string): Promise<SyncSummary>;
  getPendingSyncItems(userId: string): Promise<T[]>;
}

export interface CloudRepository<T extends SyncableRecord> {
  upsertRecord(record: T): Promise<T>;
  getRecords(userId: string, since?: number): Promise<T[]>;
}

export interface SyncSummary {
  pushed: number;
  pulled: number;
  failed: number;
  conflicts: number;
}

export interface SyncOutboxItem {
  id: string;
  table_name: DatabaseTableName;
  record_id: string;
  user_id: string;
  operation: 'upsert' | 'delete';
  payload: string;
  attempts: number;
  last_error?: string | null;
  created_at: number;
  updated_at: number;
}
