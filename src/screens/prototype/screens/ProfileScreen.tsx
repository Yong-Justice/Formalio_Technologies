import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Image, Pressable, ScrollView, StyleSheet, View } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as ImagePicker from 'expo-image-picker';
import Animated, { FadeIn } from 'react-native-reanimated';
import {
  AlertTriangle,
  Award,
  Banknote,
  Calculator,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  FileText,
  Gift,
  HelpCircle,
  LogOut,
  Mail,
  MapPin,
  Package,
  Pencil,
  Phone,
  RefreshCw,
  Settings,
  Shield,
  Smartphone,
  Sparkles,
  User,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { formalioBackend, type CloudFinancialMetrics, type CloudSubscription } from '@/services/api/formalioBackend';
import { translate, type SupportedLanguage } from '@/i18n';
import { styles } from '../styles';
import { c, isAndroidNative } from '../theme';
import { calculateProfileCompletion } from '../domain/financialMetrics';
import type { BusinessProfile, EmailVerificationStatus, KycDraft, KycStatus } from '../domain/defaults';
import type { Screen, ShellProps } from '../contracts';
import {
  BuiltInAvatar,
  Card,
  Field,
  Grid,
  HeaderUtilityActions,
  Icon,
  InfoLine,
  Pill,
  PrimaryButton,
  Row,
  ScreenWrapper,
  Tap,
  Txt,
  ValueBar,
  coverThemes,
  getCoverTheme,
  getProfileAvatar,
  profileAvatars,
  useToast,
} from '../shared';

export function ProfileScreen({
  shellProps,
  profile,
  setProfile,
  navigate,
  logout,
  metrics,
  subscription,
  onSaveProfile,
  onKycStatusChange,
}: {
  shellProps: ShellProps;
  profile: BusinessProfile;
  setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  navigate: (s: Screen) => void;
  logout: () => void;
  metrics: CloudFinancialMetrics;
  subscription: CloudSubscription;
  onSaveProfile?: (profile: BusinessProfile) => Promise<void>;
  onKycStatusChange?: (status: KycStatus) => Promise<void>;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BusinessProfile>(profile);
  const visibleProfile = editing ? form : profile;
  const language = visibleProfile.language ?? 'fr';
  const t = useCallback((key: string, fallback?: string) => translate(language, key, fallback), [language]);
  const coverTheme = getCoverTheme(visibleProfile.coverTheme);
  const profileErrors = useMemo(() => validateBusinessProfile(form), [form]);
  const completion = calculateProfileCompletion(visibleProfile);
  const categories = ['Commerce', 'Restauration', 'Services', 'Transport', 'Agriculture', 'Artisanat'];

  useEffect(() => {
    if (!editing) setForm(profile);
  }, [editing, profile]);

  const updateForm = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => {
    if (key === 'email') {
      const nextEmail = String(value).trim().toLowerCase();
      setForm((current) => ({
        ...current,
        email: nextEmail,
        ...(nextEmail !== profile.email.trim().toLowerCase()
          ? {
              emailVerificationStatus: 'unverified' as EmailVerificationStatus,
              emailVerifiedAt: undefined,
              emailVerificationSentAt: undefined,
              emailVerificationNextAttemptAt: undefined,
            }
          : {}),
      }));
      return;
    }
    setForm((current) => ({ ...current, [key]: value }));
  };

  const saveProfile = () => {
    const errors = validateBusinessProfile(form);
    if (Object.keys(errors).length > 0) {
      showToast({ type: 'error', title: t('profile.incomplete'), message: t('profile.incompleteMessage') });
      return;
    }
    setSaving(true);
    void (async () => {
      try {
        await onSaveProfile?.(form);
        setProfile(form);
        setEditing(false);
        showToast({ type: 'success', title: t('profile.saveSuccess'), message: `${t('profile.completion')}: ${calculateProfileCompletion(form)}%` });
      } catch (error) {
        showToast({ type: 'error', title: t('profile.saveError'), message: error instanceof Error ? error.message : t('common.retry') });
        return;
      } finally {
        setSaving(false);
      }
    })();
  };

  const cancelProfileEdit = () => {
    setForm(profile);
    setEditing(false);
  };

  return (
    <ScreenWrapper {...shellProps} noPadding>
      <View style={styles.profileHero}>
        <LinearGradient colors={coverTheme.colors} style={StyleSheet.absoluteFillObject} />
        <View style={styles.profileTopActions}>
          <HeaderUtilityActions offlineMode={shellProps.offlineMode} setOfflineMode={shellProps.setOfflineMode} notifications={shellProps.notifications} navigate={shellProps.navigate} />
        </View>
        <Row style={{ gap: 16 }}>
          <Tap disabled={!editing} style={[styles.profileAvatar, { backgroundColor: c.white }]}>
            <BuiltInAvatar avatarId={visibleProfile.avatarId} size={68} />
            <View style={styles.profileCheck}><Icon icon={editing ? User : Check} size={12} color={c.white} /></View>
          </Tap>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt weight="bold" numberOfLines={1} style={{ color: c.white, fontSize: 18 }}>{visibleProfile.ownerFullName}</Txt>
            <Txt numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, marginTop: 3 }}>{visibleProfile.storeName}</Txt>
            <Row style={{ gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
              <Icon icon={Award} size={15} color={c.gold400} />
              <Txt weight="medium" style={{ color: c.gold200, fontSize: 12 }}>Score Mosika: {metrics.mosikaScore}</Txt>
              <KycStatusPill status={visibleProfile.kycStatus} compact />
              <Pill>{language === 'en' ? 'English' : 'Français'}</Pill>
            </Row>
          </View>
        </Row>
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: -12, paddingBottom: 22 }}>
        <Card style={styles.profileCompletionCard}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <Txt weight="bold" style={{ fontSize: 12 }}>{t('profile.completion')}</Txt>
            <Txt weight="black" style={{ color: c.formalio700, fontSize: 13 }}>{completion}%</Txt>
          </Row>
          <ValueBar value={completion} color={completion >= 80 ? c.formalio500 : c.gold500} />
          <Txt style={{ color: c.surface500, fontSize: 10, marginTop: 7 }}>{t('profile.completionHint')}</Txt>
        </Card>

        <EmailVerificationCard profile={profile} setProfile={setProfile} />

        <Card style={styles.profileEditorCard}>
          <View style={styles.profileEditorHeader}>
            <View style={styles.profileEditorHeaderText}>
              <Txt weight="black" style={{ fontSize: 15 }}>{t('profile.businessProfile')}</Txt>
              <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>{editing ? t('profile.editingHint') : t('profile.detailsHint')}</Txt>
            </View>
            {editing ? (
              <Row style={styles.profileEditorActions}>
                <PrimaryButton
                  label={t('common.cancel')}
                  icon={X}
                  tone="outline"
                  disabled={saving}
                  onPress={cancelProfileEdit}
                  style={styles.profileActionButton}
                />
                <PrimaryButton
                  label={saving ? t('common.loading') : t('common.save')}
                  icon={saving ? RefreshCw : Check}
                  disabled={saving}
                  onPress={saveProfile}
                  style={styles.profileActionButton}
                />
              </Row>
            ) : (
              <PrimaryButton
                label={t('profile.editProfile')}
                icon={Pencil}
                onPress={() => setEditing(true)}
                style={styles.profileEditButton}
              />
            )}
          </View>

          {editing ? (
            <Animated.View entering={FadeIn.duration(180)} style={{ gap: 12 }}>
              <Field label={t('profile.storeName')} value={form.storeName} onChangeText={(v) => updateForm('storeName', v)} placeholder={t('profile.storeName')} icon={Package} error={profileErrors.storeName} />
              <Field label={t('profile.storeDescription')} value={form.storeDescription} onChangeText={(v) => updateForm('storeDescription', v)} placeholder={t('profile.storeDescription')} multiline error={profileErrors.storeDescription} />
              <Field label={t('profile.ownerName')} value={form.ownerFullName} onChangeText={(v) => updateForm('ownerFullName', v)} placeholder={t('profile.ownerName')} icon={User} error={profileErrors.ownerFullName} />
              <Grid columns={2} gap={10}>
                <Field label={t('profile.phone')} value={form.phone} onChangeText={(v) => updateForm('phone', v)} placeholder="+237..." icon={Phone} keyboardType="phone-pad" error={profileErrors.phone} />
                <Field label={t('profile.email')} value={form.email} onChangeText={(v) => updateForm('email', v)} placeholder="name@email.com" icon={Mail} keyboardType="email-address" error={profileErrors.email} />
              </Grid>
              <View>
                <Txt weight="semibold" style={styles.fieldLabel}>{t('profile.category')}</Txt>
                <View style={styles.chipWrapLeft}>
                  {categories.map((category) => (
                    <Tap key={category} onPress={() => updateForm('category', category)} style={[styles.selectChip, form.category === category && styles.selectChipActive]}>
                      <Txt weight="medium" style={{ color: form.category === category ? c.formalio700 : c.surface600, fontSize: 12 }}>{category}</Txt>
                    </Tap>
                  ))}
                </View>
              </View>
              <Field label={t('profile.address')} value={form.address} onChangeText={(v) => updateForm('address', v)} placeholder="City, district, country" icon={MapPin} error={profileErrors.address} />
              <AvatarSelector selectedId={form.avatarId} onSelect={(avatarId) => setForm((current) => ({ ...current, avatarId, profileImageUri: `avatar:${avatarId}` }))} title={t('profile.avatarLibrary')} hint={t('profile.avatarHint')} />
              <CoverThemeSelector selectedId={form.coverTheme} onSelect={(coverTheme) => updateForm('coverTheme', coverTheme)} title={t('profile.coverTheme')} />
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(180)}>
              <ProfileInfoRow icon={Package} label={t('profile.store')} value={profile.storeName} />
              <ProfileInfoRow icon={User} label={t('profile.owner')} value={profile.ownerFullName} />
              <ProfileInfoRow icon={Phone} label={t('profile.phone')} value={profile.phone} />
              <ProfileInfoRow icon={Mail} label={t('profile.email')} value={profile.email} />
              <ProfileInfoRow icon={MapPin} label={t('profile.location')} value={profile.address} />
              <ProfileInfoRow icon={Sparkles} label={t('profile.category')} value={profile.category} />
            </Animated.View>
          )}
        </Card>

        <KycVerificationPanel
          profile={profile}
          onStatusChange={(kycStatus) => {
            setProfile((current) => ({ ...current, kycStatus }));
            void onKycStatusChange?.(kycStatus);
          }}
        />

        <View style={styles.profileMenu}>
          {[
            { icon: Settings, label: 'Paramètres', action: () => navigate('settings') },
            { icon: Shield, label: 'Sécurité', action: () => navigate('security') },
            { icon: CreditCard, label: 'Abonnement', badge: subscription.tier, action: () => navigate('subscription') },
            { icon: Smartphone, label: 'Mobile Money', action: () => navigate('mobile-money') },
            { icon: Banknote, label: 'Historique des retraits', action: () => navigate('versements') },
            { icon: Gift, label: 'Parrainage', badge: '+1K', action: () => navigate('referral') },
            { icon: HelpCircle, label: 'Aide & Support', action: () => navigate('help') },
          ].map((item, i) => (
            <Tap key={item.label} onPress={item.action} style={styles.profileMenuTap}>
              <View style={[styles.profileMenuItem, i > 0 && { borderTopWidth: 1, borderTopColor: c.surface100 }]}>
                <View style={styles.profileMenuIcon}>
                  <Icon icon={item.icon} size={18} color={c.surface500} />
                </View>
                <Txt numberOfLines={1} style={styles.profileMenuLabel}>{item.label}</Txt>
                {item.badge ? <Pill style={styles.profileMenuBadge}>{item.badge}</Pill> : null}
                <Icon icon={ChevronRight} size={16} color={c.surface400} />
              </View>
            </Tap>
          ))}
        </View>
        <View style={styles.logoutButtonWrap}>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel={t('profile.logout')}
          onPress={() => {
            showToast({ type: 'info', title: 'Déconnexion', message: 'À bientôt !' });
            setTimeout(logout, 800);
          }}
            style={({ pressed }) => pressed && styles.logoutButtonPressed}
          >
            <View style={styles.logoutButton}>
              <Icon icon={LogOut} size={18} color={c.white} />
              <Txt weight="bold" numberOfLines={1} style={styles.logoutButtonText}>
                {t('profile.logout')}
              </Txt>
            </View>
          </Pressable>
        </View>
        <Txt style={{ textAlign: 'center', color: c.surface400, fontSize: 12, marginTop: 8 }}>Formalio v2.1.0 · Build 2451</Txt>
      </View>
    </ScreenWrapper>
  );
}

