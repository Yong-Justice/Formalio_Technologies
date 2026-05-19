export type Language = 'fr' | 'en' | 'pcm';
  export type TransactionType = 'income' | 'expense';
  export type SyncStatus = 'synced' | 'pending' | 'failed';
  export interface User { id: string; phone: string; email?: string; fullName: string; language: Language; onboardingCompleted: boolean; biometricEnabled: boolean; }
  export interface Business { id: string; name: string; type: string; city: string; country: string; taxRegime?: string; }
  export interface Transaction { id: string; businessId: string; type: TransactionType; amount: number; category: string; description?: string; date: string; paymentMethod?: string; syncStatus: SyncStatus; deletedAt?: string | null; }
  export interface CreditScore { score: number; level: string; riskCategory: string; components: { label: string; value: number }[]; tips: string[]; }
  export interface Report { id: string; type: 'bilan' | 'resultat' | 'cashflow' | 'tax' | 'loan-readiness'; title: string; period: string; status: 'ready' | 'processing' | 'failed'; fileUrl?: string; }
  /** Real-time wallet balance — 30s TTL */
  export interface WalletBalance { businessId: string; amount: number; currency: 'XAF'; lastUpdated: string; }
  /** MTN MoMo / Orange Money exchange rates — 1h TTL */
  export interface ExchangeRate { provider: 'mtn_momo' | 'orange_money'; fromCurrency: string; toCurrency: string; rate: number; updatedAt: string; }
  