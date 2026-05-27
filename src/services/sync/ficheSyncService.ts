import { Platform } from 'react-native';
import { repositories } from '@/database/repositories';
import { syncAllTables, syncTable } from '@/services/sync/databaseSync';
import { useNetworkStore } from '@/services/sync/network';
import { getCurrentSyncUserId } from '@/services/sync/syncIdentity';
import { useFinanceStore } from '@/store/financeStore';
import type { FicheData, FicheRecord } from '@/types/fiche.types';
import type { VersementItem, VersementRecord } from '@/types/versement.types';
import { toVersementItem, toVersementRecordInput } from '@/types/versement.types';

function isOnline() {
  return useNetworkStore.getState().isOnline;
}

export async function syncFicheAfterValidation(fiche: Partial<FicheData>): Promise<void> {
  const userId = await getCurrentSyncUserId(fiche.userId);
  if (Platform.OS === 'web' || !userId || !isOnline()) return;
  await syncTable('fiches', userId);
  await syncTable('transactions', userId);
  await syncTable('treasury_records', userId);
}

export async function saveVersementLocally(versement: VersementItem): Promise<VersementItem> {
  if (Platform.OS === 'web') return versement;
  const syncUserId = await getCurrentSyncUserId(versement.userId);
  const normalized = syncUserId ? { ...versement, userId: syncUserId } : versement;
  const saved = await repositories.versements.createRecord(toVersementRecordInput(normalized));
  return toVersementItem(saved as unknown as VersementRecord);
}

export async function saveRetraitActivityTransactionLocally(versement: VersementItem): Promise<void> {
  if (Platform.OS === 'web') return;
  const userId = await getCurrentSyncUserId(versement.userId);
  if (!userId) return;

  const recordedAt = Date.parse(`${versement.versementDate}T${versement.versementTime || '00:00'}`);
  const timestamp = Number.isNaN(recordedAt) ? versement.createdAt || Date.now() : recordedAt;

  await repositories.transactions.createRecord({
    id: versement.id,
    user_id: userId,
    company_id: versement.companyId ?? null,
    type: 'retrait',
    amount: versement.montant,
    category: 'Retrait de caisse',
    description: versement.destinationLabel,
    payment_method: 'Caisse',
    entry_method: 'retrait_caisse',
    recorded_at: timestamp,
    created_at: versement.createdAt || timestamp,
    updated_at: Date.now(),
  });
}

export async function syncVersementAfterCreation(versement: VersementItem): Promise<void> {
  const userId = await getCurrentSyncUserId(versement.userId);
  if (Platform.OS === 'web' || !userId || !isOnline()) return;
  await syncTable('versements', userId);
  await syncTable('treasury_records', userId);
  await syncTable('transactions', userId);
}

export async function syncAllPending(userId?: string | null): Promise<void> {
  const syncUserId = await getCurrentSyncUserId(userId);
  if (Platform.OS === 'web' || !syncUserId || !isOnline()) return;
  await syncAllTables(syncUserId);
}

export async function countLocalFiches(userId: string): Promise<number> {
  if (Platform.OS === 'web') return 0;
  const fiches = await repositories.fiches.getRecords(userId, { limit: 1 });
  return fiches.length;
}

export async function getLocalFiches(userId: string): Promise<FicheRecord[]> {
  if (Platform.OS === 'web') return [];
  return repositories.fiches.getRecords(userId, { orderBy: 'created_at', direction: 'desc' }) as unknown as Promise<FicheRecord[]>;
}

export async function getLocalVersements(userId: string): Promise<VersementItem[]> {
  if (Platform.OS === 'web') return [];
  const records = await repositories.versements.getRecords(userId, { orderBy: 'created_at', direction: 'desc' });
  return (records as unknown as VersementRecord[]).map(toVersementItem);
}

export async function fullDataRestore(userId: string): Promise<void> {
  const syncUserId = await getCurrentSyncUserId(userId);
  if (Platform.OS === 'web' || !syncUserId || !isOnline()) return;

  await syncTable('fiches', syncUserId);
  await syncTable('versements', syncUserId);
  await syncTable('transactions', syncUserId);
  await syncTable('treasury_records', syncUserId);

  const fiches = await getLocalFiches(syncUserId);
  const latestFiche = fiches.find((fiche) => fiche.status === 'completed' || fiche.status === 'validated') ?? fiches[0];
  if (latestFiche) {
    useFinanceStore.getState().setWalletBalance({
      businessId: latestFiche.company_id ?? latestFiche.id,
      amount: Number(latestFiche.caisse_reelle) || 0,
      currency: 'XAF',
      lastUpdated: new Date().toISOString(),
    });
  }
}