function validateBusinessProfile(profile: BusinessProfile) {
  const errors: Partial<Record<keyof BusinessProfile, string>> = {};
  if (profile.storeName.trim().length < 2) errors.storeName = 'Store name is required.';
  if (profile.storeDescription.trim().length < 12) errors.storeDescription = 'Add a clearer business description.';
  if (profile.ownerFullName.trim().split(' ').length < 2) errors.ownerFullName = 'Enter first and last name.';
  if (!/^\+?[0-9\s-]{8,}$/.test(profile.phone.trim())) errors.phone = 'Enter a valid phone number.';
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email.trim())) errors.email = 'Enter a valid email.';
  if (!profile.category.trim()) errors.category = 'Select a business category.';
  if (profile.address.trim().length < 5) errors.address = 'Add a precise location.';
  return errors;
}

function AvatarSelector({ selectedId, onSelect, title, hint }: { selectedId?: string; onSelect: (avatarId: string) => void; title: string; hint: string }) {
  const groups = ['Women', 'Men', 'Neutral'] as const;
  return (
    <View style={styles.avatarSelector}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <Txt weight="bold" style={{ color: c.surface900, fontSize: 13 }}>{title}</Txt>
        <Pill>{getProfileAvatar(selectedId).label}</Pill>
      </Row>
      <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, marginBottom: 10 }}>{hint}</Txt>
      <ScrollView style={{ maxHeight: 280 }} nestedScrollEnabled showsVerticalScrollIndicator={false}>
        {groups.map((group) => (
          <View key={group} style={{ marginBottom: 12 }}>
            <Txt weight="semibold" style={{ color: c.surface500, fontSize: 11, marginBottom: 8 }}>{group}</Txt>
            <View style={styles.avatarGrid}>
              {profileAvatars.filter((avatar) => avatar.group === group).map((avatar) => {
                const selected = selectedId === avatar.id;
                return (
                  <Tap key={avatar.id} onPress={() => onSelect(avatar.id)} style={[styles.avatarChoice, selected && styles.avatarChoiceSelected]}>
                    <BuiltInAvatar avatarId={avatar.id} size={66} selected={selected} />
                    <Txt numberOfLines={1} weight="medium" style={{ color: selected ? c.formalio700 : c.surface600, fontSize: 10 }}>{avatar.label}</Txt>
                  </Tap>
                );
              })}
            </View>
          </View>
        ))}
      </ScrollView>
    </View>
  );
}

