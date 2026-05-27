import type { DatabaseTableName } from '@/types/database.types';

export type SqlColumnType = 'TEXT' | 'INTEGER' | 'REAL';

export type TableDefinition = {
  name: DatabaseTableName;
  columns: Record<string, SqlColumnType>;
  requiredColumns?: string[];
  booleanColumns?: string[];
  jsonColumns?: string[];
  indexedColumns?: string[];
};

const syncColumns: Record<string, SqlColumnType> = {
  local_id: 'TEXT',
  cloud_id: 'TEXT',
  company_id: 'TEXT',
  is_synced: 'INTEGER',
  sync_status: 'TEXT',
  sync_action: 'TEXT',
  sync_attempts: 'INTEGER',
  sync_error: 'TEXT',
  synced_at: 'INTEGER',
  last_synced_at: 'INTEGER',
  deleted_at: 'INTEGER',
  created_offline: 'INTEGER',
  updated_offline: 'INTEGER',
  version: 'INTEGER',
  device_id: 'TEXT',
  last_modified_device_id: 'TEXT',
};

const commonColumns: Record<string, SqlColumnType> = {
  id: 'TEXT',
  user_id: 'TEXT',
  created_at: 'INTEGER',
  updated_at: 'INTEGER',
  ...syncColumns,
};

const commonRequired = ['id', 'user_id', 'created_at', 'updated_at'];
const commonBoolean = ['is_synced', 'created_offline', 'updated_offline'];
const commonIndexes = ['user_id', 'company_id', 'updated_at', 'sync_status', 'deleted_at'];

function table(
  name: DatabaseTableName,
  columns: Record<string, SqlColumnType>,
  options: {
    requiredColumns?: string[];
    booleanColumns?: string[];
    jsonColumns?: string[];
    indexedColumns?: string[];
  } = {},
): TableDefinition {
  return {
    name,
    columns: { ...commonColumns, ...columns },
    requiredColumns: [...commonRequired, ...(options.requiredColumns ?? [])],
    booleanColumns: [...commonBoolean, ...(options.booleanColumns ?? [])],
    jsonColumns: options.jsonColumns ?? [],
    indexedColumns: [...commonIndexes, ...(options.indexedColumns ?? [])],
  };
}

export const tableDefinitions = [
  table(
    'business_profiles',
    {
      business_name: 'TEXT',
      owner_name: 'TEXT',
      business_type: 'TEXT',
      sector: 'TEXT',
      city: 'TEXT',
      quarter: 'TEXT',
      phone_number: 'TEXT',
      mtn_momo_number: 'TEXT',
      orange_money_number: 'TEXT',
      tax_regime: 'TEXT',
      tax_id: 'TEXT',
      rccm_number: 'TEXT',
      preferred_language: 'TEXT',
      subscription_plan: 'TEXT',
      subscription_expires_at: 'INTEGER',
      onboarding_completed: 'INTEGER',
    },
    { booleanColumns: ['onboarding_completed'], indexedColumns: ['phone_number'] },
  ),
  table(
    'transactions',
    {
      type: 'TEXT',
      amount: 'REAL',
      payment_method: 'TEXT',
      syscohada_code: 'TEXT',
      syscohada_label: 'TEXT',
      category: 'TEXT',
      subcategory: 'TEXT',
      description: 'TEXT',
      voice_input_original: 'TEXT',
      entry_method: 'TEXT',
      stock_item_id: 'TEXT',
      quantity: 'REAL',
      unit_price: 'REAL',
      customer_phone: 'TEXT',
      supplier_name: 'TEXT',
      momo_sms_id: 'TEXT',
      momo_reference: 'TEXT',
      momo_verified: 'INTEGER',
      receipt_image_path: 'TEXT',
      is_pending_payment: 'INTEGER',
      is_deleted: 'INTEGER',
      recorded_at: 'INTEGER',
    },
    {
      requiredColumns: ['type', 'amount', 'recorded_at'],
      booleanColumns: ['momo_verified', 'is_pending_payment', 'is_deleted'],
      indexedColumns: ['recorded_at', 'stock_item_id', 'momo_sms_id'],
    },
  ),
  table(
    'stock_items',
    {
      name: 'TEXT',
      barcode: 'TEXT',
      category: 'TEXT',
      unit: 'TEXT',
      current_quantity: 'REAL',
      minimum_alert_quantity: 'REAL',
      purchase_price_per_unit: 'REAL',
      selling_price_per_unit: 'REAL',
      total_stock_value: 'REAL',
      margin_percentage: 'REAL',
      total_units_sold_all_time: 'REAL',
      total_revenue_generated: 'REAL',
      days_since_last_sale: 'REAL',
      average_daily_sales: 'REAL',
      days_of_stock_remaining: 'REAL',
      is_dead_stock: 'INTEGER',
      supplier_name: 'TEXT',
      supplier_phone: 'TEXT',
      image_path: 'TEXT',
      notes: 'TEXT',
      is_active: 'INTEGER',
      last_sold_at: 'INTEGER',
      last_restocked_at: 'INTEGER',
    },
    {
      requiredColumns: ['name'],
      booleanColumns: ['is_dead_stock', 'is_active'],
      indexedColumns: ['name', 'category', 'is_active'],
    },
  ),
  table(
    'stock_movements',
    {
      stock_item_id: 'TEXT',
      movement_type: 'TEXT',
      quantity_before: 'REAL',
      quantity_changed: 'REAL',
      quantity_after: 'REAL',
      unit_price_at_time: 'REAL',
      transaction_id: 'TEXT',
      notes: 'TEXT',
      moved_at: 'INTEGER',
    },
    { requiredColumns: ['stock_item_id', 'movement_type', 'moved_at'], indexedColumns: ['stock_item_id', 'transaction_id', 'moved_at'] },
  ),
  table(
    'treasury_records',
    {
      record_date: 'INTEGER',
      opening_cash: 'REAL',
      closing_cash: 'REAL',
      mtn_momo_balance: 'REAL',
      orange_money_balance: 'REAL',
      bank_balance: 'REAL',
      total_liquid_assets: 'REAL',
      total_stock_value: 'REAL',
      total_net_worth: 'REAL',
      daily_revenue: 'REAL',
      daily_expenses: 'REAL',
      daily_profit: 'REAL',
      accounts_receivable: 'REAL',
      accounts_payable: 'REAL',
      is_manually_adjusted: 'INTEGER',
      adjustment_notes: 'TEXT',
    },
    { requiredColumns: ['record_date'], booleanColumns: ['is_manually_adjusted'], indexedColumns: ['record_date'] },
  ),
  table(
    'momo_sms',
    {
      sender_id: 'TEXT',
      sender_type: 'TEXT',
      full_body: 'TEXT',
      parsed_amount: 'REAL',
      direction: 'TEXT',
      momo_operator: 'TEXT',
      momo_reference: 'TEXT',
      balance_after: 'REAL',
      counterpart_number: 'TEXT',
      review_status: 'TEXT',
      matched_transaction_id: 'TEXT',
      is_known_personal_contact: 'INTEGER',
      is_known_customer: 'INTEGER',
      is_telecom_service: 'INTEGER',
      received_at: 'INTEGER',
      reviewed_at: 'INTEGER',
    },
    {
      booleanColumns: ['is_known_personal_contact', 'is_known_customer', 'is_telecom_service'],
      indexedColumns: ['momo_reference', 'review_status', 'matched_transaction_id', 'received_at'],
    },
  ),
  table(
    'contact_classifications',
    {
      phone_number: 'TEXT',
      contact_name: 'TEXT',
      classification: 'TEXT',
      times_classified: 'INTEGER',
      last_transaction_type: 'TEXT',
      auto_classify: 'INTEGER',
      notes: 'TEXT',
    },
    { booleanColumns: ['auto_classify'], indexedColumns: ['phone_number', 'classification'] },
  ),
  table(
    'mosika_scores',
    {
      total_score: 'REAL',
      previous_score: 'REAL',
      score_change: 'REAL',
      pillar_regularite: 'REAL',
      pillar_revenus: 'REAL',
      pillar_gestion: 'REAL',
      pillar_stock: 'REAL',
      pillar_anciennete: 'REAL',
      pillar_paiement: 'REAL',
      sub_score_frequence: 'REAL',
      sub_score_continuite: 'REAL',
      sub_score_revenu_absolu: 'REAL',
      sub_score_tendance: 'REAL',
      sub_score_stabilite: 'REAL',
      sub_score_ratio_depenses: 'REAL',
      sub_score_tresorerie: 'REAL',
      sub_score_rotation_stock: 'REAL',
      sub_score_stock_mort: 'REAL',
      sub_score_momo: 'REAL',
      sub_score_remboursement: 'REAL',
      hard_penalties_applied: 'REAL',
      loan_eligible: 'INTEGER',
      max_loan_amount: 'REAL',
      min_loan_amount: 'REAL',
      improvement_tips: 'TEXT',
      calculated_at: 'INTEGER',
    },
    {
      requiredColumns: ['total_score', 'calculated_at'],
      booleanColumns: ['loan_eligible'],
      jsonColumns: ['improvement_tips'],
      indexedColumns: ['calculated_at'],
    },
  ),
  table(
    'loan_requests',
    {
      amount_requested: 'REAL',
      amount_approved: 'REAL',
      duration_months: 'INTEGER',
      purpose: 'TEXT',
      purpose_detail: 'TEXT',
      mfi_id: 'TEXT',
      mfi_name: 'TEXT',
      mfi_contact_name: 'TEXT',
      interest_rate_monthly: 'REAL',
      monthly_repayment: 'REAL',
      total_repayment: 'REAL',
      mosika_score_at_apply: 'REAL',
      status: 'TEXT',
      rejection_reason: 'TEXT',
      disbursement_method: 'TEXT',
      disbursed_at: 'INTEGER',
      repayment_start_date: 'INTEGER',
      submitted_at: 'INTEGER',
      decision_at: 'INTEGER',
    },
    { indexedColumns: ['status', 'submitted_at', 'mfi_id'] },
  ),
  table(
    'loan_repayments',
    {
      loan_request_id: 'TEXT',
      installment_number: 'INTEGER',
      amount_due: 'REAL',
      amount_paid: 'REAL',
      due_date: 'INTEGER',
      paid_date: 'INTEGER',
      status: 'TEXT',
      payment_method: 'TEXT',
      notes: 'TEXT',
    },
    { requiredColumns: ['loan_request_id'], indexedColumns: ['loan_request_id', 'due_date', 'status'] },
  ),
  table(
    'tax_obligations',
    {
      tax_type: 'TEXT',
      period: 'TEXT',
      amount_calculated: 'REAL',
      amount_paid: 'REAL',
      due_date: 'INTEGER',
      paid_date: 'INTEGER',
      status: 'TEXT',
      dgi_form_generated: 'INTEGER',
      form_file_path: 'TEXT',
      notes: 'TEXT',
    },
    { booleanColumns: ['dgi_form_generated'], indexedColumns: ['tax_type', 'period', 'due_date', 'status'] },
  ),
  table(
    'ai_conversations',
    {
      session_id: 'TEXT',
      role: 'TEXT',
      content: 'TEXT',
      context_type: 'TEXT',
      tokens_used: 'INTEGER',
    },
    { requiredColumns: ['session_id', 'role', 'content'], indexedColumns: ['session_id', 'context_type'] },
  ),
  table(
    'generated_reports',
    {
      report_type: 'TEXT',
      period_start: 'INTEGER',
      period_end: 'INTEGER',
      file_path: 'TEXT',
      file_size_bytes: 'INTEGER',
      generated_at: 'INTEGER',
      shared_at: 'INTEGER',
    },
    { requiredColumns: ['report_type', 'generated_at'], indexedColumns: ['report_type', 'generated_at'] },
  ),
  table(
    'fiches',
    {
      fiche_type: 'TEXT',
      period_type: 'TEXT',
      date_debut: 'TEXT',
      date_fin: 'TEXT',
      stock_items_json: 'TEXT',
      service_items_json: 'TEXT',
      expenses_json: 'TEXT',
      revenus_theoriques: 'REAL',
      total_depenses: 'REAL',
      caisse_attendue: 'REAL',
      caisse_reelle: 'REAL',
      ecart: 'REAL',
      ecart_percentage: 'REAL',
      ecart_level: 'TEXT',
      ecart_justification: 'TEXT',
      ecart_category: 'TEXT',
      status: 'TEXT',
    },
    {
      requiredColumns: ['fiche_type', 'period_type', 'date_debut', 'date_fin', 'status'],
      indexedColumns: ['date_debut', 'date_fin', 'status', 'fiche_type'],
    },
  ),
  table(
    'versements',
    {
      montant: 'REAL',
      destination: 'TEXT',
      destination_label: 'TEXT',
      description: 'TEXT',
      versement_date: 'TEXT',
      versement_time: 'TEXT',
    },
    {
      requiredColumns: ['montant', 'destination', 'destination_label', 'versement_date', 'versement_time'],
      indexedColumns: ['destination', 'versement_date'],
    },
  ),
] as const satisfies readonly TableDefinition[];

export const databaseSchema = {
  version: 4,
  tables: tableDefinitions,
} as const;

export const syncableTableNames = tableDefinitions.map((definition) => definition.name) as DatabaseTableName[];

export function getTableDefinition(tableName: DatabaseTableName) {
  const definition = tableDefinitions.find((candidate) => candidate.name === tableName);
  if (!definition) {
    throw new Error(`Unknown local database table: ${tableName}`);
  }
  return definition;
}

export function getColumnNames(tableName: DatabaseTableName) {
  return Object.keys(getTableDefinition(tableName).columns);
}

export function getBooleanColumns(tableName: DatabaseTableName) {
  return new Set(getTableDefinition(tableName).booleanColumns ?? []);
}
