import { supabase, isSupabaseConfigured, getSupabaseRuntimeConfig } from '@/services/supabase/client';
import type { Transaction as PrototypeTransaction } from '@/prototype/demoData';
import type { StockItem } from '@/features/stock/state/stock.store';
import type { SupportedLanguage } from '@/i18n';

export type CloudKycStatus = 'pending' | 'under-review' | 'approved' | 'rejected';
export type CloudEmailVerificationStatus = 'unverified' | 'sent' | 'queued' | 'deferred' | 'verified';

export type CloudEmailVerificationResult = {
  status: CloudEmailVerificationStatus | 'skipped';
  message: string;
  sentAt?: string;
  nextAttemptAt?: string;
  retryable?: boolean;
};

export type CloudBusinessProfile = {
  storeName: string;
  storeDescription: string;
  ownerFullName: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  profileImageUri?: string;
  avatarId?: string;
  coverTheme?: string;
  language: SupportedLanguage;
  kycStatus: CloudKycStatus;
  emailVerificationStatus: CloudEmailVerificationStatus;
  emailVerifiedAt?: string;
  emailVerificationSentAt?: string;
  emailVerificationNextAttemptAt?: string;
};

export type CloudLoanRequest = {
  id: string;
  amount: number;
  duration: number;
  totalRepayment: number;
  approvalProbability: number;
  borrowingStrengthIndex: number;
  purpose: string;
  interestRate: number;
  processingFee: number;
  requestedAt: string;
  status: 'submitted' | 'under-review' | 'risk-assessment' | 'pending-documents' | 'approved' | 'rejected' | 'disbursed';
  expectedReviewDuration: string;
  nextAction: string;
  notificationCount: number;
};

export type CloudSubscription = {
  tier: 'free' | 'starter' | 'growth' | 'enterprise';
  status: 'trialing' | 'active' | 'past_due' | 'paused' | 'canceled' | 'expired';
  currentPeriodEnd?: string;
  seats: number;
};

export type CloudFinancialMetrics = {
  revenue: number;
  expenses: number;
  profit: number;
  balance: number;
  cashFlow: number;
  profitMargin: number;
  taxCollected: number;
  taxDeductible: number;
  taxDue: number;
  transactionCount: number;
  revenueCount: number;
  expenseCount: number;
  growthRate: number;
  mosikaScore: number;
  rawMosikaScore: number;
  scoreConfidence: number;
  scoreBand?: string;
  modelVersion?: string;
  financialHealth: number;
  complianceScore: number;
  documentCount: number;
  reportCount: number;
  loanApprovalProbability: number;
  riskAssessmentLevel: 'insufficient_data' | 'low' | 'moderate' | 'elevated' | 'high';
  financialRatios: Record<string, number>;
  stabilityMetrics: Record<string, number | string | null>;
  riskIndicators: Record<string, number>;
  scoreWeights: Record<string, number>;
  scoreDrivers: Record<string, unknown>;
  minimumDataRequired: string[];
  dailyCashflow: { date: string; label: string; income: number; expense: number; net: number }[];
  categoryBreakdown: { name: string; type: 'income' | 'expense'; amount: number; share: number }[];
  scoreFactors: Record<string, number>;
  emptyState: boolean;
};

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  category: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
};

type StockItemRow = {
  id: string;
  company_id: string;
  name: string;
  quantity: number | string;
  price_type: 'fixed' | 'range';
  unit_price: number | string | null;
  min_price: number | string | null;
  max_price: number | string | null;
  created_at: string;
  updated_at: string;
};

type CompanyRow = {
  id: string;
  name: string;
  description: string | null;
  category: string | null;
  phone: string | null;
  email: string | null;
  address: string | null;
  city: string | null;
  country: string | null;
  kyc_status: 'pending' | 'under_review' | 'approved' | 'rejected';
  metadata?: Record<string, unknown> | null;
};

type ProfileRow = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
  language?: SupportedLanguage | null;
  metadata?: Record<string, unknown> | null;
  email_verification_status?: CloudEmailVerificationStatus | null;
  email_verified_at?: string | null;
  email_verification_sent_at?: string | null;
  email_verification_next_attempt_at?: string | null;
  email_verification_attempts?: number | null;
  email_verification_last_error?: string | null;
};

type SessionUser = {
  id: string;
  email?: string | null;
  phone?: string | null;
  user_metadata?: Record<string, unknown>;
};

type BootstrapData = {
  companyId: string;
  profile: CloudBusinessProfile;
  transactions: PrototypeTransaction[];
  stockItems: StockItem[];
  notifications: { id: string; type: 'success' | 'warning' | 'info'; title: string; message: string; time: string; read: boolean }[];
  loanRequests: CloudLoanRequest[];
  subscription: CloudSubscription;
  metrics: CloudFinancialMetrics;
};

export type CloudSyncErrorDetails = {
  source: string;
  message: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  retryable: boolean;
};

export type CloudReportExport = {
  reportId: string;
  title: string;
  type: 'bilan' | 'resultat' | 'cashflow' | 'tva' | 'loan_readiness' | 'dashboard_summary';
  format: 'pdf' | 'xlsx' | 'csv' | 'json';
  fileName: string;
  mimeType: string;
  encoding: 'base64' | 'utf-8';
  content: string;
  size: number;
};

export type CloudVoiceTransactionResult = {
  transcript: string;
  confidence: number;
  parsed: Omit<PrototypeTransaction, 'id' | 'date' | 'status'>;
  provider: string;
  warnings: string[];
};