function CoverThemeSelector({ selectedId, onSelect, title }: { selectedId?: string; onSelect: (coverTheme: string) => void; title: string }) {
  return (
    <View>
      <Txt weight="semibold" style={styles.fieldLabel}>{title}</Txt>
      <View style={styles.coverThemeGrid}>
        {coverThemes.map((theme) => {
          const selected = selectedId === theme.id;
          return (
            <Tap key={theme.id} onPress={() => onSelect(theme.id)} style={[styles.coverThemeChoice, selected && styles.coverThemeChoiceSelected]}>
              <LinearGradient colors={theme.colors} style={styles.coverThemeSwatch} />
              <Txt weight="medium" style={{ color: selected ? c.formalio700 : c.surface600, fontSize: 11 }}>{theme.label}</Txt>
            </Tap>
          );
        })}
      </View>
    </View>
  );
}

function ProfileInfoRow({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Row style={styles.profileInfoRow}>
      <View style={[styles.metricIcon, { backgroundColor: c.surface50 }]}><Icon icon={icon} size={15} color={c.surface500} /></View>
      <Txt numberOfLines={2} style={{ color: c.surface500, fontSize: 11, lineHeight: 15, width: isAndroidNative ? 92 : 76 }}>{label}</Txt>
      <Txt weight="semibold" numberOfLines={1} style={{ color: c.surface800, fontSize: 12, flex: 1, minWidth: 0 }}>{value}</Txt>
    </Row>
  );
}

