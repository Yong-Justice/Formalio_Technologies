import { supabase, isSupabaseConfigured } from '@/services/supabase/client';
import type { Transaction as PrototypeTransaction } from '@/prototype/demoData';

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
  bannerImageUri?: string;
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
  email_verification_status?: CloudEmailVerificationStatus | null;
  email_verified_at?: string | null;
  email_verification_sent_at?: string | null;
  email_verification_next_attempt_at?: string | null;
  email_verification_attempts?: number | null;
  email_verification_last_error?: string | null;
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
    emailVerificationStatus: profile.email_verified_at ? 'verified' : profile.email_verification_status ?? 'unverified',
    emailVerifiedAt: profile.email_verified_at ?? undefined,
    emailVerificationSentAt: profile.email_verification_sent_at ?? undefined,
    emailVerificationNextAttemptAt: profile.email_verification_next_attempt_at ?? undefined,
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

function sleep(ms: number) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function getProfileVerification(userId: string) {
  const { data, error } = await supabase
    .from('profiles')
    .select('email_verification_status,email_verified_at,email_verification_next_attempt_at,email_verification_attempts')
    .eq('id', userId)
    .maybeSingle();
  if (error) throw error;
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
  if (error) throw error;
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
        .update({
          full_name: profile.ownerFullName,
          email: profile.email,
          phone: profile.phone,
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
