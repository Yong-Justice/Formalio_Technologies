import { Platform } from 'react-native';
import { repositories } from '@/database/repositories';
import { useFinanceStore } from '@/store/financeStore';
import type { FicheData, FicheResult } from '@/types/fiche.types';

const FALLBACK_BUSINESS_ID = 'local-business';

function todayMidnightTimestamp() {
  const date = new Date();
  date.setHours(0, 0, 0, 0);
  return date.getTime();
}

export async function updateTreasuryBalanceFromFiche(
  fiche: Partial<FicheData>,
  result: FicheResult,
  companyId?: string | null,
) {
  const balance = Number(result.caisseReelle) || 0;
  const businessId = companyId || fiche.id || FALLBACK_BUSINESS_ID;

  useFinanceStore.getState().setWalletBalance({
    businessId,
    amount: balance,
    currency: 'XAF',
    lastUpdated: new Date().toISOString(),
  });

  if (Platform.OS === 'web' || !fiche.userId) return balance;

  await repositories.treasury_records.createRecord({
    user_id: fiche.userId,
    company_id: companyId ?? null,
    record_date: todayMidnightTimestamp(),
    opening_cash: null,
    closing_cash: balance,
    total_liquid_assets: balance,
    daily_revenue: result.totalRevenusTheoriques,
    daily_expenses: result.totalDepenses,
    daily_profit: result.totalRevenusTheoriques - result.totalDepenses,
    is_manually_adjusted: true,
    adjustment_notes: `Fiche validation${fiche.id ? `: ${fiche.id}` : ''}`,
    created_at: Date.now(),
    updated_at: Date.now(),
  });

  return balance;
}

export async function applyRetraitToTreasury(params: {
  userId?: string;
  companyId?: string | null;
  currentBalance: number;
  montant: number;
  versementId?: string;
}) {
  const nextBalance = Math.max(0, Number(params.currentBalance || 0) - Number(params.montant || 0));
  const businessId = params.companyId || params.userId || FALLBACK_BUSINESS_ID;

  useFinanceStore.getState().setWalletBalance({
    businessId,
    amount: nextBalance,
    currency: 'XAF',
    lastUpdated: new Date().toISOString(),
  });

  if (Platform.OS === 'web' || !params.userId) return nextBalance;

  await repositories.treasury_records.createRecord({
    user_id: params.userId,
    company_id: params.companyId ?? null,
    record_date: todayMidnightTimestamp(),
    closing_cash: nextBalance,
    total_liquid_assets: nextBalance,
    daily_expenses: params.montant,
    daily_profit: -params.montant,
    is_manually_adjusted: true,
    adjustment_notes: `Retrait de caisse${params.versementId ? `: ${params.versementId}` : ''}`,
    created_at: Date.now(),
    updated_at: Date.now(),
  });

  return nextBalance;
}