export function getEmailVerificationMeta(status: EmailVerificationStatus) {
  const map = {
    verified: { label: 'Vérifié', title: 'Email vérifié', copy: 'Vos emails de récupération et de sécurité sont actifs.', color: c.formalio700, bg: c.formalio50 },
    sent: { label: 'Code envoyé', title: 'Email de vérification envoyé', copy: 'Entrez le code reçu ou ouvrez le lien dans votre boîte mail.', color: c.info700, bg: c.info50 },
    queued: { label: 'En file', title: 'Vérification en attente', copy: 'Le service email gratuit est occupé. Formalio vous laissera réessayer bientôt.', color: c.gold700, bg: c.gold50 },
    deferred: { label: 'Réessayer plus tard', title: 'Vérification différée', copy: 'Vous pouvez continuer à utiliser Formalio. Réessayez l’envoi dans quelques instants.', color: c.gold700, bg: c.gold50 },
    unverified: { label: 'Non vérifié', title: 'Vérifiez votre email', copy: 'Vous pouvez utiliser Formalio maintenant. La vérification améliore la récupération et la confiance du compte.', color: c.surface600, bg: c.surface50 },
  } satisfies Record<EmailVerificationStatus, { label: string; title: string; copy: string; color: string; bg: string }>;
  return map[status];
}