export type CloudOcrExtraction = {
  ticketNumber: string;
  amount: number;
  date: string;
  merchant: string;
  referenceNumber: string;
  transactionDetails: string;
  type: 'income' | 'expense';
  category: string;
  method: string;
  confidence: number;
  provider: string;
};

export class CloudSyncError extends Error {
  details: CloudSyncErrorDetails;

  constructor(details: CloudSyncErrorDetails) {
    super(details.message);
    this.name = 'CloudSyncError';
    this.details = details;
  }
}

type SupabaseLikeError = {
  message?: string;
  code?: string;
  details?: string;
  hint?: string;
  status?: number;
  name?: string;
};

function toSupabaseLikeError(error: unknown): SupabaseLikeError {
  if (error instanceof CloudSyncError) return error.details;
  if (error instanceof Error) return { message: error.message, name: error.name };
  if (error && typeof error === 'object') return error as SupabaseLikeError;
  return { message: String(error ?? '') };
}

function getRawErrorMessage(error: unknown) {
  const shaped = toSupabaseLikeError(error);
  return shaped.message || shaped.details || shaped.hint || String(error ?? '');
}

function isRetryableCloudError(error: unknown) {
  const shaped = toSupabaseLikeError(error);
  const message = getRawErrorMessage(error).toLowerCase();
  const status = Number(shaped.status ?? 0);
  return (
    status === 0 ||
    status === 408 ||
    status === 429 ||
    status >= 500 ||
    ['08000', '08003', '08006', '53300', '57014', 'PGRST000', 'PGRST301'].includes(String(shaped.code ?? '')) ||
    message.includes('failed to fetch') ||
    message.includes('network request failed') ||
    message.includes('timeout') ||
    message.includes('temporarily') ||
    message.includes('circuit breaker') ||
    message.includes('fetch failed')
  );
}

function describeSupabaseError(error: unknown, fallback: string, source: string) {
  if (error instanceof CloudSyncError) return error;

  const shaped = toSupabaseLikeError(error);
  const raw = getRawErrorMessage(error);
  const lower = raw.toLowerCase();
  let message = fallback;

  if (lower.includes('failed to fetch') || lower.includes('network request failed') || lower.includes('fetch failed')) {
    message = 'Connexion cloud temporairement indisponible. Formalio reessaiera automatiquement.';
  } else if (lower.includes('jwt') || lower.includes('not authenticated') || lower.includes('invalid token')) {
    message = 'Votre session cloud a expire. Reconnectez-vous pour relancer la synchronisation.';
  } else if (lower.includes('permission denied') || shaped.code === '42501') {
    message = 'Acces cloud refuse par les regles de securite Supabase.';
  } else if (lower.includes('does not exist') || shaped.code === '42P01' || shaped.code === '42883') {
    message = 'Configuration Supabase incomplete: une table ou fonction requise est manquante.';
  } else if (lower.includes('row-level security')) {
    message = 'Les donnees cloud sont protegees par RLS et cette action est refusee.';
  } else if (raw) {
    message = raw;
  }

  return new CloudSyncError({
    source,
    message,
    code: shaped.code,
    details: shaped.details,
    hint: shaped.hint,
    status: shaped.status,
    retryable: isRetryableCloudError(error),
  });
}

function logCloudSyncWarning(source: string, error: unknown) {
  const syncError = describeSupabaseError(error, `Impossible de charger ${source}.`, source);
  console.warn('[Formalio cloud sync]', syncError.details);
}

async function readRequired<T>(
  source: string,
  request: PromiseLike<{ data: T | null; error: unknown }>,
  fallbackMessage: string,
) {
  const { data, error } = await request;
  if (error) throw describeSupabaseError(error, fallbackMessage, source);
  return data;
}

async function readOptional<T>(
  source: string,
  request: PromiseLike<{ data: T | null; error: unknown }>,
  fallback: T,
) {
  try {
    const { data, error } = await request;
    if (error) throw error;
    return data ?? fallback;
  } catch (error) {
    logCloudSyncWarning(source, error);
    return fallback;
  }
}

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9) return `+237${digits}`;
  if (digits.startsWith('237')) return `+${digits}`;
  if (digits.length && phone.trim().startsWith('+')) return `+${digits}`;
  return phone.trim();
}

function toKycStatus(status: CompanyRow['kyc_status']): CloudKycStatus {
  if (status === 'under_review') return 'under-review';
  return status;
}

function fromKycStatus(status: CloudKycStatus) {
  return status === 'under-review' ? 'under_review' : status;
}

function isRateLimitError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();
  return message.includes('rate limit') || message.includes('too many') || message.includes('quota') || message.includes('over_email_send_rate_limit');
}

function isTransientEmailError(error: unknown) {
  const message = error instanceof Error ? error.message.toLowerCase() : String(error ?? '').toLowerCase();
  return isRateLimitError(error) || message.includes('network') || message.includes('timeout') || message.includes('temporarily');
}

function friendlyAuthMessage(error: unknown, fallback: string) {
  const message = error instanceof Error ? error.message : String(error ?? '');
  const lower = message.toLowerCase();
  if (isRateLimitError(error)) return 'Formalio a bien cree votre compte. Le prochain email de verification sera repropose automatiquement.';
  if (lower.includes('already registered') || lower.includes('already exists')) return 'Cet email a deja un compte. Connectez-vous ou utilisez mot de passe oublie.';
  if (lower.includes('invalid login') || lower.includes('invalid credentials')) return 'Email ou mot de passe incorrect.';
  if (lower.includes('email not confirmed')) return 'Vous pouvez continuer: la verification email sera proposee dans votre profil.';
  return message || fallback;
}

