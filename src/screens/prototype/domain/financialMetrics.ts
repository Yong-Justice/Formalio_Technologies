import type { CloudFinancialMetrics } from '@/services/api/formalioBackend';
import type { Transaction } from '../demoData';
import { defaultBusinessProfile, emptyFinancialMetrics, type BusinessProfile } from './defaults';

function transactionMonthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
}

export function calculateProfileCompletion(profile: BusinessProfile) {
  const fields = [profile.storeName, profile.storeDescription, profile.ownerFullName, profile.phone, profile.email, profile.category, profile.address, profile.avatarId, profile.language];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

const clampNumber = (value: number, min = 0, max = 1) => Math.max(min, Math.min(max, Number.isFinite(value) ? value : min));

function mosikaMaturityCap(activeMonths: number, observedDays: number, revenueCount: number, expenseCount: number) {
  if (revenueCount === 0 || expenseCount === 0) return 80;
  if (activeMonths < 2 || observedDays < 30) return 140;
  if (activeMonths < 3 || observedDays < 60) return 240;
  if (activeMonths < 6 || observedDays < 120) return 380;
  if (activeMonths < 9 || observedDays < 180) return 520;
  if (activeMonths < 12 || observedDays < 270) return 680;
  if (activeMonths < 18 || observedDays < 365) return 800;
  return 1000;
}

function mosikaBand(score: number, confidence: number, empty: boolean) {
  if (empty || confidence < 15) return 'insufficient_history';
  if (score >= 820 && confidence >= 70) return 'institutional_grade';
  if (score >= 700 && confidence >= 55) return 'strong';
  if (score >= 560) return 'developing';
  if (score >= 350) return 'elevated_risk';
  return 'high_risk';
}

export function calculateLocalFinancialMetrics(transactions: Transaction[], profile = defaultBusinessProfile, reportCount = 0, documentCount = 0): CloudFinancialMetrics {
  const indexedTransactions = transactions.map((transaction, index) => ({ transaction, index }));
  const cashDelta = (transaction: Transaction) => {
    if (transaction.type === 'income') return transaction.amount;
    if (transaction.type === 'expense' || transaction.type === 'retrait') return -transaction.amount;
    return 0;
  };
  const latestFiche = indexedTransactions
    .filter(({ transaction }) => transaction.type === 'fiche_reconciliation')
    .sort((a, b) => {
      const dateDelta = Date.parse(b.transaction.date) - Date.parse(a.transaction.date);
      return dateDelta || a.index - b.index;
    })[0];
  const latestFicheTime = latestFiche ? Date.parse(latestFiche.transaction.date) : null;
  const cashBalance = latestFiche && latestFicheTime != null
    ? Number(latestFiche.transaction.amount || 0) + indexedTransactions
      .filter(({ transaction, index }) => {
        if (transaction.type === 'fiche_reconciliation') return false;
        const transactionTime = Date.parse(transaction.date);
        if (Number.isNaN(transactionTime) || Number.isNaN(latestFicheTime)) return index < latestFiche.index;
        return transactionTime > latestFicheTime || (transactionTime === latestFicheTime && index < latestFiche.index);
      })
      .reduce((sum, { transaction }) => sum + cashDelta(transaction), 0)
    : transactions.reduce((sum, transaction) => sum + cashDelta(transaction), 0);
  const revenue = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense' || t.type === 'retrait').reduce((sum, t) => sum + t.amount, 0);
  const profit = revenue - expenses;
  const activeMonths = new Set(transactions.map((t) => transactionMonthKey(t.date))).size;
  const incomeTransactions = transactions.filter((t) => t.type === 'income');
  const months = Array.from({ length: 6 }, (_, index) => {
    const d = new Date();
    d.setMonth(d.getMonth() - (5 - index));
    return { key: d.toISOString().slice(0, 7), label: monthLabel(d) };
  });
  const monthly = months.map((month) => {
    const monthTransactions = transactions.filter((t) => transactionMonthKey(t.date) === month.key);
    const income = monthTransactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
    const expense = monthTransactions.filter((t) => t.type === 'expense' || t.type === 'retrait').reduce((sum, t) => sum + t.amount, 0);
    return { date: `${month.key}-01`, label: month.label, income, expense, net: income - expense };
  });
  const currentMonth = monthly[monthly.length - 1]?.income ?? 0;
  const previousMonth = monthly[monthly.length - 2]?.income ?? 0;
  const growthRate = previousMonth ? ((currentMonth - previousMonth) / previousMonth) * 100 : currentMonth > 0 ? 100 : 0;
  const byCategory = new Map<string, { name: string; type: 'income' | 'expense'; amount: number }>();
  transactions.filter((transaction) => transaction.type === 'income' || transaction.type === 'expense' || transaction.type === 'retrait').forEach((transaction) => {
    const type = transaction.type === 'income' ? 'income' : 'expense';
    const key = `${type}:${transaction.category || 'Autres'}`;
    const current = byCategory.get(key) ?? { name: transaction.category || 'Autres', type, amount: 0 };
    current.amount += transaction.amount;
    byCategory.set(key, current);
  });
  const categoryBreakdown = Array.from(byCategory.values()).map((item) => {
    const total = item.type === 'income' ? revenue : expenses;
    return { ...item, share: total ? Math.round((item.amount / total) * 10000) / 100 : 0 };
  }).sort((a, b) => b.amount - a.amount);
  const complianceScore = Math.round(
    (profile.kycStatus === 'approved' ? 35 : profile.kycStatus === 'under-review' ? 18 : 0) +
    (profile.emailVerificationStatus === 'verified' || profile.emailVerifiedAt ? 20 : 0) +
    Math.min(30, documentCount * 3) +
    Math.min(15, reportCount * 3),
  );
  const sortedDates = transactions
    .map((t) => new Date(t.date))
    .filter((date) => !Number.isNaN(date.getTime()))
    .sort((a, b) => a.getTime() - b.getTime());
  const observedDays = sortedDates.length > 1
    ? Math.max(1, Math.ceil((sortedDates[sortedDates.length - 1].getTime() - sortedDates[0].getTime()) / 86400000) + 1)
    : sortedDates.length;
  const activeDays = new Set(transactions.map((t) => t.date.slice(0, 10))).size;
  const completedTransactions = transactions.filter((t) => !['failed', 'cancelled', 'rejected', 'draft'].includes(String(t.status).toLowerCase()));
  const completedRatio = transactions.length ? completedTransactions.length / transactions.length : 0;
  const margin = revenue ? profit / revenue : 0;
  const monthlyRevenueValues = monthly.map((m) => m.income).filter((value) => value > 0);
  const monthlyNetValues = monthly.map((m) => m.net);
  const monthlyRevenueAverage = monthlyRevenueValues.length ? monthlyRevenueValues.reduce((sum, value) => sum + value, 0) / monthlyRevenueValues.length : 0;
  const monthlyRevenueStdDev = monthlyRevenueAverage ? Math.sqrt(monthlyRevenueValues.reduce((sum, value) => sum + Math.pow(value - monthlyRevenueAverage, 2), 0) / monthlyRevenueValues.length) : 0;
  const netAverage = monthlyNetValues.length ? monthlyNetValues.reduce((sum, value) => sum + value, 0) / monthlyNetValues.length : 0;
  const netStdDev = monthlyNetValues.length ? Math.sqrt(monthlyNetValues.reduce((sum, value) => sum + Math.pow(value - netAverage, 2), 0) / monthlyNetValues.length) : 0;
  const transactionAmounts = transactions.map((t) => t.amount).filter((amount) => amount > 0);
  const averageAmount = transactionAmounts.length ? transactionAmounts.reduce((sum, amount) => sum + amount, 0) / transactionAmounts.length : 0;
  const amountStdDev = averageAmount ? Math.sqrt(transactionAmounts.reduce((sum, amount) => sum + Math.pow(amount - averageAmount, 2), 0) / transactionAmounts.length) : 0;
  const amountAnomalies = amountStdDev && transactions.length >= 12 ? transactionAmounts.filter((amount) => Math.abs(amount - averageAmount) > amountStdDev * 2.75).length : 0;
  const duplicateReferences = 0;
  const negativeCashflowMonths = monthly.filter((m) => m.net < 0).length;
  const activityFactor = clampNumber(Math.log1p(transactions.length) / Math.log1p(180));
  const revenueConsistencyFactor = monthlyRevenueAverage ? clampNumber(1 - monthlyRevenueStdDev / monthlyRevenueAverage) : 0;
  const profitabilityFactor = clampNumber((margin + 0.10) / 0.55);
  const cashflowFactor = activeMonths ? clampNumber(monthly.filter((m) => m.net > 0).length / Math.max(1, activeMonths)) : 0;
  const expenseDisciplineFactor = revenue ? clampNumber(1 - expenses / revenue) : 0;
  const growthFactor = clampNumber((growthRate / 100 + 0.05) / 0.45);
  const timeMaturityFactor = clampNumber((clampNumber(observedDays / 365) * 0.45) + (clampNumber(activeMonths / 12) * 0.35) + (clampNumber(activeDays / Math.max(1, observedDays)) * 0.20));
  const debtFactor = revenue ? 0.72 : 0;
  const paymentRegularityFactor = completedRatio;
  const recurringRevenueFactor = incomeTransactions.length >= 6 ? clampNumber(new Set(incomeTransactions.map((t) => t.description.toLowerCase().trim())).size / Math.max(1, incomeTransactions.length)) : 0;
  const liquidityFactor = revenue ? clampNumber(Math.max(0, profit) / Math.max(1, expenses * 0.75)) : 0;
  const volatilityFactor = monthlyRevenueAverage ? clampNumber(1 - monthlyRevenueStdDev / monthlyRevenueAverage) : 0;
  const netVolatilityFactor = Math.abs(netAverage) ? clampNumber(1 - netStdDev / Math.abs(netAverage)) : 0;
  const anomalyFactor = transactions.length ? clampNumber(1 - ((amountAnomalies + duplicateReferences) / Math.max(1, transactions.length))) : 0;
  const reconciliationFactor = transactions.length ? transactions.filter((t) => ['reconciled', 'completed', 'verified'].includes(String(t.status).toLowerCase())).length / transactions.length : 0;
  const complianceFactor = complianceScore / 100;
  const documentReliabilityFactor = clampNumber((Math.min(1, documentCount / 8) * 0.70) + (Math.min(1, reportCount / 4) * 0.30));
  const scoreWeight =
    revenueConsistencyFactor * 0.13 +
    profitabilityFactor * 0.11 +
    cashflowFactor * 0.11 +
    expenseDisciplineFactor * 0.10 +
    timeMaturityFactor * 0.12 +
    debtFactor * 0.08 +
    paymentRegularityFactor * 0.07 +
    recurringRevenueFactor * 0.06 +
    liquidityFactor * 0.07 +
    volatilityFactor * 0.06 +
    anomalyFactor * 0.04 +
    reconciliationFactor * 0.02 +
    complianceFactor * 0.03;
  const riskPenalty = Math.round(
    (amountAnomalies * 18) +
    (duplicateReferences * 22) +
    (negativeCashflowMonths * 10) +
    (profit < 0 ? 70 : 0) +
    (revenue > 0 && expenses / revenue > 0.95 ? 55 : 0) +
    (volatilityFactor < 0.35 && transactions.length >= 12 ? 45 : 0),
  );
  const outflowTransactions = transactions.filter((t) => t.type === 'expense' || t.type === 'retrait');
  const maturityCap = transactions.length === 0 ? 0 : mosikaMaturityCap(activeMonths, observedDays, incomeTransactions.length, outflowTransactions.length);
  const rawMosikaScore = transactions.length === 0 ? 0 : Math.max(0, Math.round((scoreWeight * (0.30 + timeMaturityFactor * 0.70) * 1000) - riskPenalty));
  const mosikaScore = Math.min(maturityCap, rawMosikaScore);
  const scoreConfidence = transactions.length === 0 ? 0 : Math.round(clampNumber(
    Math.min(1, transactions.length / 120) * 0.25 +
    Math.min(1, activeMonths / 12) * 0.30 +
    Math.min(1, observedDays / 365) * 0.25 +
    complianceFactor * 0.12 +
    documentReliabilityFactor * 0.08,
  ) * 100);
  const financialHealth = transactions.length === 0 ? 0 : Math.round(clampNumber(
    profitabilityFactor * 0.23 +
    cashflowFactor * 0.22 +
    expenseDisciplineFactor * 0.17 +
    revenueConsistencyFactor * 0.14 +
    liquidityFactor * 0.12 +
    anomalyFactor * 0.07 +
    complianceFactor * 0.05,
  ) * 100);
  const institutionalEligible = mosikaScore >= 520 && scoreConfidence >= 45 && activeMonths >= 3 && incomeTransactions.length > 0 && transactions.some((t) => t.type === 'expense');
  const loanApprovalProbability = institutionalEligible
    ? Math.round(clampNumber((1 / (1 + Math.exp(-((mosikaScore - 700) / 90)))) * 72 * (0.45 + timeMaturityFactor * 0.55) * (0.70 + complianceFactor * 0.30) * anomalyFactor, 0, 82))
    : 0;
  const riskAssessmentLevel = transactions.length === 0 || scoreConfidence < 15
    ? 'insufficient_data'
    : mosikaScore >= 760 && scoreConfidence >= 65 && anomalyFactor >= 0.92
      ? 'low'
      : mosikaScore >= 620 && scoreConfidence >= 50
        ? 'moderate'
        : mosikaScore >= 420
          ? 'elevated'
          : 'high';
  return {
    ...emptyFinancialMetrics,
    revenue,
    expenses,
    profit,
    balance: cashBalance,
    cashFlow: cashBalance,
    profitMargin: revenue ? Math.round((profit / revenue) * 10000) / 100 : 0,
    taxCollected: Math.round(revenue * 0.1925),
    taxDeductible: Math.round(expenses * 0.1925),
    taxDue: Math.max(0, Math.round((revenue - expenses) * 0.1925)),
    transactionCount: transactions.length,
    revenueCount: incomeTransactions.length,
    expenseCount: outflowTransactions.length,
    growthRate: Math.round(growthRate * 100) / 100,
    mosikaScore,
    rawMosikaScore,
    scoreConfidence,
    scoreBand: mosikaBand(mosikaScore, scoreConfidence, transactions.length === 0),
    modelVersion: 'mosika-score-v5.0-institutional-local',
    financialHealth,
    complianceScore,
    documentCount,
    reportCount,
    loanApprovalProbability,
    riskAssessmentLevel,
    financialRatios: {
      expenseToRevenue: revenue ? Math.round((expenses / revenue) * 10000) / 100 : 0,
      netMargin: revenue ? Math.round((profit / revenue) * 10000) / 100 : 0,
      debtToRevenue: 0,
      reconciliationRate: transactions.length ? Math.round(reconciliationFactor * 10000) / 100 : 0,
      paymentRegularity: Math.round(paymentRegularityFactor * 100),
      revenueVolatility: Math.round((1 - volatilityFactor) * 10000) / 100,
      netCashflowVolatility: Math.round((1 - netVolatilityFactor) * 10000) / 100,
      liquidityRatio: Math.round(liquidityFactor * 10000) / 100,
    },
    stabilityMetrics: {
      activeMonths,
      activeDays,
      observedDays,
      negativeCashflowMonths,
      maturityCap,
      scoreWeight: Math.round(scoreWeight * 10000) / 100,
    },
    scoreWeights: {
      revenueConsistency: 0.13,
      profitability: 0.11,
      cashflow: 0.11,
      expenseDiscipline: 0.10,
      timeMaturity: 0.12,
      debtExposure: 0.08,
      paymentRegularity: 0.07,
      recurringRevenue: 0.06,
      liquidity: 0.07,
      volatilityControl: 0.06,
      anomalyControl: 0.04,
      reconciliation: 0.02,
      compliance: 0.03,
    },
    riskIndicators: {
      amountAnomalies,
      duplicateReferences,
      overdueInvoices: 0,
      activeLoanRequests: 0,
      outstandingReceivables: 0,
      negativeCashflowMonths,
      maturityCap,
    },
    minimumDataRequired: [
      ...(transactions.length < 12 ? ['Ajoutez au moins 12 transactions finalisees'] : []),
      ...(incomeTransactions.length === 0 ? ['Ajoutez au moins un revenu reel'] : []),
      ...(outflowTransactions.length === 0 ? ['Ajoutez au moins une depense reelle'] : []),
      ...(activeMonths < 3 ? ['Construisez au moins 3 mois actifs'] : []),
      ...(documentCount === 0 ? ['Ajoutez des justificatifs ou documents KYC'] : []),
    ],
    dailyCashflow: monthly,
    categoryBreakdown,
    scoreFactors: {
      activity: Math.round(activityFactor * 100),
      cashflow: Math.round(cashflowFactor * 100),
      expenseDiscipline: Math.round(expenseDisciplineFactor * 100),
      revenueConsistency: Math.round(revenueConsistencyFactor * 100),
      profitability: Math.round(profitabilityFactor * 100),
      growth: Math.round(growthFactor * 100),
      stability: Math.round(timeMaturityFactor * 100),
      debtExposure: Math.round(debtFactor * 100),
      paymentRegularity: Math.round(paymentRegularityFactor * 100),
      recurringRevenue: Math.round(recurringRevenueFactor * 100),
      liquidity: Math.round(liquidityFactor * 100),
      volatilityControl: Math.round(volatilityFactor * 100),
      anomalyControl: Math.round(anomalyFactor * 100),
      reconciliation: Math.round(reconciliationFactor * 100),
      compliance: complianceScore,
      documentReliability: Math.round(documentReliabilityFactor * 100),
    },
    emptyState: transactions.length === 0,
  };
}