export function EmailVerificationCard({ profile, setProfile, compact }: { profile: BusinessProfile; setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>; compact?: boolean }) {
  const { showToast } = useToast();
  const [sending, setSending] = useState(false);
  const [verifying, setVerifying] = useState(false);
  const [token, setToken] = useState('');
  const [now, setNow] = useState(Date.now());
  const verified = profile.emailVerificationStatus === 'verified' || Boolean(profile.emailVerifiedAt);
  const meta = getEmailVerificationMeta(verified ? 'verified' : profile.emailVerificationStatus);
  const nextAttemptMs = profile.emailVerificationNextAttemptAt ? new Date(profile.emailVerificationNextAttemptAt).getTime() : 0;
  const secondsRemaining = Math.max(0, Math.ceil((nextAttemptMs - now) / 1000));
  const canSend = !verified && !sending && secondsRemaining === 0;

  useEffect(() => {
    if (!nextAttemptMs || secondsRemaining === 0) return undefined;
    const timer = setInterval(() => setNow(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [nextAttemptMs, secondsRemaining]);

  const applyVerificationResult = (result: Awaited<ReturnType<typeof formalioBackend.requestEmailVerification>>) => {
    if (!result || result.status === 'skipped') return;
    const nextStatus: EmailVerificationStatus = result.status === 'verified' ? 'verified' : result.status;
    setProfile((current) => ({
      ...current,
      emailVerificationStatus: nextStatus,
      emailVerificationSentAt: result.sentAt ?? current.emailVerificationSentAt,
      emailVerificationNextAttemptAt: result.nextAttemptAt ?? current.emailVerificationNextAttemptAt,
    }));
  };

  const sendVerification = () => {
    if (!canSend) return;
    setSending(true);
    void formalioBackend
      .requestEmailVerification(profile.email)
      .then((result) => {
        applyVerificationResult(result);
        showToast({
          type: result.status === 'sent' ? 'success' : 'info',
          title: result.status === 'sent' ? 'Vérification envoyée' : 'Vérification enregistrée',
          message: result.message,
        });
      })
      .catch((error) => {
        showToast({ type: 'error', title: 'Vérification email', message: error instanceof Error ? error.message : 'Réessayez plus tard.' });
      })
      .finally(() => setSending(false));
  };

  const verifyToken = () => {
    const value = token.trim();
    if (value.length < 6) {
      showToast({ type: 'error', title: 'Code incomplete', message: 'Enter the code from your email.' });
      return;
    }
    setVerifying(true);
    void formalioBackend
      .verifyProgressiveEmailOtp(profile.email, value)
      .then(() => {
        const verifiedAt = new Date().toISOString();
        setProfile((current) => ({
          ...current,
          emailVerificationStatus: 'verified',
          emailVerifiedAt: verifiedAt,
          emailVerificationNextAttemptAt: undefined,
        }));
        setToken('');
        showToast({ type: 'success', title: 'Email vérifié', message: 'Your account trust status has been updated.' });
      })
      .catch((error) => {
        showToast({ type: 'error', title: 'Code invalid', message: error instanceof Error ? error.message : 'Check the code and try again.' });
      })
      .finally(() => setVerifying(false));
  };

  return (
    <Card style={[styles.profileCompletionCard, { backgroundColor: meta.bg, borderColor: meta.bg }, compact && { marginBottom: 16 }]}>
      <Row style={{ justifyContent: 'space-between', gap: 10, alignItems: 'flex-start' }}>
        <Row style={{ flex: 1, gap: 10, alignItems: 'flex-start' }}>
          <View style={[styles.metricIcon, { backgroundColor: c.white }]}><Icon icon={verified ? CheckCircle2 : Mail} size={16} color={meta.color} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight="black" style={{ color: c.surface900, fontSize: 14 }}>{meta.title}</Txt>
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{meta.copy}</Txt>
            <Txt numberOfLines={1} style={{ color: c.surface500, fontSize: 10, marginTop: 5 }}>{profile.email}</Txt>
          </View>
        </Row>
        <View style={[styles.kycStatusPill, { backgroundColor: c.white }]}>
          <View style={[styles.tinyDot, { backgroundColor: meta.color }]} />
          <Txt weight="black" style={{ color: meta.color, fontSize: 10 }}>{meta.label}</Txt>
        </View>
      </Row>

      {!verified ? (
        <Animated.View entering={FadeIn.duration(180)} style={{ marginTop: 12, gap: 10 }}>
          <Field label="Email code" value={token} onChangeText={(value) => setToken(value.replace(/\D/g, '').slice(0, 8))} placeholder="8-digit code" icon={Shield} keyboardType="numeric" />
          <Grid columns={isAndroidNative ? 1 : 2} gap={10}>
            <PrimaryButton label={verifying ? 'Checking...' : 'Verify code'} icon={verifying ? RefreshCw : Check} disabled={verifying} onPress={verifyToken} style={{ minHeight: 42, borderRadius: 13 }} />
            <PrimaryButton
              label={sending ? 'Envoi...' : secondsRemaining > 0 ? `Réessayer ${secondsRemaining}s` : 'Envoyer l’email'}
              tone="surface"
              icon={sending ? RefreshCw : Mail}
              disabled={!canSend}
              onPress={sendVerification}
              style={{ minHeight: 42, borderRadius: 13 }}
            />
          </Grid>
        </Animated.View>
      ) : null}
    </Card>
  );
}

function KycVerificationPanel({ profile, onStatusChange }: { profile: BusinessProfile; onStatusChange: (status: KycStatus) => void }) {
  const { showToast } = useToast();
  const steps = ['Identité', 'Personnel', 'Carte ID', 'Selfie', 'Entreprise', 'Adresse', 'Révision', 'Statut'];
  const [step, setStep] = useState(0);
  const [savingDraft, setSavingDraft] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [draft, setDraft] = useState<KycDraft>({
    fullName: profile.ownerFullName,
    birthDate: '1992-08-14',
    idType: 'National ID',
    idNumber: 'CNI-237-884920',
    businessName: profile.storeName,
    registrationNumber: 'RC/DLA/2024/B/1029',
    taxId: 'M092401884920Z',
    address: profile.address,
  });
  const progress = Math.round(((step + 1) / steps.length) * 100);

  useEffect(() => {
    setDraft((current) => ({
      ...current,
      fullName: current.fullName || profile.ownerFullName,
      businessName: current.businessName || profile.storeName,
      address: current.address || profile.address,
    }));
  }, [profile.address, profile.ownerFullName, profile.storeName]);

  const updateDraft = <K extends keyof KycDraft>(key: K, value: KycDraft[K]) => setDraft((current) => ({ ...current, [key]: value }));

  const pickKycImage = async (field: keyof Pick<KycDraft, 'idFrontUri' | 'idBackUri' | 'selfieUri' | 'addressProofUri'>, source: 'camera' | 'file') => {
    const permission = source === 'camera' ? await ImagePicker.requestCameraPermissionsAsync() : await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ type: 'error', title: 'Permission requise', message: source === 'camera' ? 'Autorisez la caméra pour continuer.' : 'Autorisez les fichiers pour continuer.' });
      return;
    }
    const options: ImagePicker.ImagePickerOptions = { mediaTypes: ImagePicker.MediaTypeOptions.Images, allowsEditing: true, quality: 0.78 };
    const result = source === 'camera' ? await ImagePicker.launchCameraAsync(options) : await ImagePicker.launchImageLibraryAsync(options);
    if (!result.canceled && result.assets[0]?.uri) updateDraft(field, result.assets[0].uri);
  };

  const saveDraft = () => {
    setSavingDraft(true);
    setTimeout(() => {
      setSavingDraft(false);
      showToast({ type: 'success', title: 'Brouillon KYC sauvegardé', message: `Étape ${step + 1}/8` });
    }, 650);
  };

  const submitKyc = () => {
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onStatusChange('under-review');
      setStep(7);
      showToast({ type: 'success', title: 'KYC soumis', message: 'Votre dossier est en revue.' });
    }, 1200);
  };

  return (
    <Card style={styles.kycCard}>
      <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Row style={{ gap: 6 }}>
            <Icon icon={Shield} size={16} color={c.formalio700} />
            <Txt weight="black" style={{ fontSize: 15 }}>Vérification KYC</Txt>
          </Row>
          <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 4 }}>Secure onboarding flow ready for backend integration.</Txt>
        </View>
        <KycStatusPill status={profile.kycStatus} />
      </Row>

      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <Txt weight="bold" style={{ color: c.formalio700, fontSize: 11 }}>{steps[step]}</Txt>
        <Txt weight="black" style={{ color: c.surface700, fontSize: 11 }}>{progress}%</Txt>
      </Row>
      <ValueBar value={progress} color={profile.kycStatus === 'approved' ? c.formalio500 : c.info500} />
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.kycStepper}>
        {steps.map((label, index) => (
          <Tap key={label} onPress={() => setStep(index)} style={[styles.kycStepDot, index <= step && styles.kycStepDotActive]}>
            <Txt weight="black" style={{ color: index <= step ? c.white : c.surface500, fontSize: 10 }}>{index + 1}</Txt>
          </Tap>
        ))}
      </ScrollView>

      <Animated.View key={step} entering={FadeIn.duration(180)} style={styles.kycStepBody}>
        {step === 0 ? (
          <KycStepShell icon={Shield} title="Vérification d’identité" copy="Confirmez le document officiel qui servira de référence au compte.">
            <Grid columns={3} gap={8}>
              {['National ID', 'Passport', 'Residence'].map((type) => (
                <Tap key={type} onPress={() => updateDraft('idType', type)} style={[styles.kycChoice, draft.idType === type && styles.kycChoiceActive]}>
                  <Txt weight="bold" style={{ color: draft.idType === type ? c.formalio700 : c.surface600, fontSize: 11, textAlign: 'center' }}>{type}</Txt>
                </Tap>
              ))}
            </Grid>
          </KycStepShell>
        ) : null}
        {step === 1 ? (
          <KycStepShell icon={User} title="Personal Information" copy="These details should match the submitted identity document.">
            <Field label="Full name" value={draft.fullName} onChangeText={(v) => updateDraft('fullName', v)} icon={User} />
            <Field label="Date of birth" value={draft.birthDate} onChangeText={(v) => updateDraft('birthDate', v)} placeholder="YYYY-MM-DD" />
            <Field label="ID number" value={draft.idNumber} onChangeText={(v) => updateDraft('idNumber', v)} icon={CreditCard} />
          </KycStepShell>
        ) : null}
        {step === 2 ? (
          <KycStepShell icon={FileText} title="ID Card Upload" copy="Capture the front and back of the document in good light.">
            <Grid columns={2} gap={10}>
              <KycUploadTile label="Front side" uri={draft.idFrontUri} onCamera={() => pickKycImage('idFrontUri', 'camera')} onFile={() => pickKycImage('idFrontUri', 'file')} />
              <KycUploadTile label="Back side" uri={draft.idBackUri} onCamera={() => pickKycImage('idBackUri', 'camera')} onFile={() => pickKycImage('idBackUri', 'file')} />
            </Grid>
          </KycStepShell>
        ) : null}
        {step === 3 ? (
          <KycStepShell icon={Camera} title="Vérification selfie" copy="Un aperçu selfie sera comparé au document d’identité.">
            <KycUploadTile label="Selfie capture" uri={draft.selfieUri} tall onCamera={() => pickKycImage('selfieUri', 'camera')} onFile={() => pickKycImage('selfieUri', 'file')} />
          </KycStepShell>
        ) : null}
        {step === 4 ? (
          <KycStepShell icon={Package} title="Vérification entreprise" copy="Ajoutez les références d’enregistrement pour les futurs contrôles de conformité.">
            <Field label="Business name" value={draft.businessName} onChangeText={(v) => updateDraft('businessName', v)} icon={Package} />
            <Field label="Registration number" value={draft.registrationNumber} onChangeText={(v) => updateDraft('registrationNumber', v)} icon={FileText} />
            <Field label="Tax identifier" value={draft.taxId} onChangeText={(v) => updateDraft('taxId', v)} icon={Calculator} />
          </KycStepShell>
        ) : null}
        {step === 5 ? (
          <KycStepShell icon={MapPin} title="Vérification adresse" copy="Confirmez l’adresse professionnelle et joignez un justificatif.">
            <Field label="Business address" value={draft.address} onChangeText={(v) => updateDraft('address', v)} icon={MapPin} />
            <KycUploadTile label="Address proof" uri={draft.addressProofUri} onCamera={() => pickKycImage('addressProofUri', 'camera')} onFile={() => pickKycImage('addressProofUri', 'file')} />
          </KycStepShell>
        ) : null}
        {step === 6 ? (
          <KycStepShell icon={CheckCircle2} title="Révision et envoi" copy="Vérifiez le dossier préparé avant de le soumettre.">
            <View style={styles.kycReviewBox}>
              <InfoLine label="Identity" value={`${draft.idType} · ${draft.idNumber}`} />
              <InfoLine label="Applicant" value={draft.fullName} />
              <InfoLine label="Business" value={draft.businessName} />
              <InfoLine label="Documents" value={`${[draft.idFrontUri, draft.idBackUri, draft.selfieUri, draft.addressProofUri].filter(Boolean).length}/4 uploaded`} valueColor={c.formalio700} />
            </View>
            <PrimaryButton label={submitting ? 'Envoi...' : 'Soumettre la vérification'} icon={submitting ? RefreshCw : Check} disabled={submitting} onPress={submitKyc} style={{ minHeight: 44, borderRadius: 13 }} />
          </KycStepShell>
        ) : null}
        {step === 7 ? <KycStatusPage status={profile.kycStatus} onStatusChange={onStatusChange} /> : null}
      </Animated.View>

      <Row style={{ gap: 8 }}>
        <PrimaryButton label="Save draft" tone="surface" icon={savingDraft ? RefreshCw : FileText} disabled={savingDraft} onPress={saveDraft} style={{ flex: 1, minHeight: 42, borderRadius: 13 }} />
        <PrimaryButton label={step === 7 ? 'Status' : 'Next'} icon={ChevronRight} onPress={() => setStep((current) => Math.min(7, current + 1))} style={{ flex: 1, minHeight: 42, borderRadius: 13 }} />
      </Row>
    </Card>
  );
}

