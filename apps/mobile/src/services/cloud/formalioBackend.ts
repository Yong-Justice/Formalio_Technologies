import { supabase, isSupabaseConfigured } from '@/services/supabase/client';
import type { Transaction as PrototypeTransaction } from '@/prototype/demoData';

export type CloudKycStatus = 'pending' | 'under-review' | 'approved' | 'rejected';

export type CloudBusinessProfile = {
  storeName: string;
  storeDescription: string;
  ownerFullName: string;
  phone: string;
  email: string;
  category: string;
  address: string;
  profileImageUri?: string;
  bannerImageUri?: string;
  kycStatus: CloudKycStatus;
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

type NotificationRow = {
  id: string;
  title: string;
  body: string | null;
  category: string;
  status: 'unread' | 'read' | 'archived';
  created_at: string;
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
};

type ProfileRow = {
  id: string;
  email: string | null;
  phone: string | null;
  full_name: string;
};

type BootstrapData = {
  companyId: string;
  profile: CloudBusinessProfile;
  transactions: PrototypeTransaction[];
  notifications: { id: string; type: 'success' | 'warning' | 'info'; title: string; message: string; time: string; read: boolean }[];
  loanRequests: CloudLoanRequest[];
};

function normalizePhone(phone: string) {
  const digits = phone.replace(/\D/g, '');
  if (digits.length === 9) return `+237${digits}`;
  if (digits.startsWith('237')) return `+${digits}`;
  return phone.trim();
}

function toKycStatus(status: CompanyRow['kyc_status']): CloudKycStatus {
  if (status === 'under_review') return 'under-review';
  return status;
}

function fromKycStatus(status: CloudKycStatus) {
  return status === 'under-review' ? 'under_review' : status;
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

function mapProfile(profile: ProfileRow, company: CompanyRow): CloudBusinessProfile {
  return {
    storeName: company.name,
    storeDescription: company.description ?? '',
    ownerFullName: profile.full_name || 'Utilisateur Formalio',
    phone: company.phone ?? profile.phone ?? '',
    email: company.email ?? profile.email ?? '',
    category: company.category ?? 'Commerce',
    address: company.address ?? [company.city, company.country].filter(Boolean).join(', '),
    kycStatus: toKycStatus(company.kyc_status),
  };
}

async function getCurrentSession() {
  if (!isSupabaseConfigured) return null;
  const { data, error } = await supabase.auth.getSession();
  if (error) throw error;
  return data.session;
}

async function getPrimaryCompany() {
  const { data, error } = await supabase
    .from('company_memberships')
    .select('role, companies(*)')
    .eq('status', 'active')
    .order('created_at', { ascending: true })
    .limit(1)
    .maybeSingle();

  if (error) throw error;
  const company = (data?.companies ?? null) as CompanyRow | null;
  if (company) return company;

  const { data: created, error: createError } = await supabase.rpc('create_company_with_owner', {
    p_name: 'Boutique Elegance',
    p_category: 'Commerce',
    p_country: 'CM',
    p_currency: 'XAF',
  });
  if (createError) throw createError;
  return created as CompanyRow;
}

export const formalioBackend = {
  isConfigured: isSupabaseConfigured,

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
    if (error) throw error;
    return data;
  },

  async signUp(payload: { email: string; password: string; fullName: string; phone: string }) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.auth.signUp({
      email: payload.email.trim().toLowerCase(),
      password: payload.password,
      options: {
        data: {
          full_name: payload.fullName.trim(),
          phone: normalizePhone(payload.phone),
          language: 'fr',
        },
      },
    });
    if (error) throw error;
    return data;
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
    if (error) throw error;
  },

  async bootstrap(): Promise<BootstrapData | null> {
    const session = await getCurrentSession();
    if (!session?.user) return null;

    const [profileResponse, company] = await Promise.all([
      supabase.from('profiles').select('*').eq('id', session.user.id).maybeSingle(),
      getPrimaryCompany(),
    ]);
    if (profileResponse.error) throw profileResponse.error;

    const companyId = company.id;
    const [transactionsResponse, notificationsResponse, loansResponse] = await Promise.all([
      supabase
        .from('transactions')
        .select('*, categories(name)')
        .eq('company_id', companyId)
        .is('deleted_at', null)
        .order('occurred_at', { ascending: false })
        .limit(100),
      supabase
        .from('notifications')
        .select('*')
        .or(`company_id.eq.${companyId},user_id.eq.${session.user.id}`)
        .order('created_at', { ascending: false })
        .limit(50),
      supabase
        .from('loan_requests')
        .select('*')
        .eq('company_id', companyId)
        .order('submitted_at', { ascending: false })
        .limit(20),
    ]);

    if (transactionsResponse.error) throw transactionsResponse.error;
    if (notificationsResponse.error) throw notificationsResponse.error;
    if (loansResponse.error) throw loansResponse.error;

    return {
      companyId,
      profile: mapProfile((profileResponse.data ?? { id: session.user.id, email: session.user.email ?? '', phone: session.user.phone ?? '', full_name: '' }) as ProfileRow, company),
      transactions: (transactionsResponse.data ?? []).map(mapTransaction),
      notifications: (notificationsResponse.data ?? []).map((row) => mapNotification(row as NotificationRow)),
      loanRequests: (loansResponse.data ?? []).map(mapLoanRequest),
    };
  },

  async upsertProfile(companyId: string, profile: CloudBusinessProfile) {
    if (!isSupabaseConfigured) return;
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) throw userError;
    const userId = userData.user?.id;
    if (!userId) throw new Error('Not authenticated.');

    const [profileUpdate, companyUpdate] = await Promise.all([
      supabase
        .from('profiles')
        .update({ full_name: profile.ownerFullName, email: profile.email, phone: profile.phone })
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
        })
        .eq('id', companyId),
    ]);

    if (profileUpdate.error) throw profileUpdate.error;
    if (companyUpdate.error) throw companyUpdate.error;
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
    if (error) throw error;
    return mapTransaction(data);
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
    if (error) throw error;
    return mapLoanRequest(data);
  },

  async updateKycStatus(companyId: string, status: CloudKycStatus) {
    if (!isSupabaseConfigured) return;
    const { error } = await supabase.from('companies').update({ kyc_status: fromKycStatus(status) }).eq('id', companyId);
    if (error) throw error;
  },

  async generateReport(companyId: string, type: 'bilan' | 'resultat' | 'cashflow' | 'tva', periodStart: string, periodEnd: string) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.functions.invoke('reports-generate', {
      body: { companyId, type, periodStart, periodEnd },
    });
    if (error) throw error;
    return data;
  },

  async chat(companyId: string, message: string, conversationId?: string) {
    if (!isSupabaseConfigured) return null;
    const { data, error } = await supabase.functions.invoke('ai-assistant', {
      body: { companyId, conversationId, message, language: 'fr' },
    });
    if (error) throw error;
    return data as { conversationId: string; reply: string; quickActions: string[] };
  },
};