function nextAttempt(minutes: number) {
  return new Date(Date.now() + minutes * 60 * 1000).toISOString();
}

function mapTransaction(row: any): PrototypeTransaction {
  return {
    id: row.id,
    date: String(row.transaction_date ?? row.occurred_at ?? '').slice(0, 10),
    description: row.description ?? 'Transaction',
    category: row.categories?.name ?? row.metadata?.category ?? 'Autres',
    type: row.type === 'expense' ? 'expense' : 'income',
    amount: Number(row.amount ?? 0),
    method: row.payment_method ?? 'Mobile Money',
    status: row.status ?? 'completed',
  };
}

function mapStockItem(row: StockItemRow): StockItem {
  const priceType = row.price_type === 'range' ? 'range' : 'fixed';
  return {
    id: row.id,
    name: row.name,
    quantity: toNumber(row.quantity),
    priceType,
    unitPrice: priceType === 'fixed' ? toNumber(row.unit_price) : undefined,
    minPrice: priceType === 'range' ? toNumber(row.min_price) : undefined,
    maxPrice: priceType === 'range' ? toNumber(row.max_price) : undefined,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

function stockItemPayload(companyId: string, item: StockItem) {
  return {
    id: item.id,
    company_id: companyId,
    name: item.name,
    quantity: item.quantity,
    price_type: item.priceType,
    unit_price: item.priceType === 'fixed' ? item.unitPrice ?? 0 : null,
    min_price: item.priceType === 'range' ? item.minPrice ?? 0 : null,
    max_price: item.priceType === 'range' ? item.maxPrice ?? 0 : null,
    deleted_at: null,
  };
}

function mapNotification(row: NotificationRow) {
  const ageMs = Date.now() - new Date(row.created_at).getTime();
  const minutes = Math.max(1, Math.round(ageMs / 60000));
  const time = minutes < 60 ? `${minutes} min` : minutes < 1440 ? `${Math.round(minutes / 60)}h` : `${Math.round(minutes / 1440)}j`;
  return {
    id: row.id,
    type: row.category === 'tax' || row.category === 'risk' ? ('warning' as const) : row.category === 'success' ? ('success' as const) : ('info' as const),
    title: row.title,
    message: row.body ?? '',
    time,
    read: row.status !== 'unread',
  };
}

function mapLoanRequest(row: any): CloudLoanRequest {
  const status = String(row.status ?? 'submitted').replace(/_/g, '-') as CloudLoanRequest['status'];
  return {
    id: row.id,
    amount: Number(row.amount ?? 0),
    duration: Number(row.duration_months ?? 0),
    totalRepayment: Number(row.total_repayment ?? row.amount ?? 0),
    approvalProbability: Number(row.approval_probability ?? 0),
    borrowingStrengthIndex: Number(row.borrowing_strength_index ?? 0),
    purpose: row.purpose ?? 'Financement entreprise',
    interestRate: Number(row.interest_rate ?? 0),
    processingFee: Number(row.processing_fee ?? 0),
    requestedAt: row.submitted_at ?? row.created_at ?? new Date().toISOString(),
    status,
    expectedReviewDuration: row.expected_review_duration ?? '24-48h',
    nextAction: row.metadata?.nextAction ?? 'Formalio prépare votre dossier pour revue partenaire.',
    notificationCount: 0,
  };
}

function toNumber(value: unknown) {
  const numeric = Number(value ?? 0);
  return Number.isFinite(numeric) ? numeric : 0;
}

function mapMetrics(raw: any): CloudFinancialMetrics {
  return {
    revenue: toNumber(raw?.revenue),
    expenses: toNumber(raw?.expenses),
    profit: toNumber(raw?.profit),
    balance: toNumber(raw?.balance ?? raw?.cashFlow ?? raw?.profit),
    cashFlow: toNumber(raw?.cashFlow),
    profitMargin: toNumber(raw?.profitMargin),
    taxCollected: toNumber(raw?.taxCollected),
    taxDeductible: toNumber(raw?.taxDeductible),
    taxDue: toNumber(raw?.taxDue),
    transactionCount: toNumber(raw?.transactionCount),
    revenueCount: toNumber(raw?.revenueCount),
    expenseCount: toNumber(raw?.expenseCount),
    growthRate: toNumber(raw?.growthRate),
    mosikaScore: Math.max(0, Math.min(1000, Math.round(toNumber(raw?.mosikaScore)))),
    rawMosikaScore: Math.max(0, Math.min(1000, Math.round(toNumber(raw?.rawMosikaScore ?? raw?.mosikaScore)))),
    scoreConfidence: Math.max(0, Math.min(100, Math.round(toNumber(raw?.scoreConfidence)))),
    scoreBand: typeof raw?.scoreBand === 'string' ? raw.scoreBand : undefined,
    modelVersion: typeof raw?.modelVersion === 'string' ? raw.modelVersion : undefined,
    financialHealth: Math.max(0, Math.min(100, Math.round(toNumber(raw?.financialHealth)))),
    complianceScore: Math.max(0, Math.min(100, Math.round(toNumber(raw?.complianceScore)))),
    documentCount: toNumber(raw?.documentCount),
    reportCount: toNumber(raw?.reportCount),
    loanApprovalProbability: Math.max(0, Math.min(100, Math.round(toNumber(raw?.loanApprovalProbability)))),
    riskAssessmentLevel: ['insufficient_data', 'low', 'moderate', 'elevated', 'high'].includes(raw?.riskAssessmentLevel) ? raw.riskAssessmentLevel : 'insufficient_data',
    financialRatios: raw?.financialRatios && typeof raw.financialRatios === 'object' ? raw.financialRatios : {},
    stabilityMetrics: raw?.stabilityMetrics && typeof raw.stabilityMetrics === 'object' ? raw.stabilityMetrics : {},
    riskIndicators: raw?.riskIndicators && typeof raw.riskIndicators === 'object' ? raw.riskIndicators : {},
    scoreWeights: raw?.scoreWeights && typeof raw.scoreWeights === 'object' ? raw.scoreWeights : {},
    scoreDrivers: raw?.scoreDrivers && typeof raw.scoreDrivers === 'object' ? raw.scoreDrivers : {},
    minimumDataRequired: Array.isArray(raw?.minimumDataRequired) ? raw.minimumDataRequired.map(String) : [],
    dailyCashflow: Array.isArray(raw?.dailyCashflow) ? raw.dailyCashflow.map((row: any) => ({
      date: String(row.date ?? ''),
      label: String(row.label ?? ''),
      income: toNumber(row.income),
      expense: toNumber(row.expense),
      net: toNumber(row.net),
    })) : [],
    categoryBreakdown: Array.isArray(raw?.categoryBreakdown) ? raw.categoryBreakdown.map((row: any) => ({
      name: String(row.name ?? 'Autres'),
      type: row.type === 'expense' ? 'expense' : 'income',
      amount: toNumber(row.amount),
      share: toNumber(row.share),
    })) : [],
    scoreFactors: raw?.scoreFactors && typeof raw.scoreFactors === 'object' ? raw.scoreFactors : {},
    emptyState: Boolean(raw?.emptyState),
  };
}

function mapSubscription(row: any): CloudSubscription {
  return {
    tier: row?.tier ?? 'free',
    status: row?.status ?? 'trialing',
    currentPeriodEnd: row?.current_period_end ?? undefined,
    seats: Number(row?.seats ?? 1),
  };
}

function emptyMetrics(): CloudFinancialMetrics {
  return mapMetrics({ emptyState: true, mosikaScore: 0, rawMosikaScore: 0, financialHealth: 0, scoreBand: 'insufficient_history', riskAssessmentLevel: 'insufficient_data' });
}

function mapProfile(profile: ProfileRow, company: CompanyRow): CloudBusinessProfile {
  const profileMetadata = profile.metadata ?? {};
  const companyMetadata = company.metadata ?? {};
  return {
    storeName: company.name,
    storeDescription: company.description ?? '',
    ownerFullName: profile.full_name || 'Utilisateur Formalio',
    phone: company.phone ?? profile.phone ?? '',
    email: company.email ?? profile.email ?? '',
    category: company.category ?? 'Commerce',
    address: company.address ?? [company.city, company.country].filter(Boolean).join(', '),
    avatarId: typeof profileMetadata.avatar_id === 'string' ? profileMetadata.avatar_id : 'avatar-01',
    profileImageUri: typeof profileMetadata.avatar_id === 'string' ? `avatar:${profileMetadata.avatar_id}` : 'avatar:avatar-01',
    coverTheme: typeof companyMetadata.cover_theme === 'string' ? companyMetadata.cover_theme : 'emerald',
    language: profile.language === 'en' ? 'en' : 'fr',
    kycStatus: toKycStatus(company.kyc_status),
    emailVerificationStatus: profile.email_verified_at ? 'verified' : profile.email_verification_status ?? 'unverified',
    emailVerifiedAt: profile.email_verified_at ?? undefined,
    emailVerificationSentAt: profile.email_verification_sent_at ?? undefined,
    emailVerificationNextAttemptAt: profile.email_verification_next_attempt_at ?? undefined,
  };
}

async function getCurrentSession() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw describeSupabaseError(error, 'Session Supabase indisponible.', 'auth.session');
  return data.session;
}

async function ensureProfile(user: SessionUser) {
  const existing = await readRequired<ProfileRow>(
    'profiles',
    supabase.from('profiles').select('*').eq('id', user.id).maybeSingle(),
    'Impossible de charger votre profil cloud.',
  );
  if (existing) return existing;

  const fullName = String(user.user_metadata?.full_name ?? user.email?.split('@')[0] ?? '').trim();
  const { data, error } = await supabase
    .from('profiles')
    .upsert({
      id: user.id,
      email: user.email ?? null,
      phone: user.phone ?? null,
      full_name: fullName,
      language: 'fr',
    }, { onConflict: 'id' })
    .select('*')
    .single();

  if (error) throw describeSupabaseError(error, 'Impossible de creer votre profil cloud.', 'profiles.ensure');
  return data as ProfileRow;
}

async function getPrimaryCompany(profile?: ProfileRow | null) {
  const data = await readRequired<{ role: string; companies: CompanyRow | CompanyRow[] | null }>(
    'company_memberships',
    supabase
    .from('company_memberships')
    .select('role, companies(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle(),
    'Impossible de charger votre entreprise.',
  );
  const companyValue = data?.companies ?? null;
  const company = (Array.isArray(companyValue) ? companyValue[0] ?? null : companyValue) as CompanyRow | null;
  if (company) return company;

  if (profile?.id) {
    const ownedCompany = await readOptional<CompanyRow | null>(
      'companies.owner_fallback',
      supabase
        .from('companies')
        .select('*')
        .eq('owner_user_id', profile.id)
        .order('created_at', { ascending: true })
        .limit(1)
        .maybeSingle(),
      null,
    );

    if (ownedCompany) {
      const { error: membershipError } = await supabase
        .from('company_memberships')
        .upsert({
          company_id: ownedCompany.id,
          user_id: profile.id,
          role: 'owner',
          status: 'active',
          accepted_at: new Date().toISOString(),
        }, { onConflict: 'company_id,user_id' });

      if (membershipError) logCloudSyncWarning('company_memberships.repair', membershipError);
      return ownedCompany;
    }
  }

  const ownerName = profile?.full_name?.trim();
  const { data: created, error: createError } = await supabase.rpc('create_company_with_owner', {
    p_name: ownerName ? `Entreprise de ${ownerName}` : 'Mon entreprise',
    p_category: 'Commerce',
    p_country: 'CM',
    p_currency: 'XAF',
  });
  if (createError) throw describeSupabaseError(createError, 'Impossible de creer votre espace entreprise.', 'create_company_with_owner');
  return created as CompanyRow;
}

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getProfileVerification(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('email_verification_status,email_verified_at,email_verification_next_attempt_at,email_verification_attempts')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw describeSupabaseError(error, 'Impossible de lire la verification email.', 'profiles.verification');
  return data as Pick<ProfileRow, 'email_verification_status' | 'email_verified_at' | 'email_verification_next_attempt_at' | 'email_verification_attempts'> | null;
}

async function updateProfileVerification(
  userId: string,
  patch: Partial<{
    email_verification_status: CloudEmailVerificationStatus;
    email_verified_at: string | null;
    email_verification_sent_at: string | null;
    email_verification_next_attempt_at: string | null;
    email_verification_attempts: number;
    email_verification_last_error: string | null;
  }>,
) {
  const { error } = await supabase
    .from('profiles')
    .update(patch)
    .eq('id', userId);
  if (error) throw describeSupabaseError(error, 'Impossible de mettre a jour la verification email.', 'profiles.verification.update');
}

async function requestProgressiveEmailVerification(email?: string, reason: 'signup' | 'manual' = 'manual'): Promise<CloudEmailVerificationResult> {
  if (!isSupabaseConfigured) return { status: 'skipped', message: 'Verification locale ignoree en mode prototype.' };

  const { data: userData, error: userError } = await supabase.auth.getUser();
  if (userError) throw userError;
  const user = userData.user;
  const targetEmail = (email || user?.email || '').trim().toLowerCase();
  if (!user?.id || !targetEmail) return { status: 'skipped', message: 'Session active requise pour envoyer la verification.' };

  const current = await getProfileVerification(user.id);
  if (current?.email_verified_at || current?.email_verification_status === 'verified') {
    return { status: 'verified', message: 'Email deja verifie.', sentAt: current.email_verified_at ?? undefined };
  }

  const nextAllowed = current?.email_verification_next_attempt_at ? new Date(current.email_verification_next_attempt_at).getTime() : 0;
  if (nextAllowed > Date.now()) {
    return {
      status: current?.email_verification_status === 'deferred' ? 'deferred' : 'queued',
      message: 'Verification deja programmee. Vous pourrez renvoyer le code dans quelques instants.',
      nextAttemptAt: current?.email_verification_next_attempt_at ?? undefined,
      retryable: true,
    };
  }

  let lastError: unknown = null;
  for (let attempt = 0; attempt < 2; attempt += 1) {
    const { error } = await supabase.auth.signInWithOtp({
      email: targetEmail,
      options: {
        shouldCreateUser: false,
        emailRedirectTo: 'formalio://auth/callback',
      },
    });

    if (!error) {
      const sentAt = new Date().toISOString();
      const nextAttemptAt = nextAttempt(1);
      await updateProfileVerification(user.id, {
        email_verification_status: 'sent',
        email_verification_sent_at: sentAt,
        email_verification_next_attempt_at: nextAttemptAt,
        email_verification_attempts: (current?.email_verification_attempts ?? 0) + 1,
        email_verification_last_error: null,
      });
      return {
        status: 'sent',
        message: reason === 'signup' ? 'Compte cree. Le code de verification arrive en arriere-plan.' : 'Code de verification envoye.',
        sentAt,
        nextAttemptAt,
        retryable: true,
      };
    }

    lastError = error;
    if (isRateLimitError(error)) break;
    if (!isTransientEmailError(error) || attempt === 1) break;
    await sleep(700);
  }

  const rateLimited = isRateLimitError(lastError);
  const status: CloudEmailVerificationStatus = rateLimited ? 'queued' : 'deferred';
  const nextAttemptAt = rateLimited ? nextAttempt(60) : nextAttempt(5);
  await updateProfileVerification(user.id, {
    email_verification_status: status,
    email_verification_next_attempt_at: nextAttemptAt,
    email_verification_attempts: (current?.email_verification_attempts ?? 0) + 1,
    email_verification_last_error: lastError instanceof Error ? lastError.message : String(lastError ?? 'Verification email differee.'),
  });

  return {
    status,
    message: rateLimited
      ? 'Compte cree. Le service email gratuit est limite, donc la verification est mise en file.'
      : 'Compte cree. La verification email sera reproposee automatiquement.',
    nextAttemptAt,
    retryable: true,
  };
}

export const formalioBackend = {
  isConfigured: isSupabaseConfigured,
  friendlyAuthMessage,
  describeError(error: unknown, source = 'cloud') {
    return describeSupabaseError(error, 'Synchronisation cloud indisponible.', source);
  },

  getRuntimeConfig() {
    return getSupabaseRuntimeConfig();
  },

  async getDiagnostics() {
    const runtime = getSupabaseRuntimeConfig();
    if (!isSupabaseConfigured) return { runtime, session: null, user: null };
    const session = await supabase.auth.getSession();
    const user = await supabase.auth.getUser();
    return {
      runtime,
      session: {
        hasSession: Boolean(session.data.session),
        error: session.error ? toSupabaseLikeError(session.error) : null,
      },
      user: {
        id: user.data.user?.id ?? null,
        email: user.data.user?.email ?? null,
        error: user.error ? toSupabaseLikeError(user.error) : null,
      },
    };
  },

  onAuthStateChange(callback: (event: string, session: Awaited<ReturnType<typeof getCurrentSession>>) => void) {
    if (!isSupabaseConfigured) return () => undefined;
    const { data } = supabase.auth.onAuthStateChange((event, session) => callback(event, session));
    return () => data.subscription.unsubscribe();
  },

  async getCurrentSession() {
    return getCurrentSession();
  },

  async signInWithEmailOrPhone(identifier: string, password: string) {
    if (!isSupabaseConfigured) return null;
    const trimmed = identifier.trim();
    const payload = trimmed.includes('@')
      ? { email: trimmed.toLowerCase(), password }
      : { phone: normalizePhone(trimmed), password };
    const { data, error } = await supabase.auth.signInWithPassword(payload);
    if (error) throw new Error(friendlyAuthMessage(error, 'Connexion impossible.'));
    return data;
  },

  async signUp(payload: { email: string; password: string; fullName: string; phone: string }) {
    if (!isSupabaseConfigured) return null;
    const email = payload.email.trim().toLowerCase();
    const { data, error } = await supabase.auth.signUp({
      email,
      password: payload.password,
      options: {
        emailRedirectTo: 'formalio://auth/callback',
        data: {
          full_name: payload.fullName.trim(),
          phone: normalizePhone(payload.phone),
          language: 'fr',
          app_email_verification_status: 'unverified',
        },
      },
    });
    if (error && isRateLimitError(error)) {
      const { data: recovered, error: recoveryError } = await supabase.auth.signInWithPassword({ email, password: payload.password });
      if (!recoveryError && recovered.session?.user?.id) {
        const nextAttemptAt = nextAttempt(60);
        await updateProfileVerification(recovered.session.user.id, {
          email_verification_status: 'queued',
          email_verification_next_attempt_at: nextAttemptAt,
          email_verification_last_error: error.message,
        });
        return {
          ...recovered,
          verification: {
            status: 'queued',
            message: 'Compte cree. Le service email gratuit est limite, donc la verification est mise en file.',
            nextAttemptAt,
            retryable: true,
          } as CloudEmailVerificationResult,
        };
      }
    }
    if (error) throw new Error(friendlyAuthMessage(error, 'Creation impossible.'));
    const verification = data.session || data.user
      ? await requestProgressiveEmailVerification(email, 'signup').catch((verificationError) => ({
        status: isRateLimitError(verificationError) ? 'queued' : 'deferred',
        message: friendlyAuthMessage(verificationError, 'Verification email differee.'),
        retryable: true,
      } as CloudEmailVerificationResult))
      : { status: 'skipped', message: 'Compte cree. Verification a terminer depuis le profil.', retryable: true } as CloudEmailVerificationResult;
    return { ...data, verification };
  },

  async resendEmailSignup(email: string) {
    return requestProgressiveEmailVerification(email, 'manual');
  },

  async verifyEmailSignupOtp(email: string, token: string) {
    return formalioBackend.verifyProgressiveEmailOtp(email, token);
  },

  async requestEmailVerification(email?: string) {
    return requestProgressiveEmailVerification(email, 'manual');
  },

  async verifyProgressiveEmailOtp(email: string, token: string) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'email',
    });
    if (error) throw new Error(friendlyAuthMessage(error, 'Code invalide ou expire.'));
    const userId = data.user?.id;
    if (userId) {
      const verifiedAt = new Date().toISOString();
      await updateProfileVerification(userId, {
        email_verification_status: 'verified',
        email_verified_at: verifiedAt,
        email_verification_next_attempt_at: null,
        email_verification_last_error: null,
      });
    }
    return data;
  },

  async signInWithPhoneOtp(phone: string, shouldCreateUser = false) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.signInWithOtp({
      phone: normalizePhone(phone),
      options: { shouldCreateUser, channel: 'sms' },
    });
    if (error) throw error;
    return data;
  },

  async resendPhoneOtp(phone: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.resend({
      type: 'sms',
      phone: normalizePhone(phone),
    });
    if (error) throw error;
  },

  async verifyPhoneOtp(phone: string, token: string) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.verifyOtp({
      phone: normalizePhone(phone),
      token,
      type: 'sms',
    });
    if (error) throw error;
    return data;
  },

  async verifyRecoveryOtp(email: string, token: string) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.verifyOtp({
      email: email.trim().toLowerCase(),
      token,
      type: 'recovery',
    });
    if (error) throw error;
    return data;
  },

  async updatePassword(password: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.auth.updateUser({ password });
    if (error) throw error;
  },

  async signOut() {
    if (!isSupabaseConfigured) return;
    await supabase.auth.signOut();
  },

  async resetPassword(identifier: string) {
    if (!isSupabaseConfigured) return;
    const email = identifier.trim().toLowerCase();
    if (!email.includes('@')) throw new Error('Password reset by SMS requires a configured SMS provider. Use email for now.');
    const { error } = await supabase.auth.resetPasswordForEmail(email, {
      redirectTo: 'formalio://reset-password',
    });
    if (error) throw new Error(friendlyAuthMessage(error, "Impossible d'envoyer le code."));
  },

  async bootstrap(): Promise<BootstrapData | null> {
    const session = await getCurrentSession();
    if (!session?.user) return null;

    const profileRow = await ensureProfile(session.user as SessionUser);
    const company = await getPrimaryCompany(profileRow);

    const companyId = company.id;
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const periodEnd = now.toISOString().slice(0, 10);
    const [transactionsData, stockItemsData, notificationsData, loansData, subscriptionData, metricsData] = await Promise.all([
      readOptional<any[]>(
        'transactions',
        supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('occurred_at', { ascending: false })
        .limit(100),
        [],
      ),
      readRequired<StockItemRow[]>(
        'stock_items',
        supabase
        .from('stock_items')
        .select('*')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('updated_at', { ascending: false }),
        'Impossible de charger le stock cloud.',
      ),
      readOptional<any[]>(
        'notifications',
        supabase
        .from('notifications')
        .select('*')
        .or(`company_id.eq.${companyId},user_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .limit(50),
        [],
      ),
      readOptional<any[]>(
        'loan_requests',
        supabase
        .from('loan_requests')
        .select('*')
        .eq('company_id', companyId)
        .order('submitted_at', { ascending: false })
        .limit(20),
        [],
      ),
      readOptional<any | null>(
        'subscriptions',
        supabase
        .from('subscriptions')
        .select('*')
        .eq('company_id', companyId)
        .maybeSingle(),
        null,
      ),
      readOptional<any>(
        'dashboard_metrics',
        supabase.rpc('dashboard_metrics', {
          p_company_id: companyId,
          p_period_start: periodStart,
          p_period_end: periodEnd,
        }),
        emptyMetrics(),
      ),
    ]);

    return {
      companyId,
      profile: mapProfile(profileRow, company),
      transactions: (transactionsData ?? []).map(mapTransaction),
      stockItems: (stockItemsData ?? []).map(mapStockItem),
      notifications: (notificationsData ?? []).map((row) => mapNotification(row as NotificationRow)),
      loanRequests: (loansData ?? []).map(mapLoanRequest),
      subscription: mapSubscription(subscriptionData),
      metrics: mapMetrics(metricsData ?? emptyMetrics()),
    };
  },

  async upsertProfile(companyId: string, profile: CloudBusinessProfile) {
    if (!isSupabaseConfigured) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw describeSupabaseError(userError, 'Session utilisateur indisponible.', 'auth.user');
    const userId = userData.user?.id;
    if (!userId) throw new Error('Not authenticated.');
    const [existingProfile, existingCompany] = await Promise.all([
      supabase.from('profiles').select('metadata').eq('id', userId).maybeSingle(),
      supabase.from('companies').select('metadata').eq('id', companyId).maybeSingle(),
    ]);
    const profileMetadata = (existingProfile.data?.metadata && typeof existingProfile.data.metadata === 'object' ? existingProfile.data.metadata : {}) as Record<string, unknown>;
    const companyMetadata = (existingCompany.data?.metadata && typeof existingCompany.data.metadata === 'object' ? existingCompany.data.metadata : {}) as Record<string, unknown>;

    const [profileUpdate, companyUpdate] = await Promise.all([
      supabase
        .from('profiles')
        .update({
          full_name: profile.ownerFullName,
          email: profile.email,
          phone: profile.phone,
          language: profile.language,
          metadata: { ...profileMetadata, avatar_id: profile.avatarId ?? 'avatar-01' },
          email_verification_status: profile.emailVerificationStatus,
          email_verified_at: profile.emailVerificationStatus === 'verified' ? profile.emailVerifiedAt ?? new Date().toISOString() : null,
          email_verification_sent_at: profile.emailVerificationSentAt ?? null,
          email_verification_next_attempt_at: profile.emailVerificationNextAttemptAt ?? null,
        })
        .eq('id', userId),
      supabase
        .from('companies')
        .update({
          name: profile.storeName,
          description: profile.storeDescription,
          category: profile.category,
          phone: profile.phone,
          email: profile.email,
          address: profile.address,
          kyc_status: fromKycStatus(profile.kycStatus),
          metadata: { ...companyMetadata, cover_theme: profile.coverTheme ?? 'emerald' },
        })
        .eq('id', companyId),
    ]);

    if (profileUpdate.error) throw describeSupabaseError(profileUpdate.error, 'Impossible de sauvegarder le profil utilisateur.', 'profiles.update');
    if (companyUpdate.error) throw describeSupabaseError(companyUpdate.error, 'Impossible de sauvegarder le profil entreprise.', 'companies.update');
  },

  async createTransaction(companyId: string, transaction: Omit<PrototypeTransaction, 'id' | 'date' | 'status'>) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('transactions')
      .insert({
        company_id: companyId,
        type: transaction.type,
        amount: transaction.amount,
        description: transaction.description,
        payment_method: transaction.method,
        metadata: { category: transaction.category },
      })
      .select('*, categories(name)')
      .single();
    if (error) throw describeSupabaseError(error, 'Impossible de synchroniser la transaction.', 'transactions.insert');
    return mapTransaction(data);
  },

  async getStockItems(companyId: string) {
    if (!isSupabaseConfigured) return [];
    const { data, error } = await supabase
      .from('stock_items')
      .select('*')
      .eq('company_id', companyId)
      .is('deleted_at', null)
      .order('updated_at', { ascending: false });
    if (error) throw describeSupabaseError(error, 'Impossible de synchroniser le stock.', 'stock_items.select');
    return (data ?? []).map((row) => mapStockItem(row as StockItemRow));
  },

  async upsertStockItem(companyId: string, item: StockItem) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('stock_items')
      .upsert(stockItemPayload(companyId, item))
      .select()
      .single();
    if (error) throw describeSupabaseError(error, 'Impossible de sauvegarder le stock dans le cloud.', 'stock_items.upsert');
    return mapStockItem(data as StockItemRow);
  },

  async deleteStockItem(companyId: string, itemId: string) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase
      .from('stock_items')
      .update({ deleted_at: new Date().toISOString() })
      .eq('company_id', companyId)
      .eq('id', itemId);
    if (error) throw describeSupabaseError(error, 'Impossible de supprimer le stock dans le cloud.', 'stock_items.delete');
  },

  async getFinancialMetrics(companyId: string, periodStart?: string, periodEnd?: string) {
    if (!isSupabaseConfigured) return emptyMetrics();
    const now = new Date();
    const start = periodStart ?? new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const end = periodEnd ?? now.toISOString().slice(0, 10);
    const { data, error } = await supabase.rpc('dashboard_metrics', {
      p_company_id: companyId,
      p_period_start: start,
      p_period_end: end,
    });
    if (error) throw describeSupabaseError(error, 'Impossible de calculer les indicateurs cloud.', 'dashboard_metrics');
    return mapMetrics(data ?? emptyMetrics());
  },

  subscribeToCompanyData(companyId: string, onChange: () => void) {
    if (!isSupabaseConfigured) return () => undefined;
    const channel = supabase
      .channel(`company-live-${companyId}`)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transactions', filter: `company_id=eq.${companyId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'stock_items', filter: `company_id=eq.${companyId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'reports', filter: `company_id=eq.${companyId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'loan_requests', filter: `company_id=eq.${companyId}` }, onChange)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'documents', filter: `company_id=eq.${companyId}` }, onChange)
      .subscribe();
    return () => {
      void supabase.removeChannel(channel);
    };
  },

  async submitLoanRequest(companyId: string, summary: Omit<CloudLoanRequest, 'id' | 'requestedAt' | 'status' | 'expectedReviewDuration' | 'nextAction' | 'notificationCount'>) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase
      .from('loan_requests')
      .insert({
        company_id: companyId,
        amount: summary.amount,
        duration_months: summary.duration,
        purpose: summary.purpose,
        interest_rate: summary.interestRate,
        processing_fee: summary.processingFee,
        total_repayment: summary.totalRepayment,
        approval_probability: summary.approvalProbability,
        borrowing_strength_index: summary.borrowingStrengthIndex,
        expected_review_duration: summary.approvalProbability >= 88 ? '24-48h' : '3-5 jours',
      })
      .select()
      .single();
    if (error) throw describeSupabaseError(error, 'Impossible de synchroniser la demande de pret.', 'loan_requests.insert');
    return mapLoanRequest(data);
  },

  async updateKycStatus(companyId: string, status: CloudKycStatus) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('companies').update({ kyc_status: fromKycStatus(status) }).eq('id', companyId);
    if (error) throw describeSupabaseError(error, 'Impossible de mettre a jour le statut KYC.', 'companies.kyc.update');
  },

  async generateReport(
    companyId: string,
    type: 'bilan' | 'resultat' | 'cashflow' | 'tva' | 'loan_readiness' | 'dashboard_summary',
    periodStart: string,
    periodEnd: string,
    format: 'pdf' | 'xlsx' | 'csv' | 'json' = 'pdf',
  ) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.functions.invoke('reports-generate', {
      body: { companyId, type, periodStart, periodEnd, format },
    });
    if (error) throw describeSupabaseError(error, 'Impossible de generer le rapport.', 'reports-generate');
    const payload = (data as { data?: unknown })?.data ?? data;
    return payload as { report: unknown; export: CloudReportExport };
  },

  async transcribeVoiceTransaction(companyId: string, payload: { audioBase64: string; mimeType?: string; fileName?: string; language?: string }) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.functions.invoke('voice-transcribe', {
      body: { companyId, ...payload },
    });
    if (error) throw describeSupabaseError(error, 'Impossible de transcrire la note vocale.', 'voice-transcribe');
    const response = (data as { data?: unknown })?.data ?? data;
    return response as CloudVoiceTransactionResult;
  },

  async scanDocument(companyId: string, payload: { imageBase64: string; mimeType?: string; imagePath?: string; fileName?: string; sourcePlatform?: string; source?: string; merchantHint?: string; autoCreateTransaction?: boolean }) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.functions.invoke('ocr-ticket', {
      body: { companyId, ...payload },
    });
    if (error) throw describeSupabaseError(error, 'Impossible de traiter le document OCR.', 'ocr-ticket');
    const response = (data as { data?: unknown })?.data ?? data;
    return response as { extracted: CloudOcrExtraction; transaction: unknown | null };
  },

  async chat(companyId: string, message: string, conversationId?: string, language: SupportedLanguage = 'fr') {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: { companyId, conversationId, message, language },
    });
    if (error) throw error;
    const payload = (data as { data?: unknown })?.data ?? data;
    return payload as { conversationId: string; reply: string; quickActions: string[] };
  },
};