function KycStepShell({ icon, title, copy, children }: { icon: LucideIcon; title: string; copy: string; children: React.ReactNode }) {
  return (
    <View style={{ gap: 12 }}>
      <Row style={{ gap: 10, alignItems: 'flex-start' }}>
        <View style={[styles.metricIcon, { backgroundColor: c.formalio50 }]}><Icon icon={icon} size={16} color={c.formalio700} /></View>
        <View style={{ flex: 1 }}>
          <Txt weight="bold" style={{ fontSize: 13 }}>{title}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{copy}</Txt>
        </View>
      </Row>
      {children}
    </View>
  );
}

function KycUploadTile({ label, uri, onCamera, onFile, tall }: { label: string; uri?: string; onCamera: () => void; onFile: () => void; tall?: boolean }) {
  return (
    <View style={[styles.kycUploadTile, tall && { minHeight: 174 }]}>
      {uri ? <Image source={{ uri }} resizeMode="cover" style={StyleSheet.absoluteFillObject} /> : null}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: uri ? 'rgba(2,6,23,.34)' : c.surface50 }]} />
      <View style={styles.kycUploadInner}>
        <Icon icon={uri ? CheckCircle2 : Camera} size={22} color={uri ? c.white : c.formalio700} />
        <Txt weight="bold" style={{ color: uri ? c.white : c.surface800, fontSize: 12 }}>{label}</Txt>
        <Row style={{ gap: 8, marginTop: 8 }}>
          <Tap onPress={onCamera} style={styles.kycUploadButton}><Icon icon={Camera} size={13} color={c.formalio700} /><Txt weight="bold" style={{ color: c.formalio700, fontSize: 10 }}>Camera</Txt></Tap>
          <Tap onPress={onFile} style={styles.kycUploadButton}><Icon icon={FileText} size={13} color={c.surface600} /><Txt weight="bold" style={{ color: c.surface600, fontSize: 10 }}>File</Txt></Tap>
        </Row>
      </View>
    </View>
  );
}

function KycStatusPill({ status, compact }: { status: KycStatus; compact?: boolean }) {
  const meta = getKycStatusMeta(status);
  return (
    <View style={[styles.kycStatusPill, { backgroundColor: meta.bg }, compact && { paddingVertical: 3, paddingHorizontal: 7 }]}>
      <View style={[styles.tinyDot, { backgroundColor: meta.color }]} />
      <Txt weight="black" style={{ color: meta.color, fontSize: compact ? 9 : 10 }}>{meta.label}</Txt>
    </View>
  );
}

function KycStatusPage({ status, onStatusChange }: { status: KycStatus; onStatusChange: (status: KycStatus) => void }) {
  const statuses: KycStatus[] = ['pending', 'under-review', 'approved', 'rejected'];
  const meta = getKycStatusMeta(status);
  return (
    <View style={{ gap: 12 }}>
      <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.kycStatusHero}>
        <Icon icon={status === 'approved' ? CheckCircle2 : status === 'rejected' ? AlertTriangle : Shield} size={28} color={status === 'rejected' ? c.gold400 : c.formalio300} />
        <Txt weight="black" style={{ color: c.white, fontSize: 18, marginTop: 10 }}>{meta.title}</Txt>
        <Txt style={{ color: c.formalio200, fontSize: 11, lineHeight: 16, marginTop: 4 }}>{meta.copy}</Txt>
      </LinearGradient>
      {statuses.map((item) => {
        const itemMeta = getKycStatusMeta(item);
        const active = item === status;
        return (
          <Tap key={item} onPress={() => onStatusChange(item)} style={[styles.kycStatusRow, active && { borderColor: itemMeta.color, backgroundColor: itemMeta.bg }]}>
            <Icon icon={active ? CheckCircle2 : Shield} size={16} color={active ? itemMeta.color : c.surface400} />
            <Txt weight="bold" style={{ color: active ? itemMeta.color : c.surface600, fontSize: 12, flex: 1 }}>{itemMeta.label}</Txt>
            <Txt style={{ color: c.surface400, fontSize: 10 }}>mock</Txt>
          </Tap>
        );
      })}
    </View>
  );
}

function getKycStatusMeta(status: KycStatus) {
  const map = {
    pending: { label: 'En attente', title: 'Vérification en attente', copy: 'Démarrez ou continuez le parcours KYC pour soumettre votre profil.', color: c.gold700, bg: c.gold50 },
    'under-review': { label: 'En revue', title: 'Under review', copy: 'Formalio compliance is reviewing the mocked dossier.', color: c.info700, bg: c.info50 },
    approved: { label: 'Approuvé', title: 'Compte vérifié', copy: 'L’identité et les informations entreprise sont marquées comme approuvées.', color: c.formalio700, bg: c.formalio50 },
    rejected: { label: 'Rejected', title: 'Action required', copy: 'A reviewer requested updated documents or clearer photos.', color: c.danger600, bg: c.danger50 },
  } satisfies Record<KycStatus, { label: string; title: string; copy: string; color: string; bg: string }>;
  return map[status];
}
