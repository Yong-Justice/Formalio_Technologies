import { Platform } from 'react-native';
import type { Session } from '@supabase/supabase-js';
import { getDatabase, initializeDatabase } from '@/database';
import { getOutboxItemCount, upsertCloudRecordLocally } from '@/database/repositories';
import type { CloudBusinessProfile, CloudSubscription } from '@/services/api/formalioBackend';
import { refreshTokenStorage, secureKeys, secureStorage } from '@/services/storage/secureStorage';
import { getJson, setJson, storageKeys } from '@/services/storage/mmkv';
import type { User } from '@/types/domain';
import type { SupportedLanguage } from '@/i18n';

const DEFAULT_PERMISSIONS = [
  'dashboard:read',
  'transactions:write',
  'stock:write',
  'reports:read',
  'sync:write',
];

export type OfflineAuthSession = {
  active: boolean;
  provider: 'supabase';
  userId: string;
  companyId: string;
  role: string;
  permissions: string[];
  createdAt: string;
  lastValidatedAt: string;
  expiresAt?: string | null;
};

export type OfflineAuthSnapshot = {
  user: User;
  profile: CloudBusinessProfile;
  companyId: string;
  role: string;
  permissions: string[];
  subscription?: CloudSubscription;
  savedAt: string;
  lastValidatedAt: string;
};

export type TrustedOfflineSession = {
  session: OfflineAuthSession;
  snapshot: OfflineAuthSnapshot;
};

function nowIso() {
  return new Date().toISOString();
}

function hasTrustedProfile(snapshot: OfflineAuthSnapshot | null) {
  return Boolean(
    snapshot?.user?.id &&
      snapshot.companyId &&
      snapshot.profile &&
      (snapshot.profile.storeName || snapshot.profile.ownerFullName || snapshot.profile.email || snapshot.profile.phone),
  );
}

async function hasTrustedProfileInLocalDatabase(snapshot: OfflineAuthSnapshot) {
  if (Platform.OS === 'web') return true;

  try {
    await initializeDatabase();
    const db = await getDatabase();
    const row = await db.getFirstAsync<{ id: string }>(
      'SELECT id FROM business_profiles WHERE id = ? AND user_id = ? LIMIT 1',
      snapshot.companyId,
      snapshot.user.id,
    );
    return Boolean(row?.id);
  } catch {
    return false;
  }
}

function userFromCloud(session: Session | null, profile: CloudBusinessProfile, companyId: string, role: string, plan?: string): User {
  return {
    id: session?.user.id ?? '',
    phone: profile.phone ?? session?.user.phone ?? '',
    email: profile.email ?? session?.user.email ?? undefined,
    fullName: profile.ownerFullName || session?.user.email?.split('@')[0] || 'Utilisateur Formalio',
    language: (profile.language === 'en' ? 'en' : 'fr') as SupportedLanguage,
    onboardingCompleted: true,
    biometricEnabled: false,
    businessId: companyId,
    companyId,
    role,
    plan,
  } as User;
}

async function saveProfileToLocalDatabase(snapshot: OfflineAuthSnapshot) {
  if (Platform.OS === 'web') return;

  await initializeDatabase();
  const timestamp = Date.now();
  const payload = {
    id: snapshot.companyId,
    user_id: snapshot.user.id,
    company_id: snapshot.companyId,
    business_name: snapshot.profile.storeName,
    owner_name: snapshot.profile.ownerFullName,
    business_type: snapshot.profile.category,
    sector: snapshot.profile.category,
    city: snapshot.profile.address,
    phone_number: snapshot.profile.phone,
    preferred_language: snapshot.profile.language,
    subscription_plan: snapshot.subscription?.tier ?? 'free',
    onboarding_completed: true,
    created_at: timestamp,
    updated_at: timestamp,
  };

  await upsertCloudRecordLocally('business_profiles', payload);
}

