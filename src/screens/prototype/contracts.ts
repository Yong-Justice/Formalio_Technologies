import type { DemoNotification, Transaction } from './demoData';

export type Screen =
  | 'auth'
  | 'business-setup'
  | 'dashboard'
  | 'transactions'
  | 'add-transaction'
  | 'fiche'
  | 'fiche-detail'
  | 'retrait'
  | 'versements'
  | 'data-restore'
  | 'stock'
  | 'accounting'
  | 'cashflow'
  | 'credit-score'
  | 'reports'
  | 'mobile-money'
  | 'notifications'
  | 'ai-insights'
  | 'tax'
  | 'profile'
  | 'settings'
  | 'security'
  | 'subscription'
  | 'help'
  | 'referral'
  | 'offline';

export type AuthScreen =
  | 'splash'
  | 'welcome'
  | 'login'
  | 'signup'
  | 'email-otp'
  | 'forgot-password'
  | 'forgot-otp'
  | 'reset-password'
  | 'phone'
  | 'otp'
  | 'biometric-setup'
  | 'welcome-back'
  | 'success';

export type MascotState =
  | 'idle'
  | 'wave'
  | 'thinking'
  | 'celebrate'
  | 'secure'
  | 'listening'
  | 'sleeping'
  | 'loading'
  | 'success'
  | 'error'
  | 'pointing';

export type ToastType = 'success' | 'error' | 'info' | 'loading';
export type Toast = { id: number; type: ToastType; title: string; message?: string; duration?: number };
export type CloudSyncState = 'idle' | 'syncing' | 'ready' | 'offline' | 'error';

export type ParsedTransaction = {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  method: string;
};

export type ScannedTicketData = ParsedTransaction & {
  ticketNumber: string;
  date: string;
  merchant: string;
  referenceNumber: string;
  details: string;
  imageUri?: string;
};

export type ShellProps = {
  showNav: boolean;
  activeTab: string;
  navigate: (s: Screen) => void;
  goBack: () => void;
  setActiveTab: (tab: string) => void;
  openAi?: () => void;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  notifications: DemoNotification[];
  pendingSyncCount?: number;
};

export type LoanRequestSummary = {
  amount: number;
  duration: number;
  totalRepayment: number;
  approvalProbability: number;
  borrowingStrengthIndex: number;
  purpose: string;
  interestRate: number;
  processingFee: number;
};

export type LoanStatusStage =
  | 'submitted'
  | 'under-review'
  | 'risk-assessment'
  | 'pending-documents'
  | 'approved'
  | 'rejected'
  | 'disbursed';

export type LoanRequestRecord = LoanRequestSummary & {
  id: string;
  requestedAt: string;
  status: LoanStatusStage;
  expectedReviewDuration: string;
  nextAction: string;
  notificationCount: number;
};

export type ReportType = 'bilan' | 'compte-resultat' | 'tresorerie' | 'tva';
export type BackendReportType = 'bilan' | 'resultat' | 'cashflow' | 'tva' | 'loan_readiness' | 'dashboard_summary';

export type TransactionList = Transaction[];

export type TransactionSavedHandler = (transaction: Transaction) => void;
export type TransactionSaveRequest = Omit<Transaction, 'id' | 'status'> & { id?: string | number; status?: string };
export type TransactionSaver = (transaction: TransactionSaveRequest) => Promise<Transaction>;
