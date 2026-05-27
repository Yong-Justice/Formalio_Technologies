import type { CloudFinancialMetrics, CloudSubscription } from '@/services/api/formalioBackend';
import type { SupportedLanguage } from '@/i18n';

export type KycStatus = 'pending' | 'under-review' | 'approved' | 'rejected';
export type EmailVerificationStatus = 'unverified' | 'sent' | 'queued' | 'deferred' | 'verified';

export type BusinessProfile = {
  storeName: string;
  storeDescription: string;
  ownerFullName: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  avatarId?: string;
  profileImageUri?: string;
  coverTheme?: string;
  language: SupportedLanguage;
  kycStatus: KycStatus;
  emailVerificationStatus: EmailVerificationStatus;
  emailVerifiedAt?: string;
  emailVerificationSentAt?: string;
  emailVerificationNextAttemptAt?: string;
};

export type KycDraft = {
  fullName: string;
  birthDate: string;
  idType: string;
  idNumber: string;
  idFrontUri?: string;
  idBackUri?: string;
  selfieUri?: string;
  businessName: string;
  registrationNumber: string;
  taxId: string;
  address: string;
  addressProofUri?: string;
};

export const defaultBusinessProfile: BusinessProfile = {
  storeName: 'Mon entreprise',
  storeDescription: '',
  ownerFullName: '',
  phone: '',
  email: '',
  category: 'Commerce',
  address: '',
  avatarId: 'avatar-01',
  profileImageUri: 'avatar:avatar-01',
  coverTheme: 'emerald',
  language: 'fr',
  kycStatus: 'pending',
  emailVerificationStatus: 'unverified',
};

export const emptyFinancialMetrics: CloudFinancialMetrics = {
  revenue: 0,
  expenses: 0,
  profit: 0,
  balance: 0,
  cashFlow: 0,
  profitMargin: 0,
  taxCollected: 0,
  taxDeductible: 0,
  taxDue: 0,
  transactionCount: 0,
  revenueCount: 0,
  expenseCount: 0,
  growthRate: 0,
  mosikaScore: 0,
  rawMosikaScore: 0,
  scoreConfidence: 0,
  scoreBand: 'insufficient_history',
  modelVersion: 'mosika-score-v5.0-institutional',
  financialHealth: 0,
  complianceScore: 0,
  documentCount: 0,
  reportCount: 0,
  loanApprovalProbability: 0,
  riskAssessmentLevel: 'insufficient_data',
  financialRatios: {},
  stabilityMetrics: {},
  riskIndicators: {},
  scoreWeights: {},
  scoreDrivers: {},
  minimumDataRequired: ['Ajoutez des transactions reelles', 'Completez la verification du profil'],
  dailyCashflow: [],
  categoryBreakdown: [],
  scoreFactors: {},
  emptyState: true,
};

export const defaultSubscription: CloudSubscription = {
  tier: 'free',
  status: 'trialing',
  seats: 1,
};