export async function saveTrustedOfflineSession(params: {
  session: Session | null;
  companyId: string;
  profile: CloudBusinessProfile;
  subscription?: CloudSubscription;
  role?: string;
  permissions?: string[];
}) {
  if (!params.session?.user?.id || !params.companyId || !params.profile) return null;

  const timestamp = nowIso();
  const permissions = params.permissions ?? DEFAULT_PERMISSIONS;
  const role = params.role ?? 'owner';
  const user = userFromCloud(params.session, params.profile, params.companyId, role, params.subscription?.tier);
  const offlineSession: OfflineAuthSession = {
    active: true,
    provider: 'supabase',
    userId: params.session.user.id,
    companyId: params.companyId,
    role,
    permissions,
    createdAt: timestamp,
    lastValidatedAt: timestamp,
    expiresAt: params.session.expires_at ? new Date(params.session.expires_at * 1000).toISOString() : null,
  };
  const snapshot: OfflineAuthSnapshot = {
    user,
    profile: params.profile,
    companyId: params.companyId,
    role,
    permissions,
    subscription: params.subscription,
    savedAt: timestamp,
    lastValidatedAt: timestamp,
  };

  await secureStorage.set(secureKeys.offlineAuthSession, JSON.stringify(offlineSession));
  await secureStorage.set(secureKeys.accessToken, params.session.access_token);
  await refreshTokenStorage.set(params.session.refresh_token);
  await secureStorage.set(secureKeys.userId, params.session.user.id);
  setJson(storageKeys.authUser, user);
  setJson(storageKeys.offlineAuthSnapshot, snapshot);
  await saveProfileToLocalDatabase(snapshot).catch(() => undefined);
  return { session: offlineSession, snapshot };
}

export async function loadTrustedOfflineSession(): Promise<TrustedOfflineSession | null> {
  const rawSession = await secureStorage.get(secureKeys.offlineAuthSession);
  if (!rawSession) return null;

  try {
    const session = JSON.parse(rawSession) as OfflineAuthSession;
    const snapshot = getJson<OfflineAuthSnapshot | null>(storageKeys.offlineAuthSnapshot, null);
    if (!session.active || !snapshot || session.userId !== snapshot.user.id || session.companyId !== snapshot.companyId) {
      return null;
    }
    if (!hasTrustedProfile(snapshot)) return null;
    if (!(await hasTrustedProfileInLocalDatabase(snapshot))) return null;
    return { session, snapshot };
  } catch {
    return null;
  }
}

export async function updateTrustedOfflineProfile(params: {
  profile: CloudBusinessProfile;
  subscription?: CloudSubscription;
  lastValidatedAt?: string;
}) {
  const trusted = await loadTrustedOfflineSession();
  if (!trusted) return null;

  const timestamp = params.lastValidatedAt ?? nowIso();
  const snapshot: OfflineAuthSnapshot = {
    ...trusted.snapshot,
    profile: params.profile,
    user: {
      ...trusted.snapshot.user,
      email: params.profile.email ?? trusted.snapshot.user.email,
      phone: params.profile.phone ?? trusted.snapshot.user.phone,
      fullName: params.profile.ownerFullName || trusted.snapshot.user.fullName,
      language: params.profile.language,
      businessId: trusted.snapshot.companyId,
      companyId: trusted.snapshot.companyId,
      role: trusted.snapshot.role,
      plan: params.subscription?.tier ?? trusted.snapshot.subscription?.tier,
    } as User,
    subscription: params.subscription ?? trusted.snapshot.subscription,
    savedAt: timestamp,
    lastValidatedAt: timestamp,
  };
  const session: OfflineAuthSession = {
    ...trusted.session,
    role: snapshot.role,
    permissions: snapshot.permissions,
    lastValidatedAt: timestamp,
  };

  await secureStorage.set(secureKeys.offlineAuthSession, JSON.stringify(session));
  setJson(storageKeys.authUser, snapshot.user);
  setJson(storageKeys.offlineAuthSnapshot, snapshot);
  await saveProfileToLocalDatabase(snapshot).catch(() => undefined);
  return { session, snapshot };
}

export async function clearTrustedOfflineSession() {
  await secureStorage.remove(secureKeys.offlineAuthSession);
  await secureStorage.remove(secureKeys.accessToken);
  await refreshTokenStorage.remove();
  await secureStorage.remove(secureKeys.userId);
  setJson<OfflineAuthSnapshot | null>(storageKeys.offlineAuthSnapshot, null);
  setJson<User | null>(storageKeys.authUser, null);
}

export async function getTrustedPendingSyncCount(userId?: string | null) {
  if (!userId || Platform.OS === 'web') return 0;
  try {
    await initializeDatabase();
    return getOutboxItemCount(userId);
  } catch {
    return 0;
  }
}
