import type { SyncableRecord } from './database.types';

export type VersementDestination =
  | 'domicile'
  | 'banque'
  | 'momo'
  | 'personnel'
  | 'stock'
  | 'fournisseur'
  | 'autre';

export interface VersementItem {
  id: string;
  userId: string;
  companyId?: string | null;
  montant: number;
  destination: VersementDestination;
  destinationLabel: string;
  description?: string;
  versementDate: string;
  versementTime: string;
  isSynced: boolean;
  createdAt: number;
}

export interface VersementRecord extends SyncableRecord {
  montant: number;
  destination: VersementDestination;
  destination_label: string;
  description?: string | null;
  versement_date: string;
  versement_time: string;
}

export const VERSEMENT_DESTINATION_LABELS: Record<VersementDestination, string> = {
  domicile: '🏠 Mise en sécurité — Domicile',
  banque: '🏦 Dépôt bancaire',
  momo: '📱 Transfert MoMo',
  personnel: '👤 Prélèvement personnel',
  stock: '🛒 Achat de stock',
  fournisseur: '💸 Paiement fournisseur',
  autre: '📝 Retrait — Autre',
};

export function toVersementItem(record: VersementRecord): VersementItem {
  return {
    id: record.id,
    userId: record.user_id,
    companyId: record.company_id ?? null,
    montant: Number(record.montant) || 0,
    destination: record.destination,
    destinationLabel: record.destination_label,
    description: record.description ?? undefined,
    versementDate: record.versement_date,
    versementTime: record.versement_time,
    isSynced: Boolean(record.is_synced),
    createdAt: Number(record.created_at) || Date.now(),
  };
}

export function toVersementRecordInput(item: VersementItem): Partial<VersementRecord> & { user_id: string } {
  return {
    id: item.id,
    user_id: item.userId,
    company_id: item.companyId ?? null,
    montant: item.montant,
    destination: item.destination,
    destination_label: item.destinationLabel,
    description: item.description ?? null,
    versement_date: item.versementDate,
    versement_time: item.versementTime,
    is_synced: item.isSynced,
    created_at: item.createdAt,
    updated_at: item.createdAt,
  };
}
