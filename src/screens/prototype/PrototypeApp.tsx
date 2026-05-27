import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import {
  AppState,
  ActivityIndicator,
  Alert,
  BackHandler,
  Image,
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  StyleProp,
  StyleSheet,
  Text,
  TextInput,
  TextStyle,
  ToastAndroid,
  View,
  ViewStyle,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { LinearGradient } from 'expo-linear-gradient';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { Audio } from 'expo-av';
import * as ImagePicker from 'expo-image-picker';
import * as LocalAuthentication from 'expo-local-authentication';
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';
import Slider from '@react-native-community/slider';
import Svg, {
  Circle,
  Defs,
  G,
  LinearGradient as SvgLinearGradient,
  Line,
  Polygon,
  Polyline,
  Rect,
  Stop,
  Text as SvgText,
} from 'react-native-svg';
import Animated, {
  Easing,
  Extrapolation,
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInRight,
  SlideOutLeft,
  interpolate,
  useAnimatedStyle,
  useAnimatedScrollHandler,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  AlertTriangle,
  ArrowDownRight,
  ArrowLeft,
  ArrowUpRight,
  Award,
  BarChart3,
  Bell,
  BrainCircuit,
  Calculator,
  Camera,
  Check,
  CheckCircle2,
  ChevronRight,
  CreditCard,
  Download,
  Eye,
  EyeOff,
  FileSpreadsheet,
  FileText,
  Filter,
  Fingerprint,
  Gift,
  Globe,
  HelpCircle,
  Home,
  Lightbulb,
  Lock,
  LogOut,
  Mail,
  MapPin,
  MessageCircle,
  Mic,
  Moon,
  Package,
  Pencil,
  Phone,
  Play,
  Plus,
  Printer,
  Receipt,
  RefreshCw,
  ScanLine,
  Search,
  Send,
  Settings,
  Share2,
  Shield,
  Smartphone,
  Sparkles,
  Square,
  Trash2,
  TrendingDown,
  TrendingUp,
  Upload,
  User,
  Wallet,
  Wifi,
  WifiOff,
  X,
  Zap,
  type LucideIcon,
} from 'lucide-react-native';
import {
  Inter_300Light,
  Inter_400Regular,
  Inter_500Medium,
  Inter_600SemiBold,
  Inter_700Bold,
  Inter_800ExtraBold,
  Inter_900Black,
  useFonts,
} from '@expo-google-fonts/inter';
import {
  notifications as initialNotifications,
  pricingPlans,
  type Transaction,
} from './demoData';
import { styles } from './styles';
import { c, defaultTextMaxScale, font, inputTextMaxScale, isAndroidNative } from './theme';
import {
  AppLanguageContext,
  AnimatedMascot,
  AreaChart,
  BarChart,
  BuiltInAvatar,
  Card,
  DonutChart,
  Field,
  FilterChipGroup,
  Grid,
  HeaderUtilityActions,
  Icon,
  InfoLine,
  Logo,
  LogoMark,
  ModalShell,
  PaymentMethodInline,
  PaymentBrandPill,
  Pill,
  PrimaryButton,
  Row,
  ScreenWrapper,
  Segment,
  Tap,
  ToneIcon,
  ToastProvider,
  TransactionRow,
  Txt,
  ValueBar,
  setCurrentAppLanguage,
  useAppLanguage,
  coverThemes,
  getCoverTheme,
  getProfileAvatar,
  profileAvatars,
  useToast,
} from './shared';
import {
  FICHE_DOCUMENTS_KEY,
  FICHE_LAST_COMPLETED_AT_KEY,
  FICHE_PENDING_DRAFT_KEY,
  createFicheDocumentFromCompletion,
  createFicheDocumentFromDraft,
  ficheStatusLabel,
  ficheStatusTone,
  filterFicheDocuments,
  formatFicheReminderAge,
  shouldShowFicheReminder,
  upsertFicheDocument,
  type FicheDocumentRecord,
  type FicheDocumentStatus,
  type FichePeriodFilter,
  type FicheStatusFilter,
} from './domain/ficheDocuments';
import { defaultBusinessProfile, defaultSubscription, emptyFinancialMetrics, type BusinessProfile, type EmailVerificationStatus, type KycDraft, type KycStatus } from './domain/defaults';
import { calculateLocalFinancialMetrics, calculateProfileCompletion } from './domain/financialMetrics';
import { formatCompactFCFA, formatFCFA } from './domain/formatters';
import {
  getTransactionTime,
  getTransactionTimeBucket,
  normalizeSearchText,
  parseNumberInput,
  type TransactionTimeFilter,
} from './domain/transactions';
import {
  formatStockCompactValue,
  formatStockPrice,
  getStockEntryQuantity,
  getStockMarketFlags,
  sortStockItems,
  stockUpdatedAtMs,
} from './domain/stock';
import { MobileMoneyIcon, getMobileMoneyProvider } from '@/components/momo/MobileMoneyIcon';
import { formalioBackend, type CloudFinancialMetrics, type CloudReportExport, type CloudSubscription } from '@/services/api/formalioBackend';
import { getStockItemValue, getStockUnitEstimate, getTotalStockValue, useStockStore, type StockItem, type StockPriceType } from '@/store/stockStore';
import { useNetworkStore } from '@/services/sync/network';
import { localizeRuntimeText, translate, type SupportedLanguage } from '@/i18n';
import FicheScreen, { type FicheCompletionPayload, type FicheDraftPayload } from '@/screens/fiche/FicheScreen';
import { AddTransactionScreen } from './screens/AddTransactionScreen';
import { AIAssistant, CapabilityCard, ThinkingCard, VoiceRecorder } from './screens/AssistantScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { EmailVerificationCard, ProfileScreen, getEmailVerificationMeta } from './screens/ProfileScreen';
import { ReportPortfolioSummary, ReportsScreen } from './screens/ReportsScreen';
import { ScannerModal } from './screens/ScannerScreen';
import { StockManagerPanel, StockManagerScreen } from './screens/StockManagerScreen';
import type { FicheData } from '@/types/fiche.types';
import { FICHE_TEMPLATES } from '@/constants/ficheTemplates';
import FicheDetailScreen from '@/screens/fiche/FicheDetailScreen';
import DataRestoreScreen from '@/screens/auth/DataRestoreScreen';
import RetraitScreen from '@/screens/versements/RetraitScreen';
import VersementsScreen from '@/screens/versements/VersementsScreen';
import { generateFichePDF, shareFichePDF } from '@/services/reports/ficheReportGenerator';
import { applyRetraitToTreasury } from '@/services/treasury/treasuryBalanceService';
import { fullDataRestore, saveRetraitActivityTransactionLocally, saveVersementLocally, syncFicheAfterValidation, syncVersementAfterCreation } from '@/services/sync/ficheSyncService';
import { getCurrentSyncUserId } from '@/services/sync/syncIdentity';
import { createUuid } from '@/utils/uuid';
import type { VersementItem } from '@/types/versement.types';
import { useAuthStore } from '@/store/authStore';
import { getOutboxItemCount, repositories, upsertCloudRecordLocally } from '@/database/repositories';
import {
  clearTrustedOfflineSession,
  getTrustedPendingSyncCount,
  loadTrustedOfflineSession,
  saveTrustedOfflineSession,
  updateTrustedOfflineProfile,
} from '@/services/auth/offlineSession';
import TermsAndConditionsScreen from '@/screens/legal/TermsAndConditionsScreen';
import PrivacyPolicyScreen from '@/screens/legal/PrivacyPolicyScreen';
import CookiePolicyScreen from '@/screens/legal/CookiePolicyScreen';
import AcceptableUsePolicyScreen from '@/screens/legal/AcceptableUsePolicyScreen';
import RefundSubscriptionPolicyScreen from '@/screens/legal/RefundSubscriptionPolicyScreen';
import CommunityGuidelinesScreen from '@/screens/legal/CommunityGuidelinesScreen';
import DmcaPolicyScreen from '@/screens/legal/DmcaPolicyScreen';
import DataRetentionPolicyScreen from '@/screens/legal/DataRetentionPolicyScreen';
import SecurityPolicyScreen from '@/screens/legal/SecurityPolicyScreen';
import RegulatoryComplianceScreen from '@/screens/legal/RegulatoryComplianceScreen';
import { legalMenuItems, type LegalRouteName } from '@/constants/legalDocuments';

type Screen =
  | LegalRouteName
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

type AuthScreen =
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

type MascotState =
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

type ToastType = 'success' | 'error' | 'info' | 'loading';
type Toast = { id: number; type: ToastType; title: string; message?: string; duration?: number };
type CloudSyncState = 'idle' | 'syncing' | 'ready' | 'offline' | 'error';

type ParsedTransaction = {
  type: 'income' | 'expense';
  amount: number;
  description: string;
  category: string;
  method: string;
};

type ScannedTicketData = ParsedTransaction & {
  ticketNumber: string;
  date: string;
  merchant: string;
  referenceNumber: string;
  details: string;
  imageUri?: string;
};

const VERSEMENTS_STORAGE_KEY = 'formalio.versements.history';
const TREASURY_BALANCE_STORAGE_KEY = 'formalio.treasury.balance';
const TRANSACTIONS_STORAGE_KEY = 'formalio.transactions.history';
const PROTOTYPE_USER_ID = '00000000-0000-4000-8000-000000000001';

function AuthFlows({
  onComplete,
  profile = defaultBusinessProfile,
  transactions = [],
  notifications = [],
  metrics = emptyFinancialMetrics,
  onOpenLegal,
}: {
  onComplete: (isNewUser: boolean) => void;
  profile?: BusinessProfile;
  transactions?: Transaction[];
  notifications?: typeof initialNotifications;
  metrics?: CloudFinancialMetrics;
  onOpenLegal?: (screen: LegalRouteName) => void;
}) {
  const { showToast } = useToast();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const insets = useSafeAreaInsets();
  const { width, height } = useWindowDimensions();
  const [screen, setScreen] = useState<AuthScreen>('splash');
  const [otpTarget, setOtpTarget] = useState('');
  const [credential, setCredential] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [resendAvailableAt, setResendAvailableAt] = useState(0);
  const [nowMs, setNowMs] = useState(Date.now());
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biométrie');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [onboardingIndex, setOnboardingIndex] = useState(0);
  const firstLoginOfflineMessage = 'Première connexion requiert internet. Connectez-vous une fois, puis Formalio restera disponible hors ligne.';
  const authContentMaxWidth = Math.min(width, 430);
  const compactAuth = height < 720;
  const authMinHeight = Math.max(560, height - insets.top - insets.bottom);

  useEffect(() => {
    if (screen === 'splash') {
      const t = setTimeout(() => setScreen('welcome'), 2200);
      return () => clearTimeout(t);
    }
  }, [screen]);

  useEffect(() => {
    let mounted = true;
    (async () => {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
      const types = hasHardware ? await LocalAuthentication.supportedAuthenticationTypesAsync() : [];
      if (!mounted) return;
      setBiometricAvailable(hasHardware && enrolled);
      if (types.includes(LocalAuthentication.AuthenticationType.FACIAL_RECOGNITION)) setBiometricLabel('Face ID');
      else if (types.includes(LocalAuthentication.AuthenticationType.FINGERPRINT)) setBiometricLabel('Empreinte');
      else if (types.includes(LocalAuthentication.AuthenticationType.IRIS)) setBiometricLabel('Iris');
      else setBiometricLabel('Biométrie');
    })();
    return () => {
      mounted = false;
    };
  }, []);

  const formatPhone = (val: string) => {
    const digits = val.replace(/\D/g, '').slice(0, 9);
    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;
  };
  const formatCredentialInput = (val: string) => {
    const phoneOnlyCharacters = /^[\d\s()+-]*$/.test(val);
    return phoneOnlyCharacters && !val.includes('@') ? formatPhone(val) : val.trim().toLowerCase();
  };
  const validatePhone = (val: string) => val.replace(/\D/g, '').length === 9;
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePassword = (val: string) => val.length >= 8 && /[a-z]/.test(val) && /[A-Z]/.test(val) && /[0-9]/.test(val);
  const getCredentialKind = (val: string): 'email' | 'phone' | 'unknown' => {
    const trimmed = val.trim();
    if (trimmed.includes('@')) return 'email';
    if (trimmed.replace(/\D/g, '').length >= 8) return 'phone';
    return 'unknown';
  };
  const validateCredential = (val: string) => {
    const kind = getCredentialKind(val);
    if (kind === 'email') return validateEmail(val);
    if (kind === 'phone') return validatePhone(val);
    return false;
  };
  const navigate = (next: AuthScreen) => {
    setErrors({});
    setScreen(next);
  };
  const resetOtp = (length = 6) => setOtp(Array.from({ length }, () => ''));
  const otpValue = otp.join('');
  const resendRemaining = Math.max(0, Math.ceil((resendAvailableAt - nowMs) / 1000));
  const canResend = resendRemaining === 0 && !loading;
  const startResendCooldown = () => setResendAvailableAt(Date.now() + 60000);
  const simulateLoading = (next: AuthScreen | (() => void), delay = 1200) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (typeof next === 'function') next();
      else setScreen(next);
    }, delay);
  };

  useEffect(() => {
    if (!resendAvailableAt) return undefined;
    const timer = setInterval(() => setNowMs(Date.now()), 1000);
    return () => clearInterval(timer);
  }, [resendAvailableAt]);
  const runBiometricAuth = async (mode: 'login' | 'setup' = 'login') => {
    setErrors({});
    setBiometricLoading(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const isEnrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
      if (!hasHardware || !isEnrolled) {
        setErrors({ biometric: 'Aucune biométrie enregistrée sur cet appareil. Utilisez votre mot de passe.' });
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: mode === 'setup' ? 'Activer la connexion biométrique Formalio' : 'Connexion sécurisée Formalio',
        cancelLabel: 'Annuler',
        fallbackLabel: 'Code appareil',
        disableDeviceFallback: false,
      });
      if (!result.success) {
        setErrors({ biometric: 'Vérification biométrique annulée ou échouée.' });
        return;
      }
      if (mode === 'setup') {
        setScreen('success');
        return;
      }
      onComplete(false);
    } finally {
      setBiometricLoading(false);
    }
  };

  if (screen === 'splash') {
    return (
      <LinearGradient colors={[c.formalio900, c.formalio950]} style={styles.authFull}>
        <View style={[styles.decorativeOrb, { top: '22%', right: -80, backgroundColor: 'rgba(4,120,87,.28)' }]} />
        <View style={[styles.decorativeOrb, { bottom: '18%', left: -90, backgroundColor: 'rgba(16,185,129,.14)' }]} />
        <Animated.View entering={FadeIn.duration(800)} style={{ alignItems: 'center' }}>
          <LogoMark size={100} />
          <Txt weight="bold" style={{ color: c.white, fontSize: 30, marginTop: 24 }}>
            Formalio
          </Txt>
          <Txt weight="semibold" style={{ color: 'rgba(255,255,255,.5)', fontSize: 11, marginTop: 8, letterSpacing: 0 }}>
            BUSINESS · COMPLIANT · GROWING
          </Txt>
        </Animated.View>
        <ActivityIndicator color={c.formalio400} style={{ position: 'absolute', bottom: 54 }} />
      </LinearGradient>
    );
  }

  const onboardingSlides = [
    { title: 'Gérez votre argent simplement', copy: 'Suivez vos revenus, dépenses et transactions même sans connexion internet.', chips: ['Revenus', 'Dépenses', 'Hors ligne'], mascot: 'wave' as const },
    { title: 'Mobile Money synchronisé', copy: 'Importez vos opérations MTN MoMo et Orange Money pour gagner du temps.', chips: ['MTN MoMo', 'Orange Money', 'Anti-doublons'], mascot: 'secure' as const },
    { title: 'Rapports SYSCOHADA prêts', copy: 'Générez bilan, résultat et TVA en PDF pour votre comptable ou votre banque.', chips: ['Bilan', 'TVA', 'PDF'], mascot: 'thinking' as const },
    { title: 'Score Mosika', copy: 'Construisez votre crédibilité financière et préparez votre demande de crédit.', chips: ['Crédit', 'Banques', 'Croissance'], mascot: 'celebrate' as const },
    { title: 'Mosika vous accompagne', copy: "L'assistant IA vous aide à catégoriser, comprendre vos chiffres et éviter les erreurs.", chips: ['IA', 'Voix', 'Conseils'], mascot: 'pointing' as const },
  ];

  const shell = (children: React.ReactNode, bg = c.white) => (
    <SafeAreaView style={[styles.authShell, { backgroundColor: bg }]}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : 'height'} style={{ flex: 1 }}>
        <ScrollView
          keyboardShouldPersistTaps="handled"
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{
            flexGrow: 1,
            width: '100%',
            maxWidth: authContentMaxWidth,
            alignSelf: 'center',
            paddingBottom: Math.max(10, insets.bottom),
          }}
        >
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  if (screen === 'welcome') {
    const slide = onboardingSlides[onboardingIndex];
    return shell(
      <View style={[styles.welcomeScreen, { minHeight: authMinHeight }]}>
        <Row style={{ justifyContent: 'space-between', paddingHorizontal: 24, paddingTop: 18 }}>
          <Logo size={34} />
          <Tap onPress={() => setOnboardingIndex(onboardingSlides.length - 1)} style={{ padding: 8 }}>
            <Txt weight="semibold" style={{ color: c.surface500, fontSize: 12 }}>
              Passer
            </Txt>
          </Tap>
        </Row>
        <View style={styles.welcomeCenter}>
          <Animated.View key={onboardingIndex} entering={SlideInRight.duration(330)} exiting={FadeOut.duration(120)} style={{ alignItems: 'center' }}>
            <AnimatedMascot state={slide.mascot} size={compactAuth ? 132 : 170} />
            <Txt weight="bold" style={styles.welcomeTitle}>
              {slide.title}
            </Txt>
            <Txt style={styles.welcomeCopy}>{slide.copy}</Txt>
            <View style={styles.chipWrap}>
              {slide.chips.map((chip) => (
                <PaymentBrandPill key={chip} label={chip} />
              ))}
            </View>
          </Animated.View>
          <Row style={{ justifyContent: 'center', gap: 8, marginTop: 28 }}>
            {onboardingSlides.map((_, i) => (
              <Tap key={i} onPress={() => setOnboardingIndex(i)} style={[styles.dot, i === onboardingIndex ? styles.dotActive : null]}>
                <View />
              </Tap>
            ))}
          </Row>
        </View>
        <View style={[styles.welcomeActions, { paddingBottom: Math.max(22, insets.bottom + 14) }]}>
          {!isOnline ? (
            <View style={[styles.biometricLoginCard, { marginBottom: 10, borderColor: c.amber200, backgroundColor: c.gold50 }]}>
              <Txt weight="bold" style={{ color: c.amber700, fontSize: 12 }}>Mode hors ligne</Txt>
              <Txt style={{ color: c.surface700, fontSize: 11, marginTop: 3 }}>{firstLoginOfflineMessage}</Txt>
            </View>
          ) : null}
          {onboardingIndex < onboardingSlides.length - 1 ? (
            <PrimaryButton label="Continuer" onPress={() => setOnboardingIndex(onboardingIndex + 1)} style={styles.authPrimaryButton} />
          ) : (
            <>
              <PrimaryButton label="Créer un compte" onPress={() => navigate('signup')} style={styles.authPrimaryButton} />
              <PrimaryButton label="Se connecter" tone="outline" onPress={() => navigate('login')} style={styles.authSecondaryButton} />
            </>
          )}
          <Txt style={{ textAlign: 'center', color: c.surface400, fontSize: 11, lineHeight: 16 }}>
            En continuant, vous acceptez nos{' '}
            <Text onPress={() => onOpenLegal?.('TermsAndConditions')} style={{ color: c.formalio700, fontFamily: font.medium, fontSize: 11 }}>
              Conditions
            </Text>{' '}
            et notre{' '}
            <Text onPress={() => onOpenLegal?.('PrivacyPolicy')} style={{ color: c.formalio700, fontFamily: font.medium, fontSize: 11 }}>
              Confidentialité
            </Text>
          </Txt>
        </View>
      </View>
    );
  }

  const Back = ({ target = 'welcome' as AuthScreen }: { target?: AuthScreen }) => (
    <Tap onPress={() => navigate(target)} style={styles.authBack}>
      <Icon icon={ArrowLeft} size={20} color={c.surface700} />
    </Tap>
  );

  if (screen === 'login') {
    return shell(
      <View style={[styles.formScreen, compactAuth && styles.formScreenCompact]}>
        <Back />
        <Logo size={44} />
        <Txt weight="bold" style={styles.authTitle}>
          Bon retour ! 👋
        </Txt>
        <Txt style={styles.authSubtitle}>Connectez-vous à votre compte</Txt>
        <View style={styles.authFormStack}>
          <Field
            label="Email"
            value={credential}
            onChangeText={(value) => {
              setCredential(value.trim().toLowerCase());
              if (errors.credential) setErrors({});
            }}
            keyboardType="email-address"
            placeholder="marie@boutique.cm"
            icon={Mail}
            error={errors.credential}
            right={validateEmail(credential) ? <Icon icon={Check} size={17} color={c.formalio600} /> : null}
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="********"
            secureTextEntry={!showPassword}
            icon={Lock}
            right={
              <Tap onPress={() => setShowPassword(!showPassword)}>
                <Icon icon={showPassword ? EyeOff : Eye} size={17} color={c.surface400} />
              </Tap>
            }
          />
          {errors.password ? <ErrorLine text={errors.password} /> : null}
          {errors.biometric ? <ErrorLine text={errors.biometric} /> : null}
          <Tap onPress={() => navigate('forgot-password')}>
            <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>
              Mot de passe oublié ?
            </Txt>
          </Tap>
          <PrimaryButton
            label={loading ? 'Connexion...' : 'Se connecter'}
            icon={loading ? RefreshCw : ChevronRight}
            disabled={loading}
            style={styles.authPrimaryButton}
            onPress={() => {
              if (!isOnline) return setErrors({ credential: firstLoginOfflineMessage });
              const normalizedEmail = credential.trim().toLowerCase();
              if (!validateEmail(normalizedEmail)) return setErrors({ credential: 'Entrez un email valide.' });
              if (!validatePassword(password)) return setErrors({ password: '8+ caracteres avec majuscule, minuscule et chiffre.' });
              setEmail(normalizedEmail);
              setLoading(true);
              formalioBackend
                .signInWithEmailOrPhone(normalizedEmail, password)
                .then(() => {
                  setEmail(normalizedEmail);
                  setScreen('welcome-back');
                })
                .catch((error) => {
                  if (formalioBackend.isConfigured) {
                    setErrors({ credential: error instanceof Error ? error.message : 'Connexion impossible.' });
                  } else {
                    setEmail(normalizedEmail);
                    setScreen('welcome-back');
                  }
                })
                .finally(() => setLoading(false));
            }}
          />
          <Divider label="OU" />
          <View style={styles.biometricLoginCard}>
            <Row style={{ gap: 10, alignItems: 'flex-start' }}>
              <View style={styles.biometricLoginIcon}>
                <Icon icon={Fingerprint} size={20} color={c.formalio700} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="black" style={{ color: c.surface900, fontSize: 13 }}>
                  Connexion sécurisée
                </Txt>
                <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, marginTop: 2 }}>
                  {biometricAvailable ? `${biometricLabel} disponible sur cet appareil.` : 'Ajoutez Face ID ou une empreinte dans les réglages de votre appareil.'}
                </Txt>
              </View>
            </Row>
            <PrimaryButton
              label={biometricLoading ? 'Vérification...' : `Connexion ${biometricLabel}`}
              tone="outline"
              icon={biometricLoading ? RefreshCw : Fingerprint}
              disabled={biometricLoading}
              onPress={() => runBiometricAuth('login')}
              style={styles.biometricLoginButton}
            />
          </View>
        </View>
        <InlineLink text="Pas encore de compte ?" action="Créer un compte" onPress={() => navigate('signup')} />
      </View>
    );
  }

  if (screen === 'signup') {
    const strength = [password.length >= 8, /[A-Z]/.test(password), /[0-9]/.test(password), /[^A-Za-z0-9]/.test(password)].filter(Boolean).length;
    const strengthLabels = ['Très faible', 'Faible', 'Moyen', 'Fort', 'Très fort'];
    const strengthColors = [c.danger500, c.orange500, c.gold500, c.formalio400, c.formalio600];
    return shell(
      <View style={styles.formScreen}>
        <Back />
        <Logo size={40} />
        <Txt weight="bold" style={styles.authTitle}>Créer votre compte</Txt>
        <Txt style={styles.authSubtitle}>Commencez en 2 minutes — c'est gratuit !</Txt>
        <View style={{ marginTop: 24, gap: 14 }}>
          <Field label="Nom complet" value={name} onChangeText={setName} placeholder="Marie Nkono" icon={User} />
          {errors.name ? <ErrorLine text={errors.name} /> : null}
          <View>
            <Txt weight="semibold" style={styles.fieldLabel}>Numéro de téléphone</Txt>
            <View style={styles.inputBox}>
              <Txt weight="medium" style={{ fontSize: 13, color: c.surface700 }}>🇨🇲 +237</Txt>
              <View style={styles.vDivider} />
              <TextInput value={phone} onChangeText={(v) => setPhone(formatPhone(v))} keyboardType="phone-pad" placeholder="6XX XXX XXX" placeholderTextColor={c.surface400} maxFontSizeMultiplier={inputTextMaxScale} style={styles.textInput} />
            </View>
            {errors.phone ? <ErrorLine text={errors.phone} /> : null}
          </View>
          <Field label="Email professionnel" value={email} onChangeText={(value) => setEmail(value.trim().toLowerCase())} placeholder="marie@boutique.cm" icon={Mail} keyboardType="email-address" />
          {errors.email ? <ErrorLine text={errors.email} /> : null}
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="8+ caracteres, majuscule et chiffre"
            icon={Lock}
            secureTextEntry={!showPassword}
            right={
              <Tap onPress={() => setShowPassword(!showPassword)}>
                <Icon icon={showPassword ? EyeOff : Eye} size={17} color={c.surface400} />
              </Tap>
            }
          />
          {password ? (
            <View>
              <Row style={{ gap: 4 }}>
                {[0, 1, 2, 3].map((i) => (
                  <View key={i} style={[styles.strengthBar, { backgroundColor: i < strength ? strengthColors[strength] : c.surface200 }]} />
                ))}
              </Row>
              <Txt style={{ marginTop: 5, color: c.surface500, fontSize: 11 }}>{strengthLabels[strength]}</Txt>
            </View>
          ) : null}
          {errors.password ? <ErrorLine text={errors.password} /> : null}
          {errors.confirm ? <ErrorLine text={errors.confirm} /> : null}
          <Field label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="********" icon={Lock} secureTextEntry />
          <PrimaryButton
            label={loading ? 'Création...' : 'Créer mon compte'}
            icon={loading ? RefreshCw : ChevronRight}
            disabled={loading}
            onPress={() => {
              if (!isOnline) return setErrors({ email: firstLoginOfflineMessage });
              const nextErrors: Record<string, string> = {};
              if (!name.trim()) nextErrors.name = 'Nom requis';
              if (!validatePhone(phone)) nextErrors.phone = 'Numéro invalide';
              if (!validateEmail(email)) nextErrors.email = 'Email invalide';
              if (!validatePassword(password)) nextErrors.password = '8+ caracteres avec majuscule, minuscule et chiffre.';
              if (password !== confirmPassword) nextErrors.confirm = 'Les mots de passe ne correspondent pas';
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length === 0) {
                setLoading(true);
                formalioBackend
                  .signUp({ email, password, fullName: name, phone })
                  .then((result) => {
                    const verification = result && 'verification' in result ? result.verification : null;
                    if (verification?.status === 'queued' || verification?.status === 'deferred') {
                      showToast({ type: 'info', title: 'Compte créé', message: verification.message });
                    } else if (verification?.status === 'sent') {
                      showToast({ type: 'success', title: 'Compte créé', message: 'Vous pouvez entrer maintenant. La vérification email reste disponible dans le profil.' });
                    }
                    setScreen('biometric-setup');
                  })
                  .catch((error) => {
                    if (formalioBackend.isConfigured) setErrors({ email: error instanceof Error ? error.message : 'Création impossible.' });
                    else setScreen('biometric-setup');
                  })
                  .finally(() => setLoading(false));
              }
            }}
          />
        </View>
        <InlineLink text="Déjà un compte ?" action="Se connecter" onPress={() => navigate('login')} />
      </View>
    );
  }

  if (screen === 'email-otp') {
    return shell(
      <View style={styles.formScreen}>
        <Back target="signup" />
        <AnimatedMascot state="secure" size={130} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center' }]}>Vérification email</Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>Entrez le code envoyé à {otpTarget || email}, ou ouvrez le lien reçu par email.</Txt>
        <View style={{ marginTop: 26, gap: 16, width: '100%' }}>
          <OtpBoxes otp={otp} setOtp={setOtp} />
          {errors.otp ? <ErrorLine text={errors.otp} /> : null}
          <PrimaryButton
            label={loading ? 'Vérification...' : 'Vérifier le code'}
            icon={loading ? RefreshCw : Check}
            disabled={loading}
            onPress={() => {
              if (otpValue.length < 8) return setErrors({ otp: 'Entrez le code a 8 chiffres.' });
              setLoading(true);
              formalioBackend
                .verifyEmailSignupOtp(otpTarget || email, otpValue)
                .then(() => {
                  showToast({ type: 'success', title: 'Email verifie', message: 'Votre compte Formalio est active.' });
                  setScreen('biometric-setup');
                })
                .catch((error) => setErrors({ otp: error instanceof Error ? error.message : 'Code invalide ou expire.' }))
                .finally(() => setLoading(false));
            }}
          />
          <Tap
            disabled={!canResend}
            onPress={() => {
              if (!canResend) return;
              setLoading(true);
              formalioBackend
                .resendEmailSignup(otpTarget || email)
                .then(() => {
                  resetOtp(8);
                  startResendCooldown();
                  showToast({ type: 'info', title: 'Code renvoye', message: 'Verifiez votre boite email.' });
                })
                .catch((error) => setErrors({ otp: error instanceof Error ? error.message : "Impossible de renvoyer le code." }))
                .finally(() => setLoading(false));
            }}
          >
            <Txt weight="semibold" style={{ color: c.formalio700, textAlign: 'center', fontSize: 12 }}>
              {canResend ? 'Renvoyer le code' : `Renvoyer dans ${resendRemaining}s`}
            </Txt>
          </Tap>
        </View>
      </View>
    );
  }

  if ((screen as AuthScreen) === 'forgot-password' || (screen as AuthScreen) === 'forgot-otp' || (screen as AuthScreen) === 'reset-password') {
    return shell(
      <View style={styles.formScreen}>
        <Back target="login" />
        <AnimatedMascot state={screen === 'reset-password' ? 'secure' : 'thinking'} size={130} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center' }]}>
          {screen === 'forgot-password' ? 'Récupérer votre accès' : screen === 'forgot-otp' ? 'Code de vérification' : 'Nouveau mot de passe'}
        </Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>
          {screen === 'forgot-password' ? 'Recevez un code ou un lien par email pour réinitialiser votre mot de passe.' : screen === 'forgot-otp' ? 'Entrez le code envoyé à votre email, ou ouvrez le lien reçu.' : 'Choisissez un mot de passe solide pour protéger vos données.'}
        </Txt>
        <View style={{ marginTop: 26, gap: 14, width: '100%' }}>
          {screen === 'forgot-password' ? (
            <Field label="Email" value={credential} onChangeText={(value) => setCredential(formatCredentialInput(value))} placeholder="marie@boutique.cm" icon={Mail} keyboardType="email-address" error={errors.credential} />
          ) : screen === 'forgot-otp' ? (
            <OtpBoxes otp={otp} setOtp={setOtp} />
          ) : (
            <>
              <Field value={password} onChangeText={setPassword} placeholder="Nouveau mot de passe" icon={Lock} secureTextEntry />
              <Field value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirmer" icon={Lock} secureTextEntry />
            </>
          )}
          {errors.otp ? <ErrorLine text={errors.otp} /> : null}
          {errors.password ? <ErrorLine text={errors.password} /> : null}
          <PrimaryButton
            label={loading ? 'Patientez...' : screen === 'forgot-password' ? 'Envoyer le code' : screen === 'forgot-otp' ? 'Vérifier' : 'Réinitialiser'}
            disabled={loading}
            onPress={() => {
              if (screen === 'forgot-password' && !validateEmail(credential)) return setErrors({ credential: 'Entrez un email valide.' });
              if (screen === 'forgot-password') {
                const targetEmail = credential.trim().toLowerCase();
                setOtpTarget(targetEmail);
                resetOtp(8);
                startResendCooldown();
                setLoading(true);
                formalioBackend
                  .resetPassword(targetEmail)
                  .then(() => {
                    showToast({ type: 'info', title: 'Code envoyé', message: 'Consultez votre email pour récupérer le compte.' });
                    navigate('forgot-otp');
                  })
                  .catch((error) => {
                    if (formalioBackend.isConfigured) setErrors({ credential: error instanceof Error ? error.message : "Impossible d'envoyer le code." });
                    else navigate('forgot-otp');
                  })
                  .finally(() => setLoading(false));
                return;
              }
              if (screen === 'forgot-otp') {
                if (otpValue.length < 8) return setErrors({ otp: 'Entrez le code a 8 chiffres.' });
                setLoading(true);
                formalioBackend
                  .verifyRecoveryOtp(otpTarget || credential, otpValue)
                  .then(() => navigate('reset-password'))
                  .catch((error) => setErrors({ otp: error instanceof Error ? error.message : 'Code invalide ou expire.' }))
                  .finally(() => setLoading(false));
                return;
              }
              if (!validatePassword(password)) return setErrors({ password: '8+ caracteres avec majuscule, minuscule et chiffre.' });
              if (password !== confirmPassword) return setErrors({ password: 'Les mots de passe ne correspondent pas.' });
              setLoading(true);
              formalioBackend
                .updatePassword(password)
                .then(async () => {
                  showToast({ type: 'success', title: 'Mot de passe modifie', message: 'Vous pouvez maintenant vous connecter.' });
                  await formalioBackend.signOut();
                  navigate('login');
                })
                .catch((error) => setErrors({ password: error instanceof Error ? error.message : 'Reinitialisation impossible.' }))
                .finally(() => setLoading(false));
            }}
          />
          {screen === 'forgot-otp' ? (
            <Tap
              disabled={!canResend}
              onPress={() => {
                if (!canResend) return;
                setLoading(true);
                formalioBackend
                  .resetPassword(otpTarget || credential)
                  .then(() => {
                    resetOtp(8);
                    startResendCooldown();
                    showToast({ type: 'info', title: 'Code renvoye', message: 'Verifiez votre boite email.' });
                  })
                  .catch((error) => setErrors({ otp: error instanceof Error ? error.message : "Impossible de renvoyer le code." }))
                  .finally(() => setLoading(false));
              }}
            >
              <Txt weight="semibold" style={{ color: c.formalio700, textAlign: 'center', fontSize: 12 }}>
                {canResend ? 'Renvoyer le code' : `Renvoyer dans ${resendRemaining}s`}
              </Txt>
            </Tap>
          ) : null}
        </View>
      </View>
    );
  }

  if ((screen as AuthScreen) === 'forgot-password' || (screen as AuthScreen) === 'forgot-otp' || (screen as AuthScreen) === 'reset-password') {
    return shell(
      <View style={styles.formScreen}>
        <Back target="login" />
        <AnimatedMascot state={screen === 'reset-password' ? 'secure' : 'thinking'} size={130} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center' }]}>
          {screen === 'forgot-password' ? 'Récupérer votre accès' : screen === 'forgot-otp' ? 'Code de vérification' : 'Nouveau mot de passe'}
        </Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>
          {screen === 'forgot-password' ? 'Recevez un code par email ou SMS pour réinitialiser votre mot de passe.' : screen === 'forgot-otp' ? 'Entrez le code de vérification envoyé à votre contact.' : 'Choisissez un mot de passe solide pour protéger vos données.'}
        </Txt>
        <View style={{ marginTop: 26, gap: 14, width: '100%' }}>
          {screen === 'forgot-password' ? (
            <Field
              label="Email ou téléphone"
              value={credential}
              onChangeText={(value) => setCredential(formatCredentialInput(value))}
              placeholder="marie@boutique.cm ou 6XX XXX XXX"
              icon={getCredentialKind(credential) === 'email' ? Mail : Phone}
              keyboardType="email-address"
              error={errors.credential}
            />
          ) : screen === 'forgot-otp' ? (
            <OtpBoxes otp={otp} setOtp={setOtp} />
          ) : (
            <>
              <Field value={password} onChangeText={setPassword} placeholder="Nouveau mot de passe" icon={Lock} secureTextEntry />
              <Field value={confirmPassword} onChangeText={setConfirmPassword} placeholder="Confirmer" icon={Lock} secureTextEntry />
            </>
          )}
          <PrimaryButton
            label={screen === 'forgot-password' ? 'Envoyer le code' : screen === 'forgot-otp' ? 'Vérifier' : 'Réinitialiser'}
            onPress={() => {
              if (screen === 'forgot-password' && !validateCredential(credential)) return setErrors({ credential: 'Entrez un email valide ou un numéro à 9 chiffres.' });
              if (screen === 'forgot-password') {
                formalioBackend
                  .resetPassword(credential)
                  .then(() => navigate('forgot-otp'))
                  .catch((error) => {
                    if (formalioBackend.isConfigured) setErrors({ credential: error instanceof Error ? error.message : "Impossible d'envoyer le code." });
                    else navigate('forgot-otp');
                  });
                return;
              }
              navigate(screen === 'forgot-otp' ? 'reset-password' : 'login');
            }}
          />
        </View>
      </View>
    );
  }

  if ((screen as AuthScreen) === 'phone') {
    return shell(
      <View style={styles.formScreen}>
        <Back target="login" />
        <AnimatedMascot state="secure" size={145} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center' }]}>Connexion SMS</Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>Entrez votre numéro. Formalio vous enverra un code OTP par SMS.</Txt>
        <View style={{ marginTop: 28, gap: 16 }}>
          <View style={styles.inputBox}>
            <Txt weight="medium" style={{ fontSize: 13, color: c.surface700 }}>CM +237</Txt>
            <View style={styles.vDivider} />
            <TextInput value={phone} onChangeText={(v) => setPhone(formatPhone(v))} keyboardType="phone-pad" placeholder="6XX XXX XXX" placeholderTextColor={c.surface400} maxFontSizeMultiplier={inputTextMaxScale} style={styles.textInput} />
          </View>
          {errors.phone ? <ErrorLine text={errors.phone} /> : null}
          <PrimaryButton
            label={loading ? 'Envoi...' : 'Recevoir le code'}
            icon={loading ? RefreshCw : ChevronRight}
            disabled={loading}
            onPress={() => {
              if (!validatePhone(phone)) return setErrors({ phone: 'Entrez un numéro camerounais à 9 chiffres.' });
              setOtpTarget(phone);
              resetOtp(6);
              setLoading(true);
              formalioBackend
                .signInWithPhoneOtp(phone, false)
                .then(() => {
                  showToast({ type: 'info', title: 'Code SMS envoyé', message: 'Entrez le code reçu sur votre téléphone.' });
                  navigate('otp');
                })
                .catch((error) => {
                  if (formalioBackend.isConfigured) setErrors({ phone: error instanceof Error ? error.message : 'Impossible d envoyer le SMS.' });
                  else navigate('otp');
                })
                .finally(() => setLoading(false));
            }}
          />
        </View>
      </View>
    );
  }

  if ((screen as AuthScreen) === 'phone') {
    return shell(
      <View style={styles.formScreen}>
        <Back target="signup" />
        <AnimatedMascot state="secure" size={145} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center' }]}>Vérification téléphone</Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>Nous envoyons un code SMS pour sécuriser votre compte Formalio.</Txt>
        <View style={{ marginTop: 28, gap: 16 }}>
          <View style={styles.inputBox}>
            <Txt weight="medium" style={{ fontSize: 13, color: c.surface700 }}>🇨🇲 +237</Txt>
            <View style={styles.vDivider} />
            <TextInput value={phone} onChangeText={(v) => setPhone(formatPhone(v))} keyboardType="phone-pad" placeholder="6XX XXX XXX" placeholderTextColor={c.surface400} maxFontSizeMultiplier={inputTextMaxScale} style={styles.textInput} />
          </View>
          <PrimaryButton label={loading ? 'Envoi...' : 'Recevoir le code'} icon={ChevronRight} disabled={loading} onPress={() => simulateLoading('otp', 1000)} />
        </View>
      </View>
    );
  }

  if ((screen as AuthScreen) === 'otp') {
    return shell(
      <View style={styles.formScreen}>
        <Back target="phone" />
        <AnimatedMascot state="thinking" size={145} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center' }]}>Entrez le code SMS</Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>Code envoyé au +237 {phone || '6XX XXX XXX'}</Txt>
        <View style={{ marginTop: 28, gap: 20 }}>
          <OtpBoxes otp={otp} setOtp={setOtp} />
          {errors.otp ? <ErrorLine text={errors.otp} /> : null}
          <PrimaryButton
            label={loading ? 'Vérification...' : 'Vérifier'}
            disabled={loading}
            onPress={() => {
              if (otpValue.length < 6) return setErrors({ otp: 'Entrez le code a 6 chiffres.' });
              setLoading(true);
              formalioBackend
                .verifyPhoneOtp(otpTarget || phone, otpValue)
                .then(() => {
                  showToast({ type: 'success', title: 'Téléphone vérifié', message: 'Connexion sécurisée active.' });
                  onComplete(false);
                })
                .catch((error) => setErrors({ otp: error instanceof Error ? error.message : 'Code SMS invalide ou expire.' }))
                .finally(() => setLoading(false));
            }}
          />
          <Tap
            onPress={() => {
              setLoading(true);
              formalioBackend
                .resendPhoneOtp(otpTarget || phone)
                .then(() => {
                  resetOtp(6);
                  showToast({ type: 'info', title: 'Code renvoye', message: 'Verifiez vos SMS.' });
                })
                .catch((error) => setErrors({ otp: error instanceof Error ? error.message : 'Impossible de renvoyer le SMS.' }))
                .finally(() => setLoading(false));
            }}
          >
            <Txt weight="semibold" style={{ color: c.formalio700, textAlign: 'center', fontSize: 12 }}>Renvoyer le code</Txt>
          </Tap>
        </View>
      </View>
    );
  }

  if ((screen as AuthScreen) === 'otp') {
    return shell(
      <View style={styles.formScreen}>
        <Back target="phone" />
        <AnimatedMascot state="thinking" size={145} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center' }]}>Entrez le code</Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>Code envoyé au +237 {phone || '6XX XXX XXX'}</Txt>
        <View style={{ marginTop: 28, gap: 20 }}>
          <OtpBoxes otp={otp} setOtp={setOtp} />
          <PrimaryButton label={loading ? 'Vérification...' : 'Vérifier'} disabled={loading} onPress={() => simulateLoading('biometric-setup', 900)} />
          <Tap>
            <Txt weight="semibold" style={{ color: c.formalio700, textAlign: 'center', fontSize: 12 }}>Renvoyer le code</Txt>
          </Tap>
        </View>
      </View>
    );
  }

  if (screen === 'biometric-setup') {
    return shell(
      <View style={[styles.formScreen, { alignItems: 'center' }]}>
        <View style={styles.biometricCircle}>
          <Icon icon={Fingerprint} size={58} color={c.formalio700} strokeWidth={1.8} />
        </View>
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center' }]}>Activer la biométrie ?</Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>Connectez-vous plus vite tout en gardant vos finances protégées.</Txt>
        <View style={{ width: '100%', marginTop: 34, gap: 12 }}>
          {errors.biometric ? <ErrorLine text={errors.biometric} /> : null}
          <PrimaryButton label={biometricLoading ? 'Vérification...' : `Activer ${biometricLabel}`} icon={biometricLoading ? RefreshCw : Shield} disabled={biometricLoading} onPress={() => runBiometricAuth('setup')} />
          <PrimaryButton label="Plus tard" tone="surface" onPress={() => navigate('success')} />
        </View>
      </View>
    );
  }

  if (screen === 'welcome-back') {
    const displayName = profile.ownerFullName?.trim() || name.trim() || email.split('@')[0] || 'Formalio user';
    const recentSample = transactions.slice(0, 6);
    const recentNet = recentSample.reduce((sum, item) => sum + (item.type === 'income' ? item.amount : -item.amount), 0);
    const unreadCount = notifications.filter((item) => !item.read).length;
    const activityLabel = metrics.emptyState
      ? 'Aucune activité enregistrée pour ce compte.'
      : `${metrics.revenueCount} revenus · ${metrics.expenseCount} dépenses`;
    return shell(
      <LinearGradient colors={[c.formalio50, c.white]} style={[styles.successScreen, { minHeight: authMinHeight }]}>
        <AnimatedMascot state="celebrate" size={compactAuth ? 118 : 150} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center', marginTop: 18 }]}>Happy to see you, {displayName}.</Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center', marginTop: 10 }]}>Votre espace Formalio est synchronisé avec vos données réelles.</Txt>
        <Card style={styles.welcomeBackCard}>
          <Txt weight="black" style={{ color: c.surface900, fontSize: 13, marginBottom: 12 }}>Aperçu rapide</Txt>
          {[
            ['Transactions récentes', `${recentSample.length} · ${formatFCFA(recentNet)}`, c.formalio700],
            ['Notifications', unreadCount ? `${unreadCount} à lire` : 'Aucune alerte', unreadCount ? c.gold600 : c.surface500],
            ['Activité', activityLabel, metrics.emptyState ? c.surface500 : c.info600],
          ].map(([label, value, color]) => (
            <Row key={label} style={styles.welcomeBackRow}>
              <Txt style={{ color: c.surface600, fontSize: 12 }}>{label}</Txt>
              <Txt weight="bold" numberOfLines={1} style={{ color, fontSize: 12, flexShrink: 1, textAlign: 'right' }}>{value}</Txt>
            </Row>
          ))}
        </Card>
        <PrimaryButton label="Accéder au tableau de bord" icon={ChevronRight} onPress={() => onComplete(false)} style={[styles.authPrimaryButton, { width: '100%', marginTop: 24 }]} />
      </LinearGradient>
    );
  }

  return shell(
    <View style={styles.successScreen}>
      <AnimatedMascot state="celebrate" size={160} />
      <View style={styles.checkBig}>
        <Icon icon={Check} size={40} color={c.formalio600} strokeWidth={3} />
      </View>
      <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center', marginTop: 22 }]}>Tout est prêt !</Txt>
      <Txt style={[styles.authSubtitle, { textAlign: 'center' }]}>Votre compte Formalio est activé. Bienvenue dans votre nouvelle vie financière !</Txt>
      <PrimaryButton label="Commencer l'aventure" icon={ChevronRight} onPress={() => onComplete(true)} style={{ width: '100%', marginTop: 36 }} />
    </View>
  );
}

function OtpBoxes({ otp, setOtp }: { otp: string[]; setOtp: (v: string[]) => void }) {
  const refs = useRef<(TextInput | null)[]>([]);
  return (
    <Row style={{ justifyContent: 'center', gap: 8 }}>
      {otp.map((digit, i) => (
        <TextInput
          key={i}
          ref={(ref) => {
            refs.current[i] = ref;
          }}
          value={digit}
          onChangeText={(text) => {
            const next = [...otp];
            next[i] = text.replace(/\D/g, '').slice(-1);
            setOtp(next);
            if (text && i < otp.length - 1) refs.current[i + 1]?.focus();
          }}
          keyboardType="numeric"
          maxFontSizeMultiplier={inputTextMaxScale}
          maxLength={1}
          style={styles.otpBox}
        />
      ))}
    </Row>
  );
}

function ErrorLine({ text }: { text: string }) {
  return (
    <Row style={{ gap: 5, marginTop: 6 }}>
      <Icon icon={AlertTriangle} size={13} color={c.danger600} />
      <Txt style={{ color: c.danger600, fontSize: 12 }}>{text}</Txt>
    </Row>
  );
}

function Divider({ label }: { label: string }) {
  return (
    <Row style={{ gap: 12, marginVertical: 2 }}>
      <View style={styles.dividerLine} />
      <Txt weight="medium" style={{ color: c.surface400, fontSize: 12 }}>{label}</Txt>
      <View style={styles.dividerLine} />
    </Row>
  );
}

function InlineLink({ text, action, onPress }: { text: string; action: string; onPress: () => void }) {
  return (
    <Row style={{ justifyContent: 'center', marginTop: 24, gap: 4, paddingBottom: 24 }}>
      <Txt style={{ color: c.surface500, fontSize: 14 }}>{text}</Txt>
      <Tap onPress={onPress}>
        <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 14 }}>{action}</Txt>
      </Tap>
    </Row>
  );
}

function MosikaScore({ score = 0, showDetails = true, metrics = emptyFinancialMetrics }: { score?: number; showDetails?: boolean; metrics?: CloudFinancialMetrics }) {
  const safeMetrics: CloudFinancialMetrics = { ...emptyFinancialMetrics, ...(metrics ?? {}) };
  const numeric = (value: unknown, fallback = 0) => {
    const next = Number(value);
    return Number.isFinite(next) ? next : fallback;
  };
  const safeScore = Math.max(0, Math.min(1000, Math.round(numeric(score, safeMetrics.mosikaScore))));
  const safeConfidence = Math.max(0, Math.min(100, Math.round(numeric(safeMetrics.scoreConfidence))));
  const safeHealth = Math.max(0, Math.min(100, Math.round(numeric(safeMetrics.financialHealth))));
  const safeGrowth = numeric(safeMetrics.growthRate);
  const level = safeScore >= 820 && safeConfidence >= 70
    ? { label: 'Institutionnel', risk: 'Faible', color: c.formalio500 }
    : safeScore >= 700 && safeConfidence >= 55
      ? { label: 'Solide', risk: 'Modere', color: '#22c55e' }
      : safeScore >= 560
        ? { label: 'En construction', risk: 'Surveille', color: c.gold500 }
        : safeScore >= 350
          ? { label: 'Risque eleve', risk: 'Eleve', color: c.gold600 }
          : { label: 'Non etabli', risk: 'Non evalue', color: c.danger500 };
  const circumference = 264;
  const factor = (key: string) => Math.max(0, Math.min(100, Math.round(numeric(safeMetrics.scoreFactors?.[key]))));
  const scoreMetrics = [
    { label: 'Santé financière', value: `${safeHealth}%`, icon: Shield, bg: c.formalio50, color: c.formalio700 },
    { label: 'Risque', value: `${Math.max(0, 100 - safeHealth)}%`, icon: Zap, bg: c.gold50, color: c.gold600 },
    { label: 'Confiance modèle', value: `${safeConfidence}%`, icon: Award, bg: c.info50, color: c.info600 },
    { label: 'Croissance', value: `${safeGrowth.toFixed(1)}%`, icon: TrendingUp, bg: c.formalio50, color: c.formalio700 },
  ];
  const cashflowHistory = Array.isArray(safeMetrics.dailyCashflow) ? safeMetrics.dailyCashflow : [];
  const historyData = (cashflowHistory.length ? cashflowHistory.slice(-6) : Array.from({ length: 6 }, (_, index) => ({ label: `M${index + 1}` }))).map((item, index) => ({
    label: item.label,
    score: safeMetrics.emptyState ? 0 : Math.max(0, Math.min(1000, safeScore - (5 - index) * Math.max(2, Math.round(Math.abs(safeGrowth) / 10)))),
  }));
  const performanceMetrics = [
    ['Historique verifie', safeConfidence],
    ['Revenus stables', factor('revenueConsistency')],
    ['Maturite temps', factor('stability')],
    ['Discipline depenses', factor('expenseDiscipline')],
  ] as const;
  return (
    <View style={{ gap: 12, paddingBottom: 16 }}>
      <LinearGradient colors={[c.formalio900, c.formalio800, c.formalio700]} style={styles.scoreHero}>
        <View style={[styles.softOrb, { right: -50, top: -50, backgroundColor: 'rgba(52,211,153,.18)' }]} />
        <View style={[styles.softOrb, { left: -60, bottom: -70, backgroundColor: 'rgba(255,255,255,.1)' }]} />
        <Row style={{ justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Pill style={{ alignSelf: 'flex-start', backgroundColor: 'rgba(255,255,255,.1)' }}>
              <Txt weight="semibold" style={{ color: c.formalio200, fontSize: 11 }}>✦ Mosika Score</Txt>
            </Pill>
            <Row style={{ alignItems: 'flex-end', gap: 8, marginTop: 14 }}>
              <Txt weight="black" style={{ fontSize: 52, color: c.white, lineHeight: 56 }}>{safeScore}</Txt>
              <View style={{ paddingBottom: 7 }}>
                <Txt weight="bold" style={{ color: level.color, fontSize: 14 }}>{level.label}</Txt>
                <Txt style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>Risque {level.risk}</Txt>
              </View>
            </Row>
            <Txt style={{ marginTop: 8, maxWidth: 190, color: 'rgba(255,255,255,.65)', fontSize: 12, lineHeight: 17 }}>
              Score institutionnel strict: il progresse lentement avec historique, regularite, justificatifs et conformite.
            </Txt>
          </View>
          <View style={{ width: 112, height: 112 }}>
            <Svg width={112} height={112} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="9" />
              <Circle cx="50" cy="50" r="42" fill="none" stroke={level.color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${circumference}`} strokeDashoffset={circumference - (safeScore / 1000) * circumference} rotation="-90" origin="50,50" />
            </Svg>
            <View style={styles.scoreRingCenter}>
              <Icon icon={Shield} size={24} color="rgba(255,255,255,.82)" />
              <Txt weight="semibold" style={{ color: 'rgba(255,255,255,.55)', fontSize: 10, marginTop: 3 }}>/1000</Txt>
            </View>
          </View>
        </Row>
        <Grid columns={3} gap={8}>
          {[
            ['Niveau', level.label],
            ['Risque', level.risk],
            ['Confiance', `${safeConfidence}%`],
          ].map(([label, value]) => (
            <View key={label} style={styles.scoreChip}>
              <Txt weight="semibold" style={{ color: 'rgba(255,255,255,.45)', fontSize: 9, letterSpacing: 0 }}>{label.toUpperCase()}</Txt>
              <Txt weight="bold" numberOfLines={1} style={{ color: c.white, fontSize: 12, marginTop: 2 }}>{value}</Txt>
            </View>
          ))}
        </Grid>
      </LinearGradient>
      {showDetails ? (
        <>
          <Grid columns={2} gap={8}>
            {scoreMetrics.map((metric) => (
              <Card key={metric.label} style={{ padding: 12 }}>
                <View style={[styles.metricIcon, { backgroundColor: metric.bg }]}>
                  <Icon icon={metric.icon} size={16} color={metric.color} />
                </View>
                <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 8 }}>{metric.label}</Txt>
                <Txt weight="black" style={{ color: c.surface900, fontSize: 18, marginTop: 2 }}>{metric.value}</Txt>
              </Card>
            ))}
          </Grid>
          <Card style={{ padding: 14 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Txt weight="bold" style={{ fontSize: 14 }}>Score Evolution</Txt>
              <Pill>+15 ce mois</Pill>
            </Row>
            <AreaChart data={historyData} keys={['score']} colors={[c.formalio800]} height={116} />
          </Card>
          <Card style={{ padding: 14 }}>
            <Txt weight="bold" style={{ fontSize: 14, marginBottom: 12 }}>SME Performance Metrics</Txt>
            {performanceMetrics.map(([label, value]) => (
              <View key={String(label)} style={{ marginBottom: 12 }}>
                <Row style={{ justifyContent: 'space-between', marginBottom: 5 }}>
                  <Txt weight="medium" style={{ color: c.surface600, fontSize: 12 }}>{label}</Txt>
                  <Txt weight="bold" style={{ fontSize: 12 }}>{value}%</Txt>
                </Row>
                <ValueBar value={Number(value)} color={c.formalio700} />
              </View>
            ))}
          </Card>
          <View style={styles.adviceCard}>
            <Icon icon={CheckCircle2} size={20} color={c.formalio700} />
            <View style={{ flex: 1 }}>
              <Txt weight="bold" style={{ fontSize: 13 }}>Conseil Mosika</Txt>
              <Txt style={{ color: c.surface600, fontSize: 12, marginTop: 4, lineHeight: 17 }}>{safeMetrics.emptyState ? 'Ajoutez des transactions réelles pour faire évoluer votre score.' : 'Complétez la vérification, classez vos transactions et générez vos rapports pour renforcer votre score.'}</Txt>
            </View>
          </View>
        </>
      ) : null}
    </View>
  );
}

function BusinessSetupScreen({
  businessName,
  setBusinessName,
  businessType,
  setBusinessType,
  navigate,
  shellProps,
}: {
  businessName: string;
  setBusinessName: (v: string) => void;
  businessType: string;
  setBusinessType: (v: string) => void;
  navigate: (s: Screen) => void;
  shellProps: ShellProps;
}) {
  const { showToast } = useToast();
  return (
    <ScreenWrapper {...shellProps} title="Votre Entreprise" showBack={false}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <AnimatedMascot state="pointing" size={100} />
        <Txt weight="semibold" style={{ fontSize: 18, marginTop: 8 }}>Parlez-nous de vous</Txt>
        <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 4 }}>Quelques infos pour personnaliser Formalio</Txt>
      </View>
      <View style={{ gap: 16 }}>
        <Field label="Nom de l'entreprise" value={businessName} onChangeText={setBusinessName} placeholder="Ex: Boutique Élégance" />
        <View>
          <Txt weight="medium" style={styles.fieldLabel}>Type d'activité</Txt>
          <Grid columns={2} gap={8}>
            {['Commerce', 'Restauration', 'Transport', 'Services', 'Agriculture', 'Artisanat'].map((type) => (
              <Tap key={type} onPress={() => setBusinessType(type)} style={[styles.choiceCard, businessType === type && styles.choiceSelected]}>
                <Txt weight="medium" style={{ color: businessType === type ? c.formalio700 : c.surface600, fontSize: 13, textAlign: 'center' }}>{type}</Txt>
              </Tap>
            ))}
          </Grid>
        </View>
        <Field label="Localisation" value="Douala, Cameroun" onChangeText={() => undefined} icon={MapPin} />
      </View>
      <PrimaryButton
        label="Créer Mon Compte"
        icon={Check}
        style={{ marginTop: 24 }}
        onPress={() => {
          setBusinessName(businessName || 'Mon entreprise');
          showToast({ type: 'success', title: 'Compte créé !', message: 'Bienvenue sur Formalio' });
          navigate('dashboard');
        }}
      />
    </ScreenWrapper>
  );
}

type ShellProps = {
  showNav: boolean;
  activeTab: string;
  navigate: (s: Screen) => void;
  goBack: () => void;
  setActiveTab: (tab: string) => void;
  openAi?: () => void;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  notifications: typeof initialNotifications;
  pendingSyncCount?: number;
};

function tabForScreen(screen: Screen) {
  if (screen === 'dashboard') return 'home';
  if (screen === 'transactions') return 'transactions';
  if (screen === 'add-transaction' || screen === 'fiche' || screen === 'retrait') return 'add';
  if (screen === 'reports' || screen === 'accounting' || screen === 'tax' || screen === 'fiche-detail') return 'reports';
  if (['profile', 'settings', 'security', 'subscription', 'help', 'referral', 'offline', 'mobile-money', 'versements'].includes(screen)) return 'profile';
  return undefined;
}

function transactionDateMs(value?: string) {
  const parsed = value ? Date.parse(value) : NaN;
  return Number.isNaN(parsed) ? Date.now() : parsed;
}

function transactionToLocalRow(transaction: Transaction, userId: string, companyId: string | null) {
  const recordedAt = transactionDateMs(transaction.date);
  const syncStatus = ((transaction as Transaction & { syncStatus?: string }).syncStatus ?? 'synced') as import('@/types/database.types').SyncStatus;
  const deletedAt = (transaction as Transaction & { deletedAt?: string | null }).deletedAt;
  return {
    id: String(transaction.id),
    local_id: String(transaction.id),
    cloud_id: typeof transaction.id === 'string' && transaction.id.includes('-') ? transaction.id : null,
    user_id: userId,
    company_id: companyId,
    type: transaction.type,
    amount: transaction.amount,
    category: transaction.category,
    description: transaction.description ?? null,
    payment_method: transaction.method ?? null,
    entry_method: 'manual',
    status: transaction.status,
    recorded_at: recordedAt,
    created_at: recordedAt,
    updated_at: recordedAt,
    deleted_at: deletedAt ? transactionDateMs(deletedAt) : null,
    is_deleted: Boolean(deletedAt),
    is_synced: syncStatus === 'synced',
    sync_status: syncStatus,
    sync_action: null,
    sync_attempts: 0,
    sync_error: null,
    created_offline: false,
    updated_offline: false,
    version: 1,
  };
}

function localRowToTransaction(row: Record<string, unknown>): Transaction {
  const type = row.type === 'expense'
    ? 'expense'
    : row.type === 'retrait'
      ? 'retrait'
      : row.type === 'fiche_reconciliation'
        ? 'fiche_reconciliation'
        : 'income';
  const recordedAt = Number(row.recorded_at ?? row.created_at ?? Date.now());
  return {
    id: String(row.id),
    date: new Date(recordedAt).toISOString().slice(0, 10),
    description: String(row.description ?? 'Transaction'),
    category: String(row.category ?? 'Autres'),
    type,
    amount: Number(row.amount ?? 0),
    method: String(row.payment_method ?? 'Espèces'),
    status: String(row.status ?? 'completed'),
    ...({ syncStatus: row.sync_status ?? 'synced' } as Partial<Transaction>),
    ...(row.deleted_at ? { deletedAt: new Date(Number(row.deleted_at)).toISOString() } : {}),
  };
}

async function persistTransactionSnapshot(transactions: Transaction[], userId: string | null, companyId: string | null) {
  await AsyncStorage.setItem(TRANSACTIONS_STORAGE_KEY, JSON.stringify(transactions)).catch(() => undefined);
  if (!userId || Platform.OS === 'web') return;

  await Promise.allSettled(
    transactions.slice(0, 200)
      .filter((transaction) => (transaction as Transaction & { syncStatus?: string }).syncStatus !== 'pending')
      .map((transaction) =>
        upsertCloudRecordLocally('transactions', transactionToLocalRow(transaction, userId, companyId)),
    ),
  );
}

async function loadLocalTransactions(userId: string | null) {
  if (userId && Platform.OS !== 'web') {
    try {
      const rows = await repositories.transactions.getRecords(userId, { limit: 200 });
      if (rows.length > 0) return rows.map((row) => localRowToTransaction(row as unknown as Record<string, unknown>));
    } catch {
      // AsyncStorage is kept as a relaunch fallback when SQLite is temporarily unavailable.
    }
  }

  const raw = await AsyncStorage.getItem(TRANSACTIONS_STORAGE_KEY).catch(() => null);
  if (!raw) return [];
  try {
    const parsed = JSON.parse(raw) as Transaction[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function PrototypeApp() {
  const [fontsLoaded] = useFonts({
    Inter_300Light,
    Inter_400Regular,
    Inter_500Medium,
    Inter_600SemiBold,
    Inter_700Bold,
    Inter_800ExtraBold,
    Inter_900Black,
  });

  if (!fontsLoaded) {
    return (
      <LinearGradient colors={[c.formalio900, c.formalio950]} style={styles.authFull}>
        <LogoMark size={92} />
        <ActivityIndicator color={c.formalio400} style={{ marginTop: 28 }} />
      </LinearGradient>
    );
  }

  return (
    <ToastProvider>
      <StatusfulPrototype />
    </ToastProvider>
  );
}

function StatusfulPrototype() {
  const { showToast } = useToast();
  const isOnline = useNetworkStore((state) => state.isOnline);
  const authUserId = useAuthStore((state) => state.user?.id);
  const setAuthUser = useAuthStore((state) => state.setUser);
  const logoutAuthStore = useAuthStore((state) => state.logout);
  const [screen, setScreen] = useState<Screen>('auth');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState<BusinessProfile>(defaultBusinessProfile);
  const [pendingScan, setPendingScan] = useState<ScannedTicketData | null>(null);
  const [pendingFicheDraft, setPendingFicheDraft] = useState<FicheDraftPayload | null>(null);
  const [lastFicheCompletedAt, setLastFicheCompletedAt] = useState<number | null>(null);
  const [ficheDocuments, setFicheDocuments] = useState<FicheDocumentRecord[]>([]);
  const [selectedFicheDocument, setSelectedFicheDocument] = useState<FicheDocumentRecord | null>(null);
  const [versements, setVersements] = useState<VersementItem[]>([]);
  const [treasuryBalanceOverride, setTreasuryBalanceOverride] = useState<number | null>(null);
  const treasuryBalanceOverrideRef = useRef<number | null>(null);
  const navigationHistoryRef = useRef<Screen[]>(['auth']);
  const lastBackPressRef = useRef(0);
  const [loanRequests, setLoanRequests] = useState<LoanRequestRecord[]>([]);
  const [aiAssistantOpen, setAiAssistantOpen] = useState(false);
  const [voiceRecorderOpen, setVoiceRecorderOpen] = useState(false);
  const [scannerOpen, setScannerOpen] = useState(false);
  const [downloadModalOpen, setDownloadModalOpen] = useState(false);
  const [downloadReportInfo, setDownloadReportInfo] = useState({
    title: '',
    period: '',
    type: 'dashboard_summary' as BackendReportType,
    periodStart: '',
    periodEnd: '',
  });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [notifications, setNotifications] = useState<typeof initialNotifications>([]);
  const [financialMetrics, setFinancialMetrics] = useState<CloudFinancialMetrics>(emptyFinancialMetrics);
  const [subscription, setSubscription] = useState<CloudSubscription>(defaultSubscription);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cloudCompanyId, setCloudCompanyId] = useState<string | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);
  const [cloudSyncState, setCloudSyncState] = useState<CloudSyncState>('idle');
  const [cloudSyncMessage, setCloudSyncMessage] = useState<string | null>(null);
  const [lastCloudSyncAt, setLastCloudSyncAt] = useState<Date | null>(null);
  const [pendingSyncCount, setPendingSyncCount] = useState(0);
  const cloudErrorToastShownRef = useRef(false);
  const cloudRetryCountRef = useRef(0);
  const hydrateStock = useStockStore((state) => state.hydrate);
  const replaceStockItems = useStockStore((state) => state.replaceItems);

  const showNav = !['auth', 'business-setup', 'data-restore'].includes(screen);
  const commitVisibleTreasuryBalance = useCallback((balance: number) => {
    const safeBalance = Math.max(0, Number(balance) || 0);
    treasuryBalanceOverrideRef.current = safeBalance;
    setTreasuryBalanceOverride(safeBalance);
    setFinancialMetrics((current) => ({ ...current, balance: safeBalance, cashFlow: safeBalance }));
    void AsyncStorage.setItem(
      TREASURY_BALANCE_STORAGE_KEY,
      JSON.stringify({ balance: safeBalance, updatedAt: Date.now() }),
    ).catch(() => undefined);
  }, []);
  const navigate = useCallback((next: Screen) => {
    const nextTab = tabForScreen(next);
    if (nextTab) setActiveTab(nextTab);
    setScreen((current) => {
      const history = navigationHistoryRef.current;
      if (history[history.length - 1] !== current) history.push(current);
      if (history[history.length - 1] !== next) history.push(next);
      return next;
    });
  }, []);
  const goBack = useCallback(() => {
    const history = navigationHistoryRef.current;
    if (history[history.length - 1] !== screen) history.push(screen);
    while (history.length > 1 && history[history.length - 1] === screen) {
      history.pop();
      const previous = history[history.length - 1];
      if (previous && previous !== screen) {
        const previousTab = tabForScreen(previous);
        if (previousTab) setActiveTab(previousTab);
        setScreen(previous);
        return true;
      }
    }
    const backMap: Partial<Record<Screen, Screen>> = {
      auth: 'auth',
      'business-setup': 'auth',
      dashboard: 'dashboard',
      transactions: 'dashboard',
      'add-transaction': 'transactions',
      fiche: 'add-transaction',
      'fiche-detail': 'reports',
      retrait: 'add-transaction',
      versements: 'profile',
      'data-restore': 'dashboard',
      stock: 'cashflow',
      cashflow: 'dashboard',
      'credit-score': 'dashboard',
      reports: 'dashboard',
      'mobile-money': 'profile',
      notifications: 'dashboard',
      'ai-insights': 'dashboard',
      tax: 'dashboard',
      profile: 'dashboard',
      settings: 'profile',
      security: 'settings',
      subscription: 'profile',
      help: 'profile',
      referral: 'profile',
      offline: 'dashboard',
      accounting: 'dashboard',
    };
    const next = backMap[screen] || 'dashboard';
    if (next === screen) return false;
    const nextTab = tabForScreen(next);
    if (nextTab) setActiveTab(nextTab);
    navigationHistoryRef.current = [next];
    setScreen(next);
    return true;
  }, [screen]);
  const shellProps = { showNav, activeTab, navigate, goBack, setActiveTab, openAi: () => setAiAssistantOpen(true), offlineMode, setOfflineMode, notifications, pendingSyncCount };
  const appLanguage = profile.language ?? 'fr';
  setCurrentAppLanguage(appLanguage);
  const withLanguage = (children: React.ReactNode) => (
    <AppLanguageContext.Provider value={appLanguage}>
      {children}
    </AppLanguageContext.Provider>
  );

  useEffect(() => {
    treasuryBalanceOverrideRef.current = treasuryBalanceOverride;
  }, [treasuryBalanceOverride]);

  useEffect(() => {
    if (Platform.OS !== 'android') return undefined;
    const subscription = BackHandler.addEventListener('hardwareBackPress', () => {
      if (downloadModalOpen) {
        setDownloadModalOpen(false);
        return true;
      }
      if (scannerOpen) {
        setScannerOpen(false);
        return true;
      }
      if (voiceRecorderOpen) {
        setVoiceRecorderOpen(false);
        return true;
      }
      if (aiAssistantOpen) {
        setAiAssistantOpen(false);
        return true;
      }
      if (screen !== 'dashboard' && screen !== 'auth') {
        return goBack();
      }
      const now = Date.now();
      if (now - lastBackPressRef.current < 2000) {
        BackHandler.exitApp();
        return true;
      }
      lastBackPressRef.current = now;
      ToastAndroid.show('Press back again to exit', ToastAndroid.SHORT);
      return true;
    });
    return () => subscription.remove();
  }, [aiAssistantOpen, downloadModalOpen, goBack, scannerOpen, screen, voiceRecorderOpen]);

  useEffect(() => {
    hydrateStock();
  }, [hydrateStock]);

  useEffect(() => {
    let active = true;
    void loadTrustedOfflineSession().then(async (trusted) => {
      if (!active || !trusted) return;
      setAuthUser(trusted.snapshot.user);
      setProfile(trusted.snapshot.profile as BusinessProfile);
      setCloudCompanyId(trusted.snapshot.companyId);
      setSubscription(trusted.snapshot.subscription ?? defaultSubscription);
      setBusinessName(trusted.snapshot.profile.storeName);
      setBusinessType(trusted.snapshot.profile.category);
      setOfflineMode(!isOnline);
      setCloudSyncState(isOnline ? 'idle' : 'offline');
      setCloudSyncMessage(isOnline ? null : 'Mode hors ligne. Vos données locales restent disponibles et seront synchronisées plus tard.');
      const localTransactions = await loadLocalTransactions(trusted.snapshot.user.id);
      if (!active) return;
      if (localTransactions.length > 0) {
        setTransactions(localTransactions);
        setFinancialMetrics((current) => calculateLocalFinancialMetrics(localTransactions, trusted.snapshot.profile as BusinessProfile, current.reportCount, current.documentCount));
      }
      navigationHistoryRef.current = ['dashboard'];
      setActiveTab('home');
      setScreen('dashboard');
    });
    return () => {
      active = false;
    };
  }, [isOnline, setAuthUser]);

  useEffect(() => {
    let cancelled = false;
    const refresh = async () => {
      const count = await getTrustedPendingSyncCount(authUserId);
      if (!cancelled) setPendingSyncCount(count);
    };
    void refresh();
    const timer = setInterval(refresh, 15000);
    return () => {
      cancelled = true;
      clearInterval(timer);
    };
  }, [authUserId, transactions, cloudSyncState]);

  useEffect(() => {
    void AsyncStorage.getItem(FICHE_LAST_COMPLETED_AT_KEY)
      .then((value) => setLastFicheCompletedAt(value ? Number(value) : null))
      .catch(() => undefined);
    void AsyncStorage.getItem(FICHE_PENDING_DRAFT_KEY)
      .then((value) => {
        if (!value) return;
        setPendingFicheDraft(JSON.parse(value) as FicheDraftPayload);
      })
      .catch(() => undefined);
    void AsyncStorage.getItem(FICHE_DOCUMENTS_KEY)
      .then((value) => {
        if (!value) return;
        const parsed = JSON.parse(value) as FicheDocumentRecord[];
        if (Array.isArray(parsed)) setFicheDocuments(parsed);
      })
      .catch(() => undefined);
    void AsyncStorage.getItem(VERSEMENTS_STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        const parsed = JSON.parse(value) as VersementItem[];
        if (Array.isArray(parsed)) setVersements(parsed);
      })
      .catch(() => undefined);
    void AsyncStorage.getItem(TREASURY_BALANCE_STORAGE_KEY)
      .then((value) => {
        if (!value) return;
        const parsed = JSON.parse(value) as { balance?: number };
        const balance = Number(parsed?.balance);
        if (Number.isFinite(balance)) commitVisibleTreasuryBalance(balance);
      })
      .catch(() => undefined);
  }, [commitVisibleTreasuryBalance]);

  const handleInvalidCloudSession = useCallback((message?: string) => {
    void clearTrustedOfflineSession();
    void logoutAuthStore();
    setCloudCompanyId(null);
    setTransactions([]);
    replaceStockItems([]);
    setNotifications([]);
    setLoanRequests([]);
    treasuryBalanceOverrideRef.current = null;
    setTreasuryBalanceOverride(null);
    void AsyncStorage.removeItem(TREASURY_BALANCE_STORAGE_KEY).catch(() => undefined);
    setFinancialMetrics(emptyFinancialMetrics);
    setSubscription(defaultSubscription);
    setCloudSyncState('idle');
    setCloudSyncMessage(null);
    navigationHistoryRef.current = ['auth'];
    setScreen('auth');
    showToast({
      type: 'error',
      title: 'Session expirée',
      message: message ?? 'Reconnectez-vous pour continuer la synchronisation.',
    });
  }, [logoutAuthStore, replaceStockItems, showToast]);

  const hydrateCloudData = useCallback(async (showReadyToast = false) => {
    if (!formalioBackend.isConfigured) return false;
    if (!isOnline) {
      setOfflineMode(true);
      setCloudSyncState('offline');
      setCloudSyncMessage('Connexion internet indisponible. Formalio relancera la synchronisation au retour du réseau.');
      return false;
    }
    setCloudLoading(true);
    setCloudSyncState('syncing');
    try {
      const data = await formalioBackend.bootstrap();
      if (!data) {
        setCloudSyncState('idle');
        return false;
      }
      const reconciledStockItems = await reconcileStockItemsWithCloud(data.companyId, data.stockItems ?? []);
      setCloudCompanyId(data.companyId);
      setProfile(data.profile as BusinessProfile);
      setTransactions(data.transactions);
      replaceStockItems(reconciledStockItems);
      setFinancialMetrics(() => {
        const nextMetrics = data.metrics ?? emptyFinancialMetrics;
        const pinnedBalance = treasuryBalanceOverrideRef.current;
        return pinnedBalance == null ? nextMetrics : { ...nextMetrics, balance: pinnedBalance, cashFlow: pinnedBalance };
      });
      setSubscription(data.subscription ?? defaultSubscription);
      setNotifications(data.notifications);
      setLoanRequests(data.loanRequests as LoanRequestRecord[]);
      const currentSession = await formalioBackend.getCurrentSession().catch(() => null);
      const trusted = await saveTrustedOfflineSession({
        session: currentSession,
        companyId: data.companyId,
        profile: data.profile,
        subscription: data.subscription ?? defaultSubscription,
      }).catch(() => null);
      if (trusted) setAuthUser(trusted.snapshot.user);
      await persistTransactionSnapshot(data.transactions, currentSession?.user.id ?? authUserId ?? null, data.companyId);
      setOfflineMode(false);
      setCloudSyncState('ready');
      setCloudSyncMessage(null);
      setLastCloudSyncAt(new Date());
      cloudErrorToastShownRef.current = false;
      cloudRetryCountRef.current = 0;
      if (showReadyToast) showToast({ type: 'success', title: 'Cloud sync active', message: 'Données Formalio chargées depuis Supabase.' });
      return true;
    } catch (error) {
      const syncError = formalioBackend.describeError(error, 'bootstrap');
      console.warn('[Formalio cloud sync bootstrap]', syncError.details);
      if (isOnline && formalioBackend.isInvalidSessionError(syncError)) {
        handleInvalidCloudSession(syncError.message);
        return false;
      }
      setCloudSyncState(syncError.details.retryable ? 'offline' : 'error');
      setCloudSyncMessage(syncError.message);
      setOfflineMode(true);
      cloudRetryCountRef.current += 1;
      if (!cloudErrorToastShownRef.current || showReadyToast) {
        showToast({
          type: syncError.details.retryable ? 'info' : 'error',
          title: syncError.details.retryable ? 'Sync cloud en attente' : 'Sync cloud à vérifier',
          message: syncError.message,
        });
        cloudErrorToastShownRef.current = true;
      }
      return false;
    } finally {
      setCloudLoading(false);
    }
  }, [authUserId, handleInvalidCloudSession, isOnline, replaceStockItems, setAuthUser, showToast]);

  const applyTransactionSnapshot = useCallback((nextTransactions: Transaction[]) => {
    setTransactions(nextTransactions);
    void persistTransactionSnapshot(nextTransactions, authUserId ?? null, cloudCompanyId).catch(() => undefined);
    setFinancialMetrics((current) => {
      const next = calculateLocalFinancialMetrics(nextTransactions, profile, current.reportCount, current.documentCount);
      const pinnedBalance = treasuryBalanceOverrideRef.current;
      return pinnedBalance == null ? next : { ...next, balance: pinnedBalance, cashFlow: pinnedBalance };
    });
    if (cloudCompanyId && isOnline) {
      void formalioBackend.getFinancialMetrics(cloudCompanyId)
        .then((cloudMetrics) => {
          const pinnedBalance = treasuryBalanceOverrideRef.current;
          setFinancialMetrics(pinnedBalance == null ? cloudMetrics : { ...cloudMetrics, balance: pinnedBalance, cashFlow: pinnedBalance });
        })
        .catch((error) => {
          showToast({ type: 'error', title: 'Indicateurs cloud', message: error instanceof Error ? error.message : 'Les calculs seront rafraîchis plus tard.' });
      });
    }
  }, [authUserId, cloudCompanyId, isOnline, profile, showToast]);

  const saveTransactionOfflineFirst = useCallback(async (draft: Omit<Transaction, 'id' | 'status'> & { id?: string | number; status?: string }) => {
    const fallbackId = draft.id ?? createUuid();
    const fallbackTransaction: Transaction & { syncStatus?: string } = {
      id: fallbackId,
      date: draft.date || new Date().toISOString().slice(0, 10),
      description: draft.description,
      category: draft.category,
      type: draft.type,
      amount: draft.amount,
      method: draft.method,
      status: draft.status ?? 'completed',
      syncStatus: 'pending',
    };

    if (cloudCompanyId && isOnline) {
      try {
        const cloudTransaction = await formalioBackend.createTransaction(cloudCompanyId, {
          description: draft.description,
          category: draft.category,
          type: draft.type,
          amount: draft.amount,
          method: draft.method,
        });
        if (cloudTransaction) return { ...cloudTransaction, syncStatus: 'synced' } as Transaction;
      } catch (error) {
        const syncError = formalioBackend.describeError(error, 'transactions.insert');
        if (formalioBackend.isInvalidSessionError(syncError)) {
          handleInvalidCloudSession(syncError.message);
          throw new Error(syncError.message);
        }
        showToast({
          type: 'info',
          title: 'Transaction gardée localement',
          message: 'Formalio la synchronisera automatiquement au retour du réseau.',
        });
      }
    }

    const syncUserId = await getCurrentSyncUserId(authUserId);
    if (syncUserId && Platform.OS !== 'web') {
      try {
        const localRow = await repositories.transactions.createRecord(
          transactionToLocalRow(fallbackTransaction, syncUserId, cloudCompanyId),
        );
        const pendingCount = await getOutboxItemCount(syncUserId).catch(() => pendingSyncCount + 1);
        setPendingSyncCount(pendingCount);
        return localRowToTransaction(localRow as unknown as Record<string, unknown>);
      } catch (error) {
        showToast({
          type: 'error',
          title: 'Sauvegarde locale',
          message: error instanceof Error ? error.message : 'La transaction reste dans la mémoire locale.',
        });
      }
    }

    return fallbackTransaction;
  }, [authUserId, cloudCompanyId, handleInvalidCloudSession, isOnline, pendingSyncCount, showToast]);

  const applyBalanceDeltaFromTransaction = useCallback((transaction: Transaction) => {
    const pinnedBalance = treasuryBalanceOverrideRef.current;
    if (pinnedBalance == null) return;
    const delta = transaction.type === 'income'
      ? transaction.amount
      : transaction.type === 'expense' || transaction.type === 'retrait'
        ? -transaction.amount
        : 0;
    if (delta !== 0) commitVisibleTreasuryBalance(pinnedBalance + delta);
  }, [commitVisibleTreasuryBalance]);

  useEffect(() => {
    let active = true;
    if (!formalioBackend.isConfigured) return () => {
      active = false;
    };
    (async () => {
      const loaded = await hydrateCloudData(false);
      if (active && loaded) {
        navigationHistoryRef.current = ['dashboard'];
        setScreen('dashboard');
      }
    })();
    return () => {
      active = false;
    };
  }, [hydrateCloudData]);

  useEffect(() => {
    if (!formalioBackend.isConfigured) return;
    if (!isOnline) {
      setOfflineMode(true);
      setCloudSyncState('offline');
      setCloudSyncMessage('Connexion internet indisponible. Les données déjà chargées restent disponibles.');
      return;
    }
    if (cloudSyncState === 'offline' || cloudSyncState === 'error') {
      const retryDelay = Math.min(30000, 1500 * 2 ** Math.min(4, cloudRetryCountRef.current));
      const timer = setTimeout(() => {
        void hydrateCloudData(false);
      }, retryDelay);
      return () => clearTimeout(timer);
    }
  }, [cloudSyncState, hydrateCloudData, isOnline]);

  useEffect(() => {
    if (!formalioBackend.isConfigured) return undefined;
    return formalioBackend.onAuthStateChange((event, session) => {
      if (session?.user) {
        void hydrateCloudData(false);
      } else if (event === 'SIGNED_OUT' || event === 'USER_DELETED') {
        void clearTrustedOfflineSession();
        setCloudCompanyId(null);
        setTransactions([]);
        setNotifications([]);
        setLoanRequests([]);
        treasuryBalanceOverrideRef.current = null;
        setTreasuryBalanceOverride(null);
        void AsyncStorage.removeItem(TREASURY_BALANCE_STORAGE_KEY).catch(() => undefined);
        setFinancialMetrics(emptyFinancialMetrics);
        setSubscription(defaultSubscription);
        setCloudSyncState('idle');
        setCloudSyncMessage(null);
      }
    });
  }, [hydrateCloudData]);

  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active' && formalioBackend.isConfigured && isOnline) {
        void hydrateCloudData(false);
      }
    });
    return () => sub.remove();
  }, [hydrateCloudData, isOnline]);

  useEffect(() => {
    if (!businessName && !businessType) return;
    setProfile((current) => ({
      ...current,
      storeName: businessName && current.storeName === defaultBusinessProfile.storeName ? businessName : current.storeName,
      category: businessType && current.category === defaultBusinessProfile.category ? businessType : current.category,
    }));
  }, [businessName, businessType]);

  useEffect(() => {
    if (!cloudCompanyId || !formalioBackend.isConfigured) return undefined;
    return formalioBackend.subscribeToCompanyData(cloudCompanyId, () => {
      void hydrateCloudData(false);
    });
  }, [cloudCompanyId, hydrateCloudData]);

  useEffect(() => {
    if (cloudCompanyId) return;
    setFinancialMetrics((current) => {
      const next = calculateLocalFinancialMetrics(transactions, profile, current.reportCount, current.documentCount);
      const pinnedBalance = treasuryBalanceOverrideRef.current;
      return pinnedBalance == null ? next : { ...next, balance: pinnedBalance, cashFlow: pinnedBalance };
    });
  }, [cloudCompanyId, profile, transactions, treasuryBalanceOverride]);

  const handleVoiceTransaction = async (parsed: ParsedTransaction) => {
    const savedTransaction = await saveTransactionOfflineFirst({
      date: new Date().toISOString().split('T')[0],
      description: parsed.description,
      category: parsed.category,
      type: parsed.type,
      amount: parsed.amount,
      method: parsed.method,
      status: 'completed',
    });
    applyTransactionSnapshot([savedTransaction, ...transactions]);
    applyBalanceDeltaFromTransaction(savedTransaction);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    showToast({ type: 'success', title: 'Transaction enregistrée !', message: `${parsed.amount.toLocaleString('fr-FR')} FCFA · ${parsed.category}` });
  };

  const handleScannedReceipt = async (ticket?: ScannedTicketData) => {
    if (ticket) {
      setPendingScan(ticket);
      setScannerOpen(false);
      navigate('add-transaction');
      showToast({ type: 'success', title: 'Ticket détecté', message: `${ticket.amount.toLocaleString('fr-FR')} FCFA auto-rempli depuis ${ticket.merchant}` });
      return;
    }
    const savedTransaction = await saveTransactionOfflineFirst({
      date: new Date().toISOString().split('T')[0],
      description: 'Ticket scanné - Achat stock',
      category: 'Achats',
      type: 'expense',
      amount: 28500,
      method: 'Espèces',
      status: 'completed',
    });
    applyTransactionSnapshot([savedTransaction, ...transactions]);
    applyBalanceDeltaFromTransaction(savedTransaction);
    setScannerOpen(false);
    showToast({ type: 'success', title: 'Ticket scanné', message: '28,500 FCFA ajouté dans Achats' });
  };

  const openDownload = (title: string, period: string, type: BackendReportType = 'dashboard_summary') => {
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().slice(0, 10);
    const periodEnd = now.toISOString().slice(0, 10);
    setDownloadReportInfo({ title, period, type, periodStart, periodEnd });
    setDownloadModalOpen(true);
  };

  const handleScanDraftConsumed = useCallback(() => setPendingScan(null), []);

  const handleLoanSubmitted = useCallback((summary: LoanRequestSummary) => {
    const nextRequest: LoanRequestRecord = {
      ...summary,
      id: `LR-${Date.now().toString().slice(-6)}`,
      requestedAt: new Date().toISOString(),
      status: 'submitted',
      expectedReviewDuration: summary.approvalProbability >= 88 ? '24-48h' : '3-5 jours',
      nextAction: 'Formalio prépare votre dossier pour revue partenaire.',
      notificationCount: 1,
    };
    setLoanRequests((current) => [nextRequest, ...current]);
    if (cloudCompanyId) {
      void formalioBackend.submitLoanRequest(cloudCompanyId, summary).then((cloudRequest) => {
        if (!cloudRequest) return;
        setLoanRequests((current) => [cloudRequest as LoanRequestRecord, ...current.filter((request) => request.id !== nextRequest.id)]);
      }).catch((error) => {
        showToast({ type: 'error', title: 'Suivi cloud prêt', message: error instanceof Error ? error.message : 'Demande gardée localement.' });
      });
    }
  }, [cloudCompanyId, showToast]);

  const handleFicheDraftSaved = async (payload: FicheDraftPayload) => {
    setPendingFicheDraft(payload);
    const document = createFicheDocumentFromDraft(payload);
    const nextDocuments = upsertFicheDocument(ficheDocuments, document);
    setFicheDocuments(nextDocuments);
    await AsyncStorage.setItem(FICHE_PENDING_DRAFT_KEY, JSON.stringify(payload)).catch(() => undefined);
    await AsyncStorage.setItem(FICHE_DOCUMENTS_KEY, JSON.stringify(nextDocuments)).catch(() => undefined);
    await syncFicheStockWithInventory(payload.data, 'initial', cloudCompanyId).catch(() => undefined);
    showToast({ type: 'success', title: 'Stock initial enregistré', message: 'La fiche reste disponible pour compléter le stock final.' });
  };

  const handleFicheComplete = (payload: FicheCompletionPayload) => {
    const completedAt = Date.now();
    setLastFicheCompletedAt(completedAt);
    setPendingFicheDraft(null);
    void AsyncStorage.setItem(FICHE_LAST_COMPLETED_AT_KEY, String(completedAt));
    void AsyncStorage.removeItem(FICHE_PENDING_DRAFT_KEY).catch(() => undefined);
    void syncFicheStockWithInventory(payload.data, 'final', cloudCompanyId).catch(() => undefined);

    void syncFicheAfterValidation(payload.data).catch(() => undefined);

    const template = FICHE_TEMPLATES.find((item) => item.type === payload.data.ficheType);
    const businessTypeLabel = template ? `${template.emoji} ${template.label}` : 'Fiche';
    const ecartBadge = payload.result.ecart === 0
      ? '✅ Équilibré'
      : payload.result.ecart > 0
        ? `Surplus: +${formatFCFA(Math.abs(payload.result.ecart))}`
        : `Écart: -${formatFCFA(Math.abs(payload.result.ecart))}`;
    const ficheActivity: Transaction = {
      id: `fiche-${payload.data.id || completedAt}`,
      date: new Date(completedAt).toISOString().slice(0, 10),
      description: `📋 Fiche — ${businessTypeLabel}`,
      category: `${payload.data.dateDebut || ''} → ${payload.data.dateFin || ''} · ${ecartBadge}`,
      type: 'fiche_reconciliation',
      amount: payload.result.caisseReelle,
      method: 'Fiche',
      status: 'completed',
    };
    applyTransactionSnapshot([ficheActivity, ...transactions.filter((transaction) => transaction.id !== ficheActivity.id)]);
    commitVisibleTreasuryBalance(payload.result.caisseReelle);

    const document = createFicheDocumentFromCompletion(payload, completedAt);
    const nextDocuments = upsertFicheDocument(ficheDocuments, document);
    setFicheDocuments(nextDocuments);
    void AsyncStorage.setItem(FICHE_DOCUMENTS_KEY, JSON.stringify(nextDocuments)).catch(() => undefined);
    showToast({ type: 'success', title: 'Fiche enregistrée ✅', message: 'Rapport disponible dans vos documents.' });
  };

  const handleRetraitConfirmed = (versement: VersementItem, _nextBalance: number) => {
    const currentTreasuryBalance = treasuryBalanceOverrideRef.current ?? financialMetrics.balance;
    const confirmedNextBalance = Math.max(0, Number(currentTreasuryBalance || 0) - Number(versement.montant || 0));
    const nextBalance = confirmedNextBalance;
    const normalized: VersementItem = {
      ...versement,
      userId: authUserId || versement.userId || PROTOTYPE_USER_ID,
      companyId: cloudCompanyId ?? versement.companyId ?? null,
    };
    const nextVersements = [normalized, ...versements.filter((item) => item.id !== normalized.id)];
    setVersements(nextVersements);
    commitVisibleTreasuryBalance(confirmedNextBalance);
    void AsyncStorage.setItem(VERSEMENTS_STORAGE_KEY, JSON.stringify(nextVersements)).catch(() => undefined);
    void (async () => {
      const syncUserId = await getCurrentSyncUserId(normalized.userId);
      const databaseVersement = syncUserId ? { ...normalized, userId: syncUserId } : normalized;
      await saveVersementLocally(databaseVersement);
      await applyRetraitToTreasury({
        userId: databaseVersement.userId,
        companyId: databaseVersement.companyId,
        currentBalance: currentTreasuryBalance,
        montant: databaseVersement.montant,
        versementId: databaseVersement.id,
      });
      await saveRetraitActivityTransactionLocally(databaseVersement);
      await syncVersementAfterCreation(databaseVersement);
    })().catch((error) => {
      showToast({ type: 'error', title: 'Sync retrait', message: error instanceof Error ? error.message : 'Le retrait reste visible localement.' });
    });

    const retraitTransaction: Transaction = {
      id: `retrait-${normalized.id}`,
      date: normalized.versementDate,
      description: normalized.destinationLabel,
      category: normalized.description || 'Retrait de caisse',
      type: 'retrait',
      amount: normalized.montant,
      method: 'Caisse',
      status: 'completed',
    };
    applyTransactionSnapshot([retraitTransaction, ...transactions.filter((transaction) => transaction.id !== retraitTransaction.id)]);
    showToast({ type: 'success', title: 'Retrait enregistré ✅', message: `Nouveau solde: ${formatFCFA(nextBalance)}` });
    navigate('dashboard');
  };

  const handleFichePdfDownload = (document: FicheDocumentRecord) => {
    void (async () => {
      try {
        const filePath = await generateFichePDF(document.data, profile.storeName || businessName || 'Formalio');
        await shareFichePDF(filePath);
        showToast({ type: 'success', title: 'PDF fiche prêt', message: 'Document généré dans le dossier Documents.' });
      } catch (error) {
        showToast({ type: 'error', title: 'PDF fiche', message: error instanceof Error ? error.message : 'Génération impossible.' });
      }
    })();
  };

  if (screen === 'auth') {
    return withLanguage(
      <AuthFlows
        profile={profile}
        transactions={transactions}
        notifications={notifications}
        metrics={financialMetrics}
        onOpenLegal={(legalScreen) => navigate(legalScreen)}
        onComplete={async (isNewUser) => {
          showToast({ type: 'success', title: isNewUser ? 'Compte créé !' : 'Connexion réussie', message: isNewUser ? 'Bienvenue sur Formalio' : 'Bon retour !' });
          const loaded = await hydrateCloudData(true);
          const syncUserId = await getCurrentSyncUserId(authUserId);
          if (loaded && syncUserId && ficheDocuments.length === 0) {
            navigationHistoryRef.current = ['data-restore'];
            setScreen('data-restore');
            await fullDataRestore(syncUserId).catch(() => undefined);
            navigationHistoryRef.current = ['dashboard'];
            setScreen('dashboard');
            return;
          }
          if (loaded) {
            navigationHistoryRef.current = ['dashboard'];
            setScreen('dashboard');
          } else if (isNewUser && !businessName) {
            navigationHistoryRef.current = ['business-setup'];
            setScreen('business-setup');
          } else {
            navigationHistoryRef.current = ['dashboard'];
            setScreen('dashboard');
          }
        }}
      />
    );
  }

  if (screen === 'business-setup') {
    return withLanguage(<BusinessSetupScreen businessName={businessName} setBusinessName={setBusinessName} businessType={businessType} setBusinessType={setBusinessType} navigate={navigate} shellProps={shellProps} />);
  }

  return withLanguage(
    <View style={{ flex: 1, backgroundColor: c.surface50 }}>
      {screen === 'dashboard' ? (
        <DashboardScreen shellProps={shellProps} businessName={profile.ownerFullName || businessName || profile.storeName} avatarId={profile.avatarId} showBalance={showBalance} setShowBalance={setShowBalance} notifications={notifications} offlineMode={offlineMode} setOfflineMode={setOfflineMode} transactions={transactions} metrics={financialMetrics} navigate={navigate} lastFicheCompletedAt={lastFicheCompletedAt} onStartFiche={() => navigate('fiche')} />
      ) : null}
      {screen === 'transactions' ? <TransactionsScreen shellProps={shellProps} transactions={transactions} onOpenFicheTransaction={(transaction) => {
        const ficheId = String(transaction.id).replace(/^fiche-/, '');
        const document = ficheDocuments.find((item) => item.id === ficheId || item.id === transaction.id);
        if (document) setSelectedFicheDocument(document);
        navigate('fiche-detail');
      }} /> : null}
      {screen === 'add-transaction' ? <AddTransactionScreen shellProps={shellProps} cloudCompanyId={cloudCompanyId} transactions={transactions} setTransactions={applyTransactionSnapshot} navigate={navigate} openVoice={() => setVoiceRecorderOpen(true)} openScanner={() => setScannerOpen(true)} setShowConfetti={setShowConfetti} scannedDraft={pendingScan} onScanConsumed={handleScanDraftConsumed} pendingFicheDraft={pendingFicheDraft} onTransactionSaved={applyBalanceDeltaFromTransaction} saveTransaction={saveTransactionOfflineFirst} /> : null}
      {screen === 'fiche' ? (
        <FicheScreen
          companyId={cloudCompanyId}
          initialData={pendingFicheDraft?.data ?? null}
          initialStep={pendingFicheDraft ? 2 : 1}
          onBackToHome={() => navigate('dashboard')}
          onDraftSaved={(payload) => void handleFicheDraftSaved(payload)}
          onComplete={handleFicheComplete}
        />
      ) : null}
      {screen === 'data-restore' ? <DataRestoreScreen status={{ fiches: 'loading', versements: 'pending', treasury: 'pending' }} /> : null}
      {screen === 'retrait' ? (
        <RetraitScreen
          shellProps={shellProps}
          currentBalance={financialMetrics.balance}
          userId={authUserId || PROTOTYPE_USER_ID}
          companyId={cloudCompanyId}
          onConfirm={handleRetraitConfirmed}
        />
      ) : null}
      {screen === 'versements' ? <VersementsScreen shellProps={shellProps} versements={versements} /> : null}
      {screen === 'TermsAndConditions' ? <TermsAndConditionsScreen onBack={goBack} /> : null}
      {screen === 'PrivacyPolicy' ? <PrivacyPolicyScreen onBack={goBack} /> : null}
      {screen === 'CookiePolicy' ? <CookiePolicyScreen onBack={goBack} /> : null}
      {screen === 'AcceptableUsePolicy' ? <AcceptableUsePolicyScreen onBack={goBack} /> : null}
      {screen === 'RefundSubscriptionPolicy' ? <RefundSubscriptionPolicyScreen onBack={goBack} /> : null}
      {screen === 'CommunityGuidelines' ? <CommunityGuidelinesScreen onBack={goBack} /> : null}
      {screen === 'DmcaPolicy' ? <DmcaPolicyScreen onBack={goBack} /> : null}
      {screen === 'DataRetentionPolicy' ? <DataRetentionPolicyScreen onBack={goBack} /> : null}
      {screen === 'SecurityPolicy' ? <SecurityPolicyScreen onBack={goBack} /> : null}
      {screen === 'RegulatoryCompliance' ? <RegulatoryComplianceScreen onBack={goBack} /> : null}
      {screen === 'fiche-detail' ? (
        <FicheDetailScreen
          fiche={selectedFicheDocument?.data}
          ficheId={selectedFicheDocument?.id}
          businessName={profile.storeName || businessName}
          onBack={() => navigate('reports')}
        />
      ) : null}
      {screen === 'stock' ? <StockManagerScreen shellProps={shellProps} cloudCompanyId={cloudCompanyId} /> : null}
      {screen === 'cashflow' ? <CashflowScreen shellProps={shellProps} metrics={financialMetrics} cloudCompanyId={cloudCompanyId} /> : null}
      {screen === 'credit-score' ? <CreditScoreScreen shellProps={shellProps} metrics={financialMetrics} onLoanSubmitted={handleLoanSubmitted} /> : null}
      {screen === 'reports' ? <ReportsScreen shellProps={shellProps} openDownload={openDownload} loanRequests={loanRequests} metrics={financialMetrics} transactions={transactions} ficheDocuments={ficheDocuments} onResumeFiche={() => navigate('fiche')} onOpenFicheDetail={(document) => { setSelectedFicheDocument(document); navigate('fiche-detail'); }} onDownloadFiche={handleFichePdfDownload} /> : null}
      {screen === 'mobile-money' ? <MobileMoneyScreen shellProps={shellProps} /> : null}
      {screen === 'notifications' ? <NotificationsScreen shellProps={shellProps} notifications={notifications} setNotifications={setNotifications} /> : null}
      {screen === 'ai-insights' ? <AiInsightsScreen shellProps={shellProps} metrics={financialMetrics} /> : null}
      {screen === 'tax' ? <TaxScreen shellProps={shellProps} navigate={navigate} metrics={financialMetrics} /> : null}
      {screen === 'profile' ? (
        <ProfileScreen
          shellProps={shellProps}
          profile={profile}
          setProfile={setProfile}
          navigate={navigate}
          logout={() => {
            const finishLogout = () => {
              void formalioBackend.signOut();
              void clearTrustedOfflineSession();
              void logoutAuthStore();
              setCloudCompanyId(null);
              setTransactions([]);
              replaceStockItems([]);
              setNotifications([]);
              setLoanRequests([]);
              treasuryBalanceOverrideRef.current = null;
              setTreasuryBalanceOverride(null);
              void AsyncStorage.removeItem(TREASURY_BALANCE_STORAGE_KEY).catch(() => undefined);
              setFinancialMetrics(emptyFinancialMetrics);
              setSubscription(defaultSubscription);
              navigationHistoryRef.current = ['auth'];
              setScreen('auth');
            };
            if (pendingSyncCount > 0) {
              Alert.alert(
                'Données non synchronisées',
                `Vous avez ${pendingSyncCount} élément(s) en attente. Déconnectez-vous seulement si vous comprenez que ces données devront rester sur cet appareil jusqu'à la prochaine synchronisation.`,
                [
                  { text: 'Annuler', style: 'cancel' },
                  { text: 'Se déconnecter', style: 'destructive', onPress: finishLogout },
                ],
              );
              return;
            }
            finishLogout();
          }}
          metrics={financialMetrics}
          subscription={subscription}
          onSaveProfile={(nextProfile) => cloudCompanyId ? formalioBackend.upsertProfile(cloudCompanyId, nextProfile) : Promise.resolve()}
          onKycStatusChange={(status) => cloudCompanyId ? formalioBackend.updateKycStatus(cloudCompanyId, status) : Promise.resolve()}
        />
      ) : null}
      {screen === 'settings' ? <SettingsScreen shellProps={shellProps} profile={profile} setProfile={setProfile} onSaveProfile={(nextProfile) => cloudCompanyId ? formalioBackend.upsertProfile(cloudCompanyId, nextProfile) : Promise.resolve()} /> : null}
      {screen === 'security' ? <SecurityScreen shellProps={shellProps} profile={profile} setProfile={setProfile} /> : null}
      {screen === 'subscription' ? <SubscriptionScreen shellProps={shellProps} subscription={subscription} /> : null}
      {screen === 'help' ? <HelpScreen shellProps={shellProps} openAi={() => setAiAssistantOpen(true)} language={profile.language} /> : null}
      {screen === 'referral' ? <ReferralScreen shellProps={shellProps} /> : null}
      {screen === 'offline' ? <OfflineScreen shellProps={shellProps} /> : null}
      {screen === 'accounting' ? <AccountingScreen shellProps={shellProps} transactions={transactions} metrics={financialMetrics} navigate={navigate} openDownload={openDownload} /> : null}
      <AIAssistant isOpen={aiAssistantOpen} onClose={() => setAiAssistantOpen(false)} loanRequests={loanRequests} transactions={transactions} metrics={financialMetrics} companyId={cloudCompanyId} language={profile.language} />
      <VoiceRecorder isOpen={voiceRecorderOpen} onClose={() => setVoiceRecorderOpen(false)} onComplete={handleVoiceTransaction} companyId={cloudCompanyId} />
      <DownloadModal
        isOpen={downloadModalOpen}
        onClose={() => setDownloadModalOpen(false)}
        reportTitle={downloadReportInfo.title}
        reportPeriod={downloadReportInfo.period}
        reportType={downloadReportInfo.type}
        periodStart={downloadReportInfo.periodStart}
        periodEnd={downloadReportInfo.periodEnd}
        companyId={cloudCompanyId}
      />
      <ScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onSave={handleScannedReceipt} companyId={cloudCompanyId} />
      <ConfettiBurst trigger={showConfetti} />
      {cloudLoading ? (
        <View style={{ position: 'absolute', left: 16, right: 16, top: 82, zIndex: 120, borderRadius: 14, backgroundColor: c.formalio900, padding: 12, shadowColor: c.surface950, shadowOpacity: 0.16, shadowRadius: 12, elevation: 8 }}>
          <Row style={{ gap: 8 }}>
            <ActivityIndicator color={c.formalio300} size="small" />
            <Txt weight="bold" style={{ color: c.white, fontSize: 12 }}>Synchronisation cloud Formalio...</Txt>
          </Row>
        </View>
      ) : null}
      {!cloudLoading && (cloudSyncState === 'offline' || cloudSyncState === 'error') ? (
        <View style={{ position: 'absolute', left: 16, right: 16, top: 82, zIndex: 120, borderRadius: 14, backgroundColor: cloudSyncState === 'error' ? c.danger600 : c.surface900, padding: 12, shadowColor: c.surface950, shadowOpacity: 0.16, shadowRadius: 12, elevation: 8 }}>
          <Row style={{ gap: 10, alignItems: 'flex-start' }}>
            <Icon icon={cloudSyncState === 'error' ? AlertTriangle : WifiOff} size={18} color={c.white} />
            <View style={{ flex: 1, minWidth: 0 }}>
              <Txt weight="bold" style={{ color: c.white, fontSize: 12 }}>
                {cloudSyncState === 'error' ? 'Sync cloud à vérifier' : 'Sync cloud en attente'}
              </Txt>
              <Txt style={{ color: 'rgba(255,255,255,.76)', fontSize: 10, marginTop: 2 }} numberOfLines={2}>
                {cloudSyncMessage ?? 'Formalio réessaiera automatiquement.'}
                {lastCloudSyncAt ? ` Dernière sync: ${lastCloudSyncAt.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}.` : ''}
              </Txt>
            </View>
            <Tap onPress={() => void hydrateCloudData(true)} style={{ borderRadius: 999, backgroundColor: 'rgba(255,255,255,.14)', paddingHorizontal: 10, paddingVertical: 7 }}>
              <Txt weight="black" style={{ color: c.white, fontSize: 10 }}>Réessayer</Txt>
            </Tap>
          </Row>
        </View>
      ) : null}
    </View>
  );
}

function TransactionsScreen({
  shellProps,
  transactions,
  onOpenFicheTransaction,
}: {
  shellProps: ShellProps;
  transactions: Transaction[];
  onOpenFicheTransaction?: (transaction: Transaction) => void;
}) {
  const language = useAppLanguage();
  const [filter, setFilter] = useState<'all' | 'income' | 'expense'>('all');
  const [searchQuery, setSearchQuery] = useState('');
  const [filtersOpen, setFiltersOpen] = useState(false);
  const [dateFilter, setDateFilter] = useState('all');
  const [timeFilter, setTimeFilter] = useState<TransactionTimeFilter>('all');
  const [yearFilter, setYearFilter] = useState('all');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const dates = useMemo(() => Array.from(new Set(transactions.map((t) => t.date))).sort((a, b) => b.localeCompare(a)), [transactions]);
  const years = useMemo(() => Array.from(new Set(transactions.map((t) => new Date(t.date).getFullYear().toString()))).sort((a, b) => b.localeCompare(a)), [transactions]);
  const categories = useMemo(() => Array.from(new Set(transactions.map((t) => t.category))).sort(), [transactions]);
  const statuses = useMemo(() => Array.from(new Set(transactions.map((t) => t.status))).sort(), [transactions]);
  const hasAdvancedFilters = dateFilter !== 'all' || timeFilter !== 'all' || yearFilter !== 'all' || categoryFilter !== 'all' || statusFilter !== 'all';
  const hasSearch = searchQuery.trim().length > 0;
  const filtered = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    return transactions.filter((t) => {
      const searchText = normalizeSearchText([
        t.description,
        t.category,
        t.method,
        t.status,
        t.type,
        t.date,
        getTransactionTime(t),
        String(t.amount),
      ].join(' '));
      return (
        (filter === 'all' || t.type === filter) &&
        (!query || searchText.includes(query)) &&
        (dateFilter === 'all' || t.date === dateFilter) &&
        (timeFilter === 'all' || getTransactionTimeBucket(t) === timeFilter) &&
        (yearFilter === 'all' || new Date(t.date).getFullYear().toString() === yearFilter) &&
        (categoryFilter === 'all' || t.category === categoryFilter) &&
        (statusFilter === 'all' || t.status === statusFilter)
      );
    });
  }, [categoryFilter, dateFilter, filter, searchQuery, statusFilter, timeFilter, transactions, yearFilter]);
  const clearFilters = () => {
    setSearchQuery('');
    setFilter('all');
    setDateFilter('all');
    setTimeFilter('all');
    setYearFilter('all');
    setCategoryFilter('all');
    setStatusFilter('all');
  };
  return (
    <ScreenWrapper {...shellProps} title="Transactions">
      <Row style={{ gap: 8, marginBottom: 12 }}>
        <View style={[styles.inputBox, { flex: 1, paddingVertical: 10 }]}>
          <Icon icon={Search} size={16} color={c.surface400} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder={localizeRuntimeText(language, 'Rechercher...')}
            placeholderTextColor={c.surface400}
            returnKeyType="search"
            autoCapitalize="none"
            maxFontSizeMultiplier={inputTextMaxScale}
            style={styles.textInput}
          />
          {searchQuery ? (
            <Tap onPress={() => setSearchQuery('')} accessibilityLabel="Effacer la recherche">
              <Icon icon={X} size={15} color={c.surface400} />
            </Tap>
          ) : null}
        </View>
        <Tap onPress={() => setFiltersOpen((open) => !open)} style={[styles.iconButton, (filtersOpen || hasAdvancedFilters) && styles.filterIconActive]}>
          <Icon icon={Filter} size={17} color={hasAdvancedFilters ? c.formalio700 : c.surface600} />
          {hasAdvancedFilters ? <View style={styles.filterActiveDot} /> : null}
        </Tap>
      </Row>
      <Segment value={filter} onChange={setFilter} options={[{ key: 'all', label: 'Toutes' }, { key: 'income', label: 'Revenus' }, { key: 'expense', label: 'Dépenses' }]} style={{ marginBottom: 16 }} />
      {filtersOpen ? (
        <Animated.View entering={FadeIn.duration(160)} style={styles.filterPanel}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Txt weight="black" style={{ fontSize: 13 }}>Filtres</Txt>
            {hasAdvancedFilters || hasSearch || filter !== 'all' ? (
              <Tap onPress={clearFilters}>
                <Txt weight="bold" style={{ color: c.formalio700, fontSize: 11 }}>Réinitialiser</Txt>
              </Tap>
            ) : null}
          </Row>
          <FilterChipGroup label="Date" value={dateFilter} onChange={setDateFilter} options={[{ key: 'all', label: 'Toutes' }, ...dates.slice(0, 6).map((date) => ({ key: date, label: new Date(date).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }) }))]} />
          <FilterChipGroup label="Heure" value={timeFilter} onChange={(value) => setTimeFilter(value as TransactionTimeFilter)} options={[{ key: 'all', label: 'Toute la journée' }, { key: 'morning', label: 'Matin' }, { key: 'afternoon', label: 'Après-midi' }, { key: 'evening', label: 'Soir' }]} />
          <FilterChipGroup label="Année" value={yearFilter} onChange={setYearFilter} options={[{ key: 'all', label: 'Toutes' }, ...years.map((year) => ({ key: year, label: year }))]} />
          <FilterChipGroup label="Catégorie" value={categoryFilter} onChange={setCategoryFilter} options={[{ key: 'all', label: 'Toutes' }, ...categories.map((category) => ({ key: category, label: category }))]} />
          <FilterChipGroup label="Statut" value={statusFilter} onChange={setStatusFilter} options={[{ key: 'all', label: 'Tous' }, ...statuses.map((status) => ({ key: status, label: status === 'completed' ? 'Complété' : status }))]} />
        </Animated.View>
      ) : null}
      <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <Txt weight="bold" style={{ color: c.surface700, fontSize: 12 }}>{filtered.length} résultat{filtered.length > 1 ? 's' : ''}</Txt>
        {hasSearch || hasAdvancedFilters || filter !== 'all' ? <Txt style={{ color: c.surface400, fontSize: 11 }}>Mise à jour instantanée</Txt> : null}
      </Row>
      {filtered.length === 0 ? (
        <View style={styles.noResultsState}>
          <Icon icon={Search} size={25} color={c.surface400} />
          <Txt weight="semibold" style={{ marginTop: 12, color: c.surface700 }}>{hasSearch || hasAdvancedFilters || filter !== 'all' ? 'Aucun résultat' : 'Aucune transaction'}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{hasSearch || hasAdvancedFilters || filter !== 'all' ? 'Essayez un autre mot-clé, une autre date ou une catégorie différente.' : 'Ajoutez votre première transaction'}</Txt>
          {hasSearch || hasAdvancedFilters || filter !== 'all' ? (
            <Tap onPress={clearFilters} style={styles.clearFiltersButton}>
              <Txt weight="bold" style={{ color: c.formalio700, fontSize: 12 }}>Effacer recherche et filtres</Txt>
            </Tap>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {filtered.map((t) => (
            <Tap key={t.id} disabled={t.type !== 'fiche_reconciliation'} onPress={() => onOpenFicheTransaction?.(t)} style={{ width: '100%' }}>
              <Card style={{ padding: 4, borderRadius: 12 }}>
                <TransactionRow transaction={t} />
              </Card>
            </Tap>
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

async function reconcileStockItemsWithCloud(companyId: string, cloudItems: StockItem[]) {
  const localItems = useStockStore.getState().items;
  if (localItems.length === 0) return sortStockItems(cloudItems);

  const cloudById = new Map(cloudItems.map((item) => [item.id, item]));
  const mergedById = new Map(cloudItems.map((item) => [item.id, item]));
  const pendingUploads: StockItem[] = [];

  localItems.forEach((localItem) => {
    const cloudItem = cloudById.get(localItem.id);
    if (!cloudItem || stockUpdatedAtMs(localItem) > stockUpdatedAtMs(cloudItem)) {
      mergedById.set(localItem.id, localItem);
      pendingUploads.push(localItem);
    }
  });

  if (pendingUploads.length === 0) return sortStockItems(Array.from(mergedById.values()));

  const uploads = await Promise.allSettled(pendingUploads.map((item) => formalioBackend.upsertStockItem(companyId, item)));
  const failed = uploads.find((result) => result.status === 'rejected');
  if (failed?.status === 'rejected') throw failed.reason;

  const refreshed = await formalioBackend.getStockItems(companyId).catch(() => null);
  return sortStockItems(refreshed && refreshed.length > 0 ? refreshed : Array.from(mergedById.values()));
}

async function syncFicheStockWithInventory(data: Partial<FicheData>, mode: 'initial' | 'final', companyId: string | null) {
  const stockItems = data.stockItems || [];
  if (stockItems.length === 0) return [];

  const stockStore = useStockStore.getState();
  const savedItems = stockItems
    .filter((item) => item.productName?.trim())
    .map((item) => stockStore.upsertItem({
      id: item.id,
      name: item.productName,
      quantity: getStockEntryQuantity(item, mode),
      priceType: 'fixed',
      unitPrice: Number(item.prixUnitaire) || 0,
    }));

  if (companyId && savedItems.length > 0) {
    const uploads = await Promise.allSettled(savedItems.map((item) => formalioBackend.upsertStockItem(companyId, item)));
    const cloudItems = uploads
      .filter((result): result is PromiseFulfilledResult<StockItem | null> => result.status === 'fulfilled')
      .map((result) => result.value)
      .filter((item): item is StockItem => Boolean(item));

    if (cloudItems.length > 0) {
      const current = useStockStore.getState().items;
      const byId = new Map(current.map((item) => [item.id, item]));
      cloudItems.forEach((item) => byId.set(item.id, item));
      useStockStore.getState().replaceItems(sortStockItems(Array.from(byId.values())));
    }
  }

  return savedItems;
}

function StockValueCard({ items, onPress }: { items: StockItem[]; onPress: () => void }) {
  if (items.length === 0) return null;

  const total = getTotalStockValue(items);
  return (
    <Card style={styles.stockValueCard}>
      <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Row style={{ gap: 7, marginBottom: 10 }}>
            <View style={[styles.metricIcon, { backgroundColor: c.info50 }]}><Icon icon={Package} size={16} color={c.info700} /></View>
            <Txt weight="black" style={{ color: c.surface800, fontSize: 14 }}>Valeur Totale du Stock</Txt>
          </Row>
          <Txt weight="black" numberOfLines={1} style={{ color: c.formalio800, fontSize: isAndroidNative ? 22 : 26, lineHeight: isAndroidNative ? 28 : 33 }}>{formatFCFA(total)}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 3 }}>≈ {formatStockCompactValue(total)}</Txt>
        </View>
      </Row>
      <Tap onPress={onPress} style={styles.stockValueLink}>
        <Txt weight="black" style={{ color: c.info700, fontSize: 12 }}>Voir le stock</Txt>
        <Icon icon={ChevronRight} size={15} color={c.info700} />
      </Tap>
    </Card>
  );
}

function CashflowScreen({ shellProps, metrics, cloudCompanyId }: { shellProps: ShellProps; metrics: CloudFinancialMetrics; cloudCompanyId: string | null }) {
  const [filterMode, setFilterMode] = useState<'all' | 'income' | 'expense' | 'stock'>('all');
  const stockItems = useStockStore((state) => state.items);
  const emptySeries = Array.from({ length: 7 }, (_, index) => {
    const day = new Date();
    day.setDate(day.getDate() - (6 - index));
    return { date: day.toISOString().slice(0, 10), label: day.toLocaleDateString('fr-FR', { weekday: 'short' }), income: 0, expense: 0, net: 0 };
  });
  const chartData = (metrics.dailyCashflow.length ? metrics.dailyCashflow.slice(-14) : emptySeries).map((d) => ({ ...d, incomeOnly: d.income, expenseOnly: d.expense, profit: d.net }));
  const totalIncome7d = metrics.revenue;
  const totalExpense7d = metrics.expenses;
  const net7d = metrics.cashFlow;
  const profitability = totalIncome7d > 0 ? Math.round((net7d / totalIncome7d) * 100) : 0;
  const runway = totalExpense7d > 0 ? Math.max(0, Math.round((Math.max(metrics.balance, 0) / (totalExpense7d / 30)) * 10) / 10) : 0;
  const emptyState = metrics.emptyState || metrics.transactionCount === 0;
  return (
    <ScreenWrapper {...shellProps} title="Trésorerie">
      <View style={{ gap: 12 }}>
        <LinearGradient colors={[c.formalio900, c.formalio800, c.formalio700]} style={styles.treasuryHero}>
          <Row style={{ justifyContent: 'space-between' }}>
            <View>
              <Txt style={{ color: c.formalio200, fontSize: 12 }}>Vue globale de trésorerie</Txt>
              <Txt weight="black" style={{ color: c.white, fontSize: 30, marginTop: 4 }}>{(net7d / 1000).toFixed(0)}K <Txt weight="bold" style={{ color: c.formalio300, fontSize: 16 }}>FCFA</Txt></Txt>
            </View>
            <View style={styles.glassIcon}><Icon icon={Wallet} size={24} color={c.formalio300} /></View>
          </Row>
          <Txt style={{ color: c.formalio200, fontSize: 11, marginTop: 8 }}>{emptyState ? 'Aucun flux enregistré pour le moment' : `Cash flow net ${net7d >= 0 ? 'positif' : 'négatif'} · rentabilité: ${profitability}%`}</Txt>
        </LinearGradient>
        <Segment value={filterMode} onChange={setFilterMode} options={[{ key: 'all', label: 'Global', icon: BarChart3 }, { key: 'income', label: 'Revenue', icon: TrendingUp }, { key: 'expense', label: 'Dépense', icon: Receipt }, { key: 'stock', label: 'Add Stock', icon: Package }]} />
        {filterMode === 'stock' ? (
          <StockManagerPanel embedded cloudCompanyId={cloudCompanyId} />
        ) : (
          <>
        <Grid columns={2} gap={8}>
          {filterMode !== 'expense' ? <MetricCard label={`Revenus ${filterMode === 'all' ? '(7j)' : 'filtrés'}`} value={`${(totalIncome7d / 1000).toFixed(0)}K FCFA`} tone="green" delta="+8.2%" /> : <View />}
          {filterMode !== 'income' ? <MetricCard label={`Dépenses ${filterMode === 'all' ? '(7j)' : 'filtrées'}`} value={`${(totalExpense7d / 1000).toFixed(0)}K FCFA`} tone="red" delta="-3.1%" /> : <View />}
          {filterMode === 'all' ? <MetricCard label="Profitabilité" value={`${profitability}%`} tone="blue" delta={emptyState ? 'En attente de données' : metrics.profit >= 0 ? 'Rentable' : 'À surveiller'} /> : <View />}
          {filterMode === 'all' ? <MetricCard label="Runway estimé" value={runway ? `${runway} j` : '0 j'} tone="gold" delta={emptyState ? 'Ajoutez des dépenses' : 'Base de données réelles'} /> : <View />}
        </Grid>
        {filterMode === 'all' ? <StockValueCard items={stockItems} onPress={() => shellProps.navigate('stock')} /> : null}
        <Card>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <View>
              <Txt weight="bold" style={{ fontSize: 14 }}>{filterMode === 'all' ? 'Flux global' : filterMode === 'income' ? 'Analytics revenus' : 'Analytics dépenses'}</Txt>
              <Txt style={{ color: c.surface400, fontSize: 11, marginTop: 2 }}>Vue interactive de la performance financière</Txt>
            </View>
            <Pill tone="surface">7 jours</Pill>
          </Row>
          {filterMode === 'all' ? <AreaChart data={chartData} keys={['income', 'expense']} colors={[c.formalio800, c.danger600]} height={166} /> : <BarChart data={chartData} keys={[filterMode === 'income' ? 'incomeOnly' : 'expenseOnly']} colors={[filterMode === 'income' ? c.formalio800 : c.danger600]} height={166} />}
        </Card>
        <Grid columns={2} gap={8}>
          <Card>
            <Txt weight="bold" style={{ fontSize: 12, marginBottom: 10 }}>Indicateurs financiers</Txt>
            {[
              ['Cash conversion', '87%', c.formalio700],
              ['Burn rate', filterMode === 'income' ? 'N/A' : '34K/jour', c.danger600],
              ['Runway', '7.2 mois', c.gold700],
              ['Net margin', `${profitability}%`, c.info700],
            ].map(([label, value, color]) => (
              <Row key={label} style={{ justifyContent: 'space-between', marginVertical: 4 }}>
                <Txt style={{ color: c.surface500, fontSize: 11 }}>{label}</Txt>
                <Txt weight="black" style={{ color, fontSize: 11 }}>{value}</Txt>
              </Row>
            ))}
          </Card>
          <View style={styles.insightBox}>
            <Row style={{ gap: 5, marginBottom: 6 }}>
              <Icon icon={BrainCircuit} size={14} color={c.formalio700} />
              <Txt weight="bold" style={{ color: c.formalio800, fontSize: 12 }}>Mosika Insights</Txt>
            </Row>
            {(emptyState
              ? ['Aucune transaction analysée pour le moment.', 'Ajoutez vos premiers revenus et dépenses.', 'Les alertes cash flow se construisent automatiquement.']
              : filterMode === 'income'
                ? [`Revenus actuels: ${formatFCFA(metrics.revenue)}.`, `Croissance: ${metrics.growthRate.toFixed(1)}%.`, 'Identifiez vos jours de forte vente avec plus d historique.']
                : filterMode === 'expense'
                  ? [`Dépenses actuelles: ${formatFCFA(metrics.expenses)}.`, `Ratio dépenses/revenus: ${metrics.revenue ? Math.round((metrics.expenses / metrics.revenue) * 100) : 0}%.`, 'Surveillez les catégories récurrentes élevées.']
                  : [`Tresorerie nette: ${formatFCFA(metrics.cashFlow)}.`, `Marge nette: ${metrics.profitMargin.toFixed(1)}%.`, `Sante financiere: ${metrics.financialHealth}%.`]
            ).map((txt) => (
              <Txt key={txt} style={{ color: c.formalio900, fontSize: 11, lineHeight: 16 }}>• {txt}</Txt>
            ))}
          </View>
        </Grid>
          </>
        )}
      </View>
    </ScreenWrapper>
  );
}

function MetricCard({ label, value, tone, delta }: { label: string; value: string; tone: 'green' | 'red' | 'blue' | 'gold'; delta?: string }) {
  const palette = {
    green: [c.formalio50, c.formalio600, c.formalio800],
    red: [c.danger50, c.danger600, c.danger700],
    blue: [c.info50, c.info600, c.info700],
    gold: [c.gold50, c.gold700, c.gold700],
  }[tone];
  return (
    <View style={[styles.metricCard, { backgroundColor: palette[0], borderColor: palette[0] }]}>
      <Txt style={{ color: palette[1], fontSize: 12, marginBottom: 5 }}>{label}</Txt>
      <Txt weight="black" style={{ color: palette[2], fontSize: 20 }}>{value}</Txt>
      {delta ? <Txt style={{ color: palette[1], fontSize: 12, marginTop: 5 }}>{delta}</Txt> : null}
    </View>
  );
}

type LoanRequestSummary = {
  amount: number;
  duration: number;
  totalRepayment: number;
  approvalProbability: number;
  borrowingStrengthIndex: number;
  purpose: string;
  interestRate: number;
  processingFee: number;
};

type LoanStatusStage = 'submitted' | 'under-review' | 'risk-assessment' | 'pending-documents' | 'approved' | 'rejected' | 'disbursed';

type LoanRequestRecord = LoanRequestSummary & {
  id: string;
  requestedAt: string;
  status: LoanStatusStage;
  expectedReviewDuration: string;
  nextAction: string;
  notificationCount: number;
};


function CreditScoreScreen({ shellProps, metrics, onLoanSubmitted }: { shellProps: ShellProps; metrics: CloudFinancialMetrics; onLoanSubmitted: (summary: LoanRequestSummary) => void }) {
  const [loanOpen, setLoanOpen] = useState(false);
  const [loanSuccess, setLoanSuccess] = useState<LoanRequestSummary | null>(null);
  const score = metrics.mosikaScore;
  const emptyState = metrics.emptyState || metrics.transactionCount === 0;
  const scoreRatio = Math.max(0, Math.min(1, score / 1000));
  const isLoanEligible = !emptyState && score >= 520 && metrics.scoreConfidence >= 45 && !['high', 'insufficient_data'].includes(metrics.riskAssessmentLevel);
  const rate = Number(Math.max(8.5, 23 - scoreRatio * 12).toFixed(1));
  const maxEligibleAmount = isLoanEligible ? Math.round((100000 + Math.pow(scoreRatio, 2) * 1900000) / 50000) * 50000 : 0;
  const approvalProbability = isLoanEligible ? metrics.loanApprovalProbability : 0;
  return (
    <ScreenWrapper {...shellProps} title="Score Mosika">
      <View style={{ gap: 12 }}>
        <MosikaScore score={score} metrics={metrics} showDetails />
        <View style={styles.loanEligible}>
          <View style={[styles.actionIcon, { backgroundColor: c.gold100 }]}><Icon icon={CreditCard} size={21} color={c.gold600} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight="black" style={{ fontSize: 14 }}>{isLoanEligible ? 'Eligibilite institutionnelle estimee' : 'Score Mosika en construction stricte'}</Txt>
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 17, marginTop: 5 }}>
              {emptyState
                ? 'Votre environnement financier est vide. Le score commence a 0 et ne progresse qu avec des donnees verifiees dans le temps.'
                : isLoanEligible
                  ? <>Avec votre score Mosika de <Txt weight="bold" style={{ fontSize: 11 }}>{score}</Txt>, vous pouvez demander jusqu'a <Txt weight="bold" style={{ fontSize: 11 }}>{formatFCFA(maxEligibleAmount)}</Txt>.</>
                  : <>Votre score actuel est <Txt weight="bold" style={{ fontSize: 11 }}>{score}</Txt>. Le dossier manque encore de maturite, de confiance ou de stabilite pour une demande de pret.</>}
            </Txt>
            <View style={styles.chipWrapLeft}>
              <Pill tone="blue">Taux estimé: {rate}% / an</Pill>
              <Pill tone="gold">Maximum: {formatCompactFCFA(maxEligibleAmount)}</Pill>
            </View>
            <PrimaryButton label={isLoanEligible ? 'Demander un pret' : 'Construire le dossier'} disabled={!isLoanEligible} style={{ marginTop: 10, borderRadius: 12 }} onPress={() => setLoanOpen(true)} />
          </View>
        </View>
      </View>
      {isLoanEligible ? (
        <LoanRequestDrawer
          visible={loanOpen}
          onClose={() => setLoanOpen(false)}
          score={score}
          interestRate={rate}
          maxEligibleAmount={maxEligibleAmount}
          baseApprovalProbability={approvalProbability}
          onSubmitted={(summary) => {
            setLoanOpen(false);
            setLoanSuccess(summary);
            onLoanSubmitted(summary);
          }}
        />
      ) : null}
      <LoanSuccessModal summary={loanSuccess} onClose={() => setLoanSuccess(null)} />
    </ScreenWrapper>
  );
}

function LoanRequestDrawer({
  visible,
  onClose,
  score,
  interestRate,
  maxEligibleAmount,
  baseApprovalProbability,
  onSubmitted,
}: {
  visible: boolean;
  onClose: () => void;
  score: number;
  interestRate: number;
  maxEligibleAmount: number;
  baseApprovalProbability: number;
  onSubmitted: (summary: LoanRequestSummary) => void;
}) {
  const { showToast } = useToast();
  const insets = useSafeAreaInsets();
  const { height } = useWindowDimensions();
  const minAmount = 100000;
  const [loanAmount, setLoanAmount] = useState(Math.min(2000000, maxEligibleAmount));
  const [duration, setDuration] = useState(12);
  const [purpose, setPurpose] = useState('');
  const [purposeOpen, setPurposeOpen] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [touched, setTouched] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    setLoanAmount((amount) => Math.min(amount, maxEligibleAmount));
  }, [maxEligibleAmount]);

  useEffect(() => {
    if (!visible) {
      setTouched(false);
      setSubmitting(false);
      setPurposeOpen(false);
    }
  }, [visible]);

  const selectedAmount = Math.min(loanAmount, maxEligibleAmount);
  const processingFee = Math.round(selectedAmount * 0.015);
  const interestAmount = Math.round(selectedAmount * (interestRate / 100) * (duration / 12));
  const totalRepayment = selectedAmount + interestAmount + processingFee;
  const amountPressure = maxEligibleAmount > 0 ? selectedAmount / maxEligibleAmount : 1;
  const approvalProbability = Math.max(0, Math.min(82, Math.round(baseApprovalProbability - amountPressure * 6 - (duration > 18 ? 4 : 0) + (purpose ? 1 : 0))));
  const borrowingStrengthIndex = Math.max(0, Math.min(90, Math.round((score / 1000) * 55 + approvalProbability * 0.35 - amountPressure * 5)));
  const isValid = selectedAmount >= minAmount && selectedAmount <= maxEligibleAmount && Boolean(purpose) && acceptedTerms;
  const purposeOptions = ['Stock marchandises', 'Expansion boutique', 'Équipement', 'Trésorerie court terme', 'Marketing & ventes'];
  const validationMessages = [
    { ok: selectedAmount <= maxEligibleAmount, text: `Montant plafonné à votre limite éligible: ${formatFCFA(maxEligibleAmount)}` },
    { ok: Boolean(purpose), text: purpose ? `Objet: ${purpose}` : 'Choisissez un objet de prêt.' },
    { ok: acceptedTerms, text: acceptedTerms ? 'Conditions acceptées.' : 'Acceptez les conditions pour continuer.' },
  ];
  const availableDrawerHeight = Math.max(260, height - Math.max(insets.top, 12) - Math.max(insets.bottom, 16) - 32);
  const drawerMaxHeight = Math.min(availableDrawerHeight, Math.max(320, height * 0.94));

  const submitLoanRequest = () => {
    setTouched(true);
    if (!isValid) {
      showToast({ type: 'error', title: 'Demande incomplète', message: 'Vérifiez les champs requis avant de soumettre.' });
      return;
    }
    setSubmitting(true);
    setTimeout(() => {
      setSubmitting(false);
      onSubmitted({ amount: selectedAmount, duration, totalRepayment, approvalProbability, borrowingStrengthIndex, purpose, interestRate, processingFee });
    }, 950);
  };

  return (
    <ModalShell visible={visible} onClose={onClose}>
      <View style={[styles.loanDrawer, { maxHeight: drawerMaxHeight }]}>
        <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.loanDrawerHeader}>
          <View style={styles.drawerHandle} />
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt weight="black" style={{ color: c.white, fontSize: 18 }}>Loan request</Txt>
              <Txt style={{ color: c.formalio200, fontSize: 11, lineHeight: 16, marginTop: 4 }}>Your maximum eligible loan amount: {formatFCFA(maxEligibleAmount)}</Txt>
            </View>
            <Tap accessibilityLabel="Close loan request" onPress={onClose} style={styles.closeButton}><Icon icon={X} size={17} color={c.white} /></Tap>
          </Row>
        </LinearGradient>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={styles.loanDrawerContent}>
          <View style={styles.loanEligibilityCard}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <View>
                <Txt style={{ color: c.surface500, fontSize: 11 }}>Eligibility status</Txt>
                <Txt weight="black" style={{ color: c.formalio800, fontSize: 18, marginTop: 2 }}>Strict review</Txt>
              </View>
              <Pill tone="gold">Score {score}</Pill>
            </Row>
            <ValueBar value={Math.round((score / 1000) * 100)} color={c.formalio500} />
            <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
              <Txt style={{ color: c.surface500, fontSize: 11 }}>Mosika score quality</Txt>
              <Txt weight="black" style={{ color: c.formalio700, fontSize: 12 }}>{score >= 760 ? 'Institutional' : 'Conditional'}</Txt>
            </Row>
          </View>

          <Card style={{ padding: 14 }}>
            <LoanSlider
              label="Selected loan amount"
              value={selectedAmount}
              onValueChange={setLoanAmount}
              min={minAmount}
              max={maxEligibleAmount}
              step={50000}
              minLabel={formatFCFA(minAmount)}
              maxLabel={formatFCFA(maxEligibleAmount)}
            />
          </Card>

          <Card style={{ padding: 14 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <Txt weight="bold" style={{ fontSize: 12 }}>Loan duration</Txt>
              <Txt weight="black" style={{ color: c.formalio700, fontSize: 12 }}>{duration} months</Txt>
            </Row>
            <Grid columns={4} gap={8}>
              {[6, 12, 18, 24].map((d) => (
                <Tap key={d} onPress={() => setDuration(d)} style={[styles.durationButton, duration === d && styles.durationButtonActive]}>
                  <Txt weight="bold" style={{ color: duration === d ? c.white : c.surface600, fontSize: 12 }}>{d}m</Txt>
                </Tap>
              ))}
            </Grid>
          </Card>

          <Card style={{ padding: 14 }}>
            <Txt weight="bold" style={{ fontSize: 12, marginBottom: 10 }}>Loan purpose</Txt>
            <Tap onPress={() => setPurposeOpen((open) => !open)} style={[styles.loanPurposeSelect, touched && !purpose && { borderColor: c.danger200, backgroundColor: c.danger50 }]}>
              <Txt weight="medium" style={{ color: purpose ? c.surface900 : c.surface400, fontSize: 12 }}>{purpose || 'Select purpose'}</Txt>
              <Icon icon={ChevronRight} size={16} color={c.surface400} />
            </Tap>
            {purposeOpen ? (
              <Animated.View entering={FadeIn.duration(160)} style={styles.loanPurposeMenu}>
                {purposeOptions.map((option) => (
                  <Tap key={option} onPress={() => { setPurpose(option); setPurposeOpen(false); }} style={styles.loanPurposeItem}>
                    <Txt weight="medium" style={{ color: c.surface700, fontSize: 12 }}>{option}</Txt>
                    {purpose === option ? <Icon icon={Check} size={14} color={c.formalio700} /> : null}
                  </Tap>
                ))}
              </Animated.View>
            ) : null}
          </Card>

          <Grid columns={2} gap={10}>
            <LoanCalcCard label="Interest rate" value={`${interestRate}%`} detail="annual fixed" tone="blue" icon={Calculator} />
            <LoanCalcCard label="Processing fee" value={formatFCFA(processingFee)} detail="1.5% one-time" tone="amber" icon={Receipt} />
            <LoanCalcCard label="Interest amount" value={formatFCFA(interestAmount)} detail={`${duration} months`} tone="amber" icon={TrendingUp} />
            <LoanCalcCard label="Total repayment" value={formatFCFA(totalRepayment)} detail="principal + charges" tone="green" icon={Wallet} />
            <LoanCalcCard label="Loan approval probability" value={`${approvalProbability}%`} detail="AI lending signal" tone="blue" icon={Sparkles} />
            <LoanCalcCard label="Borrowing strength index" value={`${borrowingStrengthIndex}%`} detail="cashflow + behavior" tone="green" icon={Award} />
          </Grid>

          <Card style={{ padding: 14 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
              <Txt weight="bold" style={{ fontSize: 12 }}>Real-time validation</Txt>
              <Pill tone={isValid ? 'green' : 'red'}>{isValid ? 'Ready' : 'Action needed'}</Pill>
            </Row>
            {validationMessages.map((message) => (
              <Row key={message.text} style={styles.validationRow}>
                <View style={[styles.validationDot, { backgroundColor: message.ok ? c.formalio500 : touched ? c.danger500 : c.surface300 }]} />
                <Txt style={{ color: message.ok ? c.surface700 : touched ? c.danger600 : c.surface500, fontSize: 11, lineHeight: 16, flex: 1 }}>{message.text}</Txt>
              </Row>
            ))}
          </Card>

          <Tap onPress={() => setAcceptedTerms((accepted) => !accepted)} style={[styles.termsRow, touched && !acceptedTerms && { borderColor: c.danger200, backgroundColor: c.danger50 }]}>
            <View style={[styles.checkbox, acceptedTerms && styles.checkboxActive]}>
              {acceptedTerms ? <Icon icon={Check} size={13} color={c.white} /> : null}
            </View>
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, flex: 1 }}>I confirm this simulation can be reviewed by Formalio lending partners and I accept the loan terms and conditions.</Txt>
          </Tap>
        </ScrollView>
        <View style={styles.loanStickyFooter}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Txt style={{ color: c.surface500, fontSize: 11 }}>Total repayment</Txt>
            <Txt weight="black" style={{ color: c.surface900, fontSize: 14 }}>{formatFCFA(totalRepayment)}</Txt>
          </Row>
          <PrimaryButton
            label={submitting ? 'Envoi de la demande...' : 'Envoyer la demande de prêt'}
            icon={submitting ? RefreshCw : Check}
            disabled={submitting || !isValid}
            onPress={submitLoanRequest}
            style={{ minHeight: 48, borderRadius: 14 }}
          />
        </View>
      </View>
    </ModalShell>
  );
}

function LoanCalcCard({ label, value, detail, tone, icon }: { label: string; value: string; detail: string; tone: 'green' | 'amber' | 'blue'; icon: LucideIcon }) {
  const palette = tone === 'green' ? [c.formalio50, c.formalio700] : tone === 'amber' ? [c.gold50, c.gold700] : [c.info50, c.info700];
  return (
    <Animated.View entering={FadeIn.duration(180)} style={[styles.loanCalcCard, { backgroundColor: palette[0], borderColor: `${palette[1]}22` }]}>
      <Row style={{ justifyContent: 'space-between', gap: 8, marginBottom: 8 }}>
        <View style={[styles.loanCalcIcon, { backgroundColor: c.white }]}><Icon icon={icon} size={15} color={palette[1]} /></View>
        <View style={[styles.reportMetricAccent, { backgroundColor: palette[1] }]} />
      </Row>
      <Txt numberOfLines={2} style={{ color: palette[1], fontSize: 10, lineHeight: 13 }}>{label}</Txt>
      <Txt weight="black" numberOfLines={1} style={{ color: c.surface900, fontSize: 15, marginTop: 4 }}>{value}</Txt>
      <Txt numberOfLines={1} style={{ color: c.surface500, fontSize: 10, marginTop: 2 }}>{detail}</Txt>
    </Animated.View>
  );
}

function LoanSuccessModal({ summary, onClose }: { summary: LoanRequestSummary | null; onClose: () => void }) {
  if (!summary) return null;
  return (
    <ModalShell visible align="center" onClose={onClose}>
      <View style={styles.loanSuccessCard}>
        <AnimatedMascot state="celebrate" size={112} />
        <Txt weight="black" style={{ fontSize: 20, textAlign: 'center', marginTop: 10 }}>Loan request submitted</Txt>
        <Txt style={{ color: c.surface500, fontSize: 12, lineHeight: 18, textAlign: 'center', marginTop: 6 }}>Formalio is preparing your lending file with the latest Mosika score data.</Txt>
        <View style={styles.successSummary}>
          <InfoLine label="Amount" value={formatFCFA(summary.amount)} valueColor={c.formalio700} />
          <InfoLine label="Duration" value={`${summary.duration} months`} />
          <InfoLine label="Total repayment" value={formatFCFA(summary.totalRepayment)} />
          <InfoLine label="Approval probability" value={`${summary.approvalProbability}%`} valueColor={c.formalio700} />
          <InfoLine label="Borrowing strength" value={`${summary.borrowingStrengthIndex}%`} valueColor={c.formalio700} />
        </View>
        <PrimaryButton label="Done" icon={Check} onPress={onClose} style={{ width: '100%', borderRadius: 14, minHeight: 46 }} />
      </View>
    </ModalShell>
  );
}

function LoanSlider({
  label,
  value,
  onValueChange,
  min,
  max,
  step,
  minLabel,
  maxLabel,
}: {
  label: string;
  value: number;
  onValueChange: (v: number) => void;
  min: number;
  max: number;
  step: number;
  minLabel: string;
  maxLabel: string;
}) {
  return (
    <View>
      <Row style={{ justifyContent: 'space-between', marginBottom: 2 }}>
        <Txt weight="medium" style={{ color: c.surface600, fontSize: 12 }}>{label}</Txt>
        <Txt weight="black" style={{ color: c.formalio700, fontSize: 12 }}>{formatFCFA(value)}</Txt>
      </Row>
      <Slider value={value} minimumValue={min} maximumValue={max} step={step} onValueChange={onValueChange} minimumTrackTintColor={c.formalio700} maximumTrackTintColor={c.surface200} thumbTintColor={c.formalio700} />
      <Row style={{ justifyContent: 'space-between' }}>
        <Txt style={{ color: c.surface400, fontSize: 10 }}>{minLabel}</Txt>
        <Txt style={{ color: c.surface400, fontSize: 10 }}>{maxLabel}</Txt>
      </Row>
    </View>
  );
}

type ReportType = 'bilan' | 'compte-resultat' | 'tresorerie' | 'tva';
type BackendReportType = 'bilan' | 'resultat' | 'cashflow' | 'tva' | 'loan_readiness' | 'dashboard_summary';

function MobileMoneyScreen({ shellProps }: { shellProps: ShellProps }) {
  const { showToast } = useToast();
  return (
    <ScreenWrapper {...shellProps} title="Mobile Money">
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <AnimatedMascot state="secure" size={100} />
        <Txt weight="semibold" style={{ fontSize: 18, marginTop: 12 }}>Connectez vos comptes</Txt>
        <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 4 }}>Importez automatiquement vos transactions</Txt>
      </View>
      <View style={{ gap: 12 }}>
        {[
          { name: 'MTN MoMo', connected: true, lastSync: '2 min', count: 45, colors: ['#fbbf24', '#eab308'] },
          { name: 'Orange Money', connected: true, lastSync: '15 min', count: 23, colors: ['#fb923c', '#f97316'] },
          { name: 'Wave', connected: false, lastSync: '-', count: 0, colors: ['#60a5fa', '#3b82f6'] },
        ].map((account) => {
          const provider = getMobileMoneyProvider(account.name);
          return (
          <Card key={account.name}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <Row style={{ gap: 12 }}>
                {provider ? (
                  <MobileMoneyIcon provider={provider} size={48} containerStyle={styles.moneyLogo} />
                ) : (
                  <LinearGradient colors={account.colors as [string, string]} style={styles.moneyLogo}>
                    <Txt weight="bold" style={{ color: c.white, fontSize: 18 }}>{account.name[0]}</Txt>
                  </LinearGradient>
                )}
                <View>
                  <Txt weight="medium" style={{ fontSize: 14 }}>{account.name}</Txt>
                  <Txt style={{ color: c.surface400, fontSize: 12, marginTop: 2 }}>{account.connected ? `Sync: ${account.lastSync}` : 'Non connecté'}</Txt>
                </View>
              </Row>
              {account.connected ? <Pill>Actif</Pill> : null}
            </Row>
            {account.connected ? (
              <View style={styles.syncRow}>
                <Txt style={{ color: c.surface600, fontSize: 12 }}>{account.count} transactions importées</Txt>
                <Tap
                  onPress={() => {
                    showToast({ type: 'loading', title: 'Synchronisation...', duration: 1500 });
                    setTimeout(() => showToast({ type: 'success', title: 'Sync réussie !', message: '3 nouvelles transactions' }), 1500);
                  }}
                >
                  <Row style={{ gap: 4 }}>
                    <Icon icon={RefreshCw} size={13} color={c.formalio700} />
                    <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Sync</Txt>
                  </Row>
                </Tap>
              </View>
            ) : (
              <PrimaryButton label="Connecter" tone="surface" onPress={() => showToast({ type: 'info', title: 'Connexion Wave', message: 'Bientôt disponible !' })} />
            )}
          </Card>
          );
        })}
      </View>
    </ScreenWrapper>
  );
}

function NotificationsScreen({ shellProps, notifications, setNotifications }: { shellProps: ShellProps; notifications: typeof initialNotifications; setNotifications: (v: typeof initialNotifications) => void }) {
  const { showToast } = useToast();
  return (
    <ScreenWrapper
      {...shellProps}
      title="Notifications"
      rightAction={
        <Tap
          onPress={() => {
            setNotifications(notifications.map((n) => ({ ...n, read: true })));
            showToast({ type: 'success', title: 'Tout est lu' });
          }}
        >
          <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Tout lire</Txt>
        </Tap>
      }
    >
      {notifications.length === 0 ? (
        <View style={{ alignItems: 'center', paddingVertical: 48 }}>
          <AnimatedMascot state="sleeping" size={120} />
          <Txt weight="semibold" style={{ color: c.surface700, marginTop: 16 }}>Tout est calme</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 4 }}>Aucune notification pour le moment</Txt>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {notifications.map((n) => (
            <View key={n.id} style={[styles.notificationCard, !n.read && { borderColor: c.formalio200, backgroundColor: 'rgba(236,253,245,.65)' }]}>
              <View style={[styles.notificationIcon, { backgroundColor: n.type === 'success' ? c.formalio100 : n.type === 'warning' ? c.amber100 : c.info100 }]}>
                <Icon icon={n.type === 'success' ? CheckCircle2 : n.type === 'warning' ? AlertTriangle : Bell} size={20} color={n.type === 'success' ? c.formalio700 : n.type === 'warning' ? c.amber700 : c.info600} />
              </View>
              <View style={{ flex: 1 }}>
                <Row style={{ justifyContent: 'space-between' }}>
                  <Txt weight="medium" style={{ fontSize: 13 }}>{n.title}</Txt>
                  <Txt style={{ color: c.surface400, fontSize: 11 }}>{n.time}</Txt>
                </Row>
                <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 3 }}>{n.message}</Txt>
              </View>
              {!n.read ? <View style={styles.unreadDot} /> : null}
            </View>
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

function AiInsightsScreen({ shellProps, metrics }: { shellProps: ShellProps; metrics: CloudFinancialMetrics }) {
  const empty = metrics.emptyState || metrics.transactionCount === 0;
  const insights = empty
    ? [
        { id: 1, type: 'info', title: 'Aucune activité analysée', message: 'Ajoutez vos premières transactions pour activer les insights Mosika.', impact: '0 transaction' },
        { id: 2, type: 'opportunity', title: 'Profil à compléter', message: 'La conformité, les documents et la vérification influencent vos futurs scores.', impact: `${metrics.complianceScore}% conformité` },
        { id: 3, type: 'info', title: 'Score institutionnel initial', message: 'Le Score Mosika demarre a 0 et progresse lentement avec un historique financier verifie.', impact: `Score ${metrics.mosikaScore}` },
      ]
    : [
        { id: 1, type: metrics.profit >= 0 ? 'success' : 'alert', title: metrics.profit >= 0 ? 'Résultat positif' : 'Résultat à surveiller', message: `Profit net actuel: ${formatFCFA(metrics.profit)} avec une marge de ${metrics.profitMargin.toFixed(1)}%.`, impact: `${metrics.financialHealth}% santé` },
        { id: 2, type: 'opportunity', title: 'Cash flow réel', message: `Trésorerie nette: ${formatFCFA(metrics.cashFlow)} sur ${metrics.transactionCount} transactions.`, impact: `${metrics.growthRate.toFixed(1)}% croissance` },
        { id: 3, type: metrics.expenses > metrics.revenue ? 'alert' : 'success', title: 'Ratio dépenses', message: `Dépenses: ${formatFCFA(metrics.expenses)} contre revenus: ${formatFCFA(metrics.revenue)}.`, impact: `${metrics.revenue ? Math.round((metrics.expenses / metrics.revenue) * 100) : 0}% du CA` },
      ];
  return (
    <ScreenWrapper {...shellProps} title="Insights IA">
      <View style={styles.aiHeaderCard}>
        <AnimatedMascot state="thinking" size={48} />
        <View>
          <Txt weight="semibold" style={{ fontSize: 14 }}>Mosika Intelligence</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 2 }}>Basé sur vos {metrics.transactionCount} transactions</Txt>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        {insights.map((insight) => {
          const alert = insight.type === 'alert';
          const opportunity = insight.type === 'opportunity';
          return (
            <View key={insight.id} style={[styles.insightCard, { backgroundColor: alert ? c.danger50 : opportunity ? c.gold50 : c.formalio50, borderColor: alert ? c.danger200 : opportunity ? c.gold200 : c.formalio200 }]}>
              <View style={[styles.notificationIcon, { backgroundColor: alert ? c.danger100 : opportunity ? c.gold100 : c.formalio100 }]}>
                <Icon icon={alert ? AlertTriangle : opportunity ? Sparkles : CheckCircle2} size={17} color={alert ? c.danger600 : opportunity ? c.gold600 : c.formalio700} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="semibold" style={{ fontSize: 14 }}>{insight.title}</Txt>
                <Txt style={{ color: c.surface600, fontSize: 12, lineHeight: 17, marginTop: 5 }}>{insight.message}</Txt>
                <Txt weight="medium" style={{ color: alert ? c.danger600 : opportunity ? c.gold600 : c.formalio700, fontSize: 12, marginTop: 8 }}>{insight.impact}</Txt>
              </View>
            </View>
          );
        })}
      </View>
    </ScreenWrapper>
  );
}

function TaxScreen({ shellProps, navigate, metrics }: { shellProps: ShellProps; navigate: (s: Screen) => void; metrics: CloudFinancialMetrics }) {
  const hasTax = metrics.taxDue > 0;
  const nextDue = new Date();
  nextDue.setDate(20);
  if (nextDue < new Date()) nextDue.setMonth(nextDue.getMonth() + 1);
  const dueLabel = nextDue.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' });
  return (
    <ScreenWrapper {...shellProps} title="Fiscalité">
      <View style={styles.taxAlert}>
        <Icon icon={AlertTriangle} size={24} color={c.amber600} />
        <View style={{ flex: 1 }}>
          <Txt weight="semibold" style={{ color: c.amber700, fontSize: 14 }}>{hasTax ? `TVA estimée: ${formatFCFA(metrics.taxDue)}` : 'Aucune TVA à déclarer pour le moment'}</Txt>
          <Txt style={{ color: c.amber700, fontSize: 12, marginTop: 4 }}>{hasTax ? `Date cible: ${dueLabel}` : 'Ajoutez des transactions pour calculer la TVA.'}</Txt>
          <Tap onPress={() => navigate('reports')} style={styles.taxButton}>
            <Txt weight="medium" style={{ color: c.white, fontSize: 12 }}>Préparer la déclaration</Txt>
          </Tap>
        </View>
      </View>
      <Card>
        <Txt weight="semibold" style={{ fontSize: 14, marginBottom: 12 }}>Calendrier Fiscal</Txt>
        {[
          { date: nextDue.toLocaleDateString('fr-FR', { day: '2-digit', month: 'short' }), label: `Déclaration TVA · ${formatFCFA(metrics.taxDue)}`, status: hasTax ? 'upcoming' : 'future' },
          { date: '15 Fév', label: `TVA collectée · ${formatFCFA(metrics.taxCollected)}`, status: 'future' },
          { date: '31 Mar', label: `TVA déductible · ${formatFCFA(metrics.taxDeductible)}`, status: 'future' },
        ].map((item) => (
          <Row key={item.label} style={{ gap: 12, paddingVertical: 9 }}>
            <View style={{ width: 48, alignItems: 'center' }}>
              <Txt weight="bold" style={{ color: c.surface700, fontSize: 12 }}>{item.date.split(' ')[0]}</Txt>
              <Txt style={{ color: c.surface400, fontSize: 10 }}>{item.date.split(' ')[1]}</Txt>
            </View>
            <Txt style={{ flex: 1, fontSize: 13 }}>{item.label}</Txt>
            <View style={[styles.statusDot, { backgroundColor: item.status === 'upcoming' ? c.amber500 : c.surface300 }]} />
          </Row>
        ))}
      </Card>
    </ScreenWrapper>
  );
}

function SettingsScreen({ shellProps, profile, setProfile, onSaveProfile }: { shellProps: ShellProps; profile: BusinessProfile; setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>; onSaveProfile?: (profile: BusinessProfile) => Promise<void> }) {
  const { showToast } = useToast();
  const [toggles, setToggles] = useState({ darkMode: false, notifications: true, offlineSync: true });
  const t = useCallback((key: string, fallback?: string) => translate(profile.language, key, fallback), [profile.language]);
  const emailMeta = getEmailVerificationMeta(profile.emailVerificationStatus);
  const setLanguage = (language: SupportedLanguage) => {
    const nextProfile = { ...profile, language };
    setProfile(nextProfile);
    void updateTrustedOfflineProfile({ profile: nextProfile }).catch(() => undefined);
    void onSaveProfile?.(nextProfile)
      .then(() => showToast({ type: 'success', title: translate(language, 'settings.language'), message: translate(language, 'settings.languageHint') }))
      .catch((error) => showToast({ type: 'error', title: t('profile.saveError'), message: error instanceof Error ? error.message : t('common.retry') }));
  };
  return (
    <ScreenWrapper {...shellProps} title={t('settings.title')}>
      <EmailVerificationCard profile={profile} setProfile={setProfile} compact />
      <Card style={{ marginBottom: 14 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
          <View>
            <Txt weight="bold" style={{ fontSize: 14 }}>{t('settings.language')}</Txt>
            <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>{t('settings.languageHint')}</Txt>
          </View>
          <Icon icon={Globe} size={20} color={c.formalio600} />
        </Row>
        <Grid columns={2} gap={10}>
          {([
            ['en', t('common.english')],
            ['fr', t('common.french')],
          ] as const).map(([language, label]) => (
            <Tap key={language} onPress={() => setLanguage(language)} style={[styles.languageChoice, profile.language === language && styles.languageChoiceActive]}>
              <Txt weight="bold" style={{ color: profile.language === language ? c.formalio700 : c.surface600, fontSize: 13 }}>{label}</Txt>
            </Tap>
          ))}
        </Grid>
      </Card>
      <View style={styles.settingsList}>
        {[
          { icon: Globe, label: 'Langue', value: 'Français' },
          { icon: Mail, label: t('settings.email'), value: emailMeta.label },
          { icon: Moon, label: t('settings.darkMode'), toggle: 'darkMode' as const },
          { icon: Bell, label: t('settings.notifications'), toggle: 'notifications' as const },
          { icon: WifiOff, label: t('settings.offlineSync'), toggle: 'offlineSync' as const },
        ].filter((item) => item.icon !== Globe).map((item, i) => {
          const toggleKey = (item as { toggle?: keyof typeof toggles }).toggle;
          return (
            <Row key={item.label} style={[styles.settingsItem, i > 0 && { borderTopWidth: 1, borderTopColor: c.surface100 }]}>
              <Icon icon={item.icon} size={20} color={c.surface500} />
              <Txt style={{ flex: 1, color: c.surface700, fontSize: 14 }}>{item.label}</Txt>
              {toggleKey ? (
                <Tap
                  onPress={() => {
                    const next = !toggles[toggleKey];
                    setToggles({ ...toggles, [toggleKey]: next });
                    showToast({ type: 'success', title: `${item.label} ${next ? 'activé' : 'désactivé'}` });
                  }}
                  style={[styles.switchTrack, toggles[toggleKey] && { backgroundColor: c.formalio500 }]}
                >
                  <View style={[styles.switchThumb, toggles[toggleKey] && { transform: [{ translateX: 20 }] }]} />
                </Tap>
              ) : (
                <Txt style={{ color: c.surface400, fontSize: 14 }}>{(item as { value: string }).value}</Txt>
              )}
            </Row>
          );
        })}
      </View>
      <Card style={{ marginTop: 14, marginBottom: 14 }}>
        <Txt weight="bold" style={{ color: c.surface900, fontSize: 13, letterSpacing: 0, marginBottom: 6 }}>
          INFORMATIONS LÉGALES
        </Txt>
        {legalMenuItems.map((item, i) => (
          <Tap
            key={item.routeName}
            onPress={() => shellProps.navigate(item.routeName)}
            style={[styles.settingsItem, { flexDirection: 'row', alignItems: 'center' }, i > 0 && { borderTopWidth: 1, borderTopColor: c.surface100 }]}
          >
            <Row style={{ flex: 1, gap: 12 }}>
              <Txt style={{ width: 24, fontSize: 18, textAlign: 'center' }}>{item.icon}</Txt>
              <Txt style={{ flex: 1, color: c.surface700, fontSize: 14, lineHeight: 20 }}>{item.title}</Txt>
            </Row>
            <Icon icon={ChevronRight} size={18} color={c.surface400} />
          </Tap>
        ))}
      </Card>
    </ScreenWrapper>
  );
}

function SecurityScreen({ shellProps, profile, setProfile }: { shellProps: ShellProps; profile: BusinessProfile; setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>> }) {
  return (
    <ScreenWrapper {...shellProps} title="Sécurité">
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <AnimatedMascot state="secure" size={100} />
        <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 12 }}>Vos données sont chiffrées et sécurisées</Txt>
      </View>
      <EmailVerificationCard profile={profile} setProfile={setProfile} compact />
      <View style={styles.settingsList}>
        {[
          { icon: Lock, label: 'Code PIN', value: 'Activé' },
          { icon: Smartphone, label: 'Biométrie', value: 'Empreinte' },
          { icon: Shield, label: '2FA', value: 'Activée' },
        ].map((item, i) => (
          <Row key={item.label} style={[styles.settingsItem, i > 0 && { borderTopWidth: 1, borderTopColor: c.surface100 }]}>
            <Icon icon={item.icon} size={20} color={c.surface500} />
            <Txt style={{ flex: 1, color: c.surface700, fontSize: 14 }}>{item.label}</Txt>
            <Txt weight="medium" style={{ color: c.formalio600, fontSize: 14 }}>{item.value}</Txt>
          </Row>
        ))}
      </View>
      <View style={styles.securityCallout}>
        <Icon icon={Shield} size={20} color={c.formalio600} />
        <View style={{ flex: 1 }}>
          <Txt weight="medium" style={{ color: c.formalio800, fontSize: 14 }}>Chiffrement bancaire</Txt>
          <Txt style={{ color: c.formalio600, fontSize: 12, marginTop: 4 }}>AES-256 · TLS 1.3 · Données jamais partagées</Txt>
        </View>
      </View>
    </ScreenWrapper>
  );
}

function SubscriptionScreen({ shellProps, subscription }: { shellProps: ShellProps; subscription: CloudSubscription }) {
  const tierLabels = { free: 'Free', starter: 'Starter', growth: 'Growth', enterprise: 'Enterprise' } as const;
  const statusLabels = { trialing: 'Essai', active: 'Actif', past_due: 'Paiement requis', paused: 'Pause', canceled: 'Annulé', expired: 'Expiré' } as const;
  const renewal = subscription.currentPeriodEnd ? new Date(subscription.currentPeriodEnd).toLocaleDateString('fr-FR', { day: '2-digit', month: 'short', year: 'numeric' }) : 'Non défini';
  return (
    <ScreenWrapper {...shellProps} title="Abonnement">
      <LinearGradient colors={[c.formalio800, c.formalio900]} style={styles.subscriptionHero}>
        <Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 14 }}>Plan Actuel</Txt>
        <Txt weight="bold" style={{ color: c.white, fontSize: 26, marginTop: 4 }}>{tierLabels[subscription.tier]}</Txt>
        <Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, marginTop: 4 }}>{statusLabels[subscription.status]} · {subscription.seats} seat{subscription.seats > 1 ? 's' : ''}</Txt>
        <View style={styles.renewalPill}>
          <Icon icon={CheckCircle2} size={13} color={c.white} />
          <Txt style={{ color: c.white, fontSize: 12 }}>Renouvellement: {renewal}</Txt>
        </View>
      </LinearGradient>
      <Txt weight="semibold" style={{ fontSize: 14, marginBottom: 12 }}>Changer de plan</Txt>
      <View style={{ gap: 12 }}>
        {pricingPlans.map((plan) => (
          <Card key={plan.name} style={{ borderColor: plan.name.toLowerCase().includes(subscription.tier) ? c.formalio300 : c.surface200 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Txt weight="semibold" style={{ fontSize: 15 }}>{plan.name}</Txt>
              {plan.name.toLowerCase().includes(subscription.tier) ? <Pill>Actuel</Pill> : null}
            </Row>
            <Txt weight="bold" style={{ fontSize: 18 }}>{plan.price} <Txt style={{ color: c.surface500, fontSize: 13 }}>{plan.period}</Txt></Txt>
            <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 6 }}>{plan.description}</Txt>
          </Card>
        ))}
      </View>
    </ScreenWrapper>
  );
}

function HelpScreen({ shellProps, openAi, language }: { shellProps: ShellProps; openAi: () => void; language: SupportedLanguage }) {
  const t = useCallback((key: string, fallback?: string) => translate(language, key, fallback), [language]);
  return (
    <ScreenWrapper {...shellProps} title={t('help.title')}>
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <AnimatedMascot state="wave" size={100} />
        <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 12 }}>{t('help.prompt')}</Txt>
      </View>
      <View style={{ gap: 12 }}>
        {[
          { icon: MessageCircle, label: t('help.chat'), desc: t('help.chatDesc'), action: openAi },
          { icon: Phone, label: t('help.call'), desc: '+237 6XX XXX XXX' },
          { icon: HelpCircle, label: t('help.helpCenter'), desc: t('help.helpCenterDesc') },
        ].map((item) => (
          <Tap key={item.label} onPress={item.action} style={styles.helpRow}>
            <View style={[styles.transactionIcon, { backgroundColor: c.formalio50 }]}><Icon icon={item.icon} size={20} color={c.formalio600} /></View>
            <View style={{ flex: 1 }}>
              <Txt weight="medium" style={{ fontSize: 13 }}>{item.label}</Txt>
              <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 3 }}>{item.desc}</Txt>
            </View>
            <Icon icon={ChevronRight} size={16} color={c.surface400} />
          </Tap>
        ))}
      </View>
      <Card style={{ marginTop: 16 }}>
        <Row style={{ gap: 10, marginBottom: 12 }}>
          <View style={[styles.transactionIcon, { backgroundColor: c.formalio50 }]}><Icon icon={Sparkles} size={20} color={c.formalio600} /></View>
          <Txt weight="black" style={{ color: c.surface900, fontSize: 16 }}>{t('help.aboutTitle')}</Txt>
        </Row>
        {[t('help.mission'), t('help.vision'), t('help.security')].map((paragraph) => (
          <Txt key={paragraph} style={{ color: c.surface600, fontSize: 12, lineHeight: 18, marginBottom: 10 }}>{paragraph}</Txt>
        ))}
      </Card>
    </ScreenWrapper>
  );
}

function ReferralScreen({ shellProps }: { shellProps: ShellProps }) {
  const { showToast } = useToast();
  return (
    <ScreenWrapper {...shellProps} title="Parrainage">
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <AnimatedMascot state="celebrate" size={100} />
        <Txt weight="semibold" style={{ fontSize: 18, marginTop: 12 }}>Parrainez et Gagnez</Txt>
        <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 4 }}>Gagnez 1,000 FCFA par ami parrainé</Txt>
      </View>
      <LinearGradient colors={[c.gold50, '#fef3c766']} style={styles.referralCard}>
        <Txt style={{ color: c.gold700, fontSize: 14 }}>Votre code de parrainage</Txt>
        <Txt weight="bold" style={{ color: c.gold700, fontSize: 32, letterSpacing: 0, marginTop: 8 }}>FORM24</Txt>
        <Tap onPress={() => showToast({ type: 'success', title: 'Code copié !', message: 'FORM24' })} style={styles.copyCode}>
          <Txt weight="medium" style={{ color: c.white, fontSize: 12 }}>Copier le Code</Txt>
        </Tap>
      </LinearGradient>
      <Card style={{ marginBottom: 16 }}>
        <Txt weight="semibold" style={{ fontSize: 14, marginBottom: 12 }}>Vos statistiques</Txt>
        <Grid columns={3} gap={12}>
          {[
            ['12', 'Parrainés', c.surface900],
            ['8', 'Actifs', c.surface900],
            ['8K', 'Gagnés', c.gold600],
          ].map(([value, label, color]) => (
            <View key={label} style={{ alignItems: 'center' }}>
              <Txt weight="bold" style={{ fontSize: 20, color }}>{value}</Txt>
              <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 2 }}>{label}</Txt>
            </View>
          ))}
        </Grid>
      </Card>
      <PrimaryButton label="Partager mon code" icon={Share2} />
    </ScreenWrapper>
  );
}

function OfflineScreen({ shellProps }: { shellProps: ShellProps }) {
  return (
    <ScreenWrapper {...shellProps} title="Hors Ligne">
      <View style={{ minHeight: 520, alignItems: 'center', justifyContent: 'center' }}>
        <AnimatedMascot state="thinking" size={120} />
        <Txt weight="semibold" style={{ fontSize: 18, marginTop: 16 }}>Vous êtes hors ligne</Txt>
        <Txt style={{ color: c.surface500, fontSize: 14, textAlign: 'center', marginTop: 8, lineHeight: 20 }}>Pas de souci ! Vous pouvez continuer à utiliser Formalio. Vos données seront synchronisées automatiquement.</Txt>
      </View>
    </ScreenWrapper>
  );
}

function AccountingScreen({ shellProps, transactions, metrics, navigate, openDownload }: { shellProps: ShellProps; transactions: Transaction[]; metrics: CloudFinancialMetrics; navigate: (s: Screen) => void; openDownload: (title: string, period: string) => void }) {
  const { showToast } = useToast();
  type AccTab = 'overview' | 'sales' | 'expenses' | 'ai' | 'reports';
  type Period = 'daily' | 'weekly' | 'monthly' | 'annual';
  const [accTab, setAccTab] = useState<AccTab>('overview');
  const [period, setPeriod] = useState<Period>('weekly');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const totalIncome = metrics.revenue;
  const totalExpense = metrics.expenses;
  const netProfit = metrics.profit;
  const margin = Math.round(metrics.profitMargin);
  const taxEstimate = metrics.taxDue;
  const emptyDailyData = ['Lun', 'Mar', 'Mer', 'Jeu', 'Ven', 'Sam', 'Dim'].map((label) => ({ label, sales: 0, expense: 0 }));
  const periodData = (metrics.dailyCashflow.length ? metrics.dailyCashflow : emptyDailyData).map((item) => ({
    label: item.label,
    sales: 'income' in item ? item.income : item.sales,
    expense: item.expense,
  }));
  const categoryBreakdown = (metrics.categoryBreakdown.filter((item) => item.type === 'income').length ? metrics.categoryBreakdown.filter((item) => item.type === 'income') : [{ name: 'Aucun revenu', share: 100 }]).map((item, index) => ({
    name: item.name,
    value: Math.round(item.share || 0),
    color: [c.formalio800, c.info500, c.gold500, c.formalio500][index % 4],
  }));
  const expenseBreakdown = (metrics.categoryBreakdown.filter((item) => item.type === 'expense').length ? metrics.categoryBreakdown.filter((item) => item.type === 'expense') : [{ name: 'Aucune depense', share: 100 }]).map((item, index) => ({
    name: item.name,
    value: Math.round(item.share || 0),
    color: [c.danger600, c.orange500, c.gold500, c.purple500, c.surface500][index % 5],
  }));
  const hasAccountingData = !metrics.emptyState && transactions.length > 0;
  const todayIso = new Date().toISOString().slice(0, 10);
  const todayIncome = transactions.filter((transaction) => transaction.date === todayIso && transaction.type === 'income').reduce((sum, transaction) => sum + transaction.amount, 0);
  const expenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;
  const topIncomeCategory = categoryBreakdown.find((item) => item.name !== 'Aucun revenu');
  const topExpenseCategory = expenseBreakdown.find((item) => item.name !== 'Aucune depense');
  const anomalyRows = hasAccountingData
    ? [
        ...(metrics.riskIndicators?.amountAnomalies ? [{ label: 'Montants atypiques', desc: `${metrics.riskIndicators.amountAnomalies} mouvement(s) à vérifier`, tone: c.danger500 }] : []),
        ...(metrics.riskIndicators?.duplicateReferences ? [{ label: 'Références doublons', desc: `${metrics.riskIndicators.duplicateReferences} doublon(s) potentiel(s)`, tone: c.gold500 }] : []),
        { label: topExpenseCategory ? topExpenseCategory.name : 'Dépenses', desc: topExpenseCategory ? `${topExpenseCategory.value}% des dépenses` : 'Aucun poste dominant', tone: c.formalio500 },
      ]
    : [{ label: 'Aucune anomalie', desc: 'Ajoutez des transactions pour activer la détection.', tone: c.surface400 }];
  const optimizationSuggestions = hasAccountingData
    ? [
        expenseRatio > 85 ? 'Réduire les charges variables avant toute demande de financement.' : 'Maintenir le ratio dépenses/revenus sous surveillance chaque semaine.',
        metrics.profit < 0 ? 'Prioriser les encaissements et limiter les sorties non essentielles.' : 'Documenter les revenus récurrents pour renforcer la crédibilité du dossier.',
        metrics.scoreConfidence < 45 ? 'Accumuler plusieurs mois de données régulières pour améliorer la confiance Mosika.' : 'Conserver les justificatifs et rapprochements pour stabiliser le score.',
      ]
    : ['Ajoutez vos premières transactions réelles pour produire des recommandations fiables.'];
  const runAIAnalysis = () => {
    setAiThinking(true);
    setAiAnalysis(null);
    setTimeout(() => {
      setAiThinking(false);
      if (!hasAccountingData) {
        setAiAnalysis(`Analyse Mosika AI · ${new Date().toLocaleDateString('fr-FR')}\n\n- Aucune transaction réelle n'est encore disponible pour ce compte.\n- Revenus analysés: ${formatFCFA(0)}.\n- Dépenses analysées: ${formatFCFA(0)}.\n- Score Mosika: ${metrics.mosikaScore}/1000 avec ${metrics.scoreConfidence}% de confiance.\n\nAjoutez des revenus, dépenses et justificatifs pour activer une analyse financière fiable.`);
        return;
      }
      setAiAnalysis(`Analyse Mosika AI · ${new Date().toLocaleDateString('fr-FR')}\n\n- Revenus analysés: ${formatFCFA(totalIncome)}.\n- Dépenses analysées: ${formatFCFA(totalExpense)} (${expenseRatio}% des revenus).\n- Résultat net: ${formatFCFA(netProfit)} avec une marge de ${margin}%.\n- Catégorie de revenus dominante: ${topIncomeCategory ? `${topIncomeCategory.name} (${topIncomeCategory.value}%)` : 'non déterminée'}.\n- Catégorie de dépenses dominante: ${topExpenseCategory ? `${topExpenseCategory.name} (${topExpenseCategory.value}%)` : 'non déterminée'}.\n- Score Mosika: ${metrics.mosikaScore}/1000, confiance modèle ${metrics.scoreConfidence}%.\n\nRecommandation: ${optimizationSuggestions[0]}`);
    }, 1800);
  };
  const generateAIReport = (type: string) => {
    setGeneratingReport(type);
    showToast({ type: 'loading', title: 'Génération du rapport...', message: type, duration: 1800 });
    setTimeout(() => {
      setGeneratingReport(null);
      showToast({ type: 'success', title: 'Rapport généré', message: `${type} prêt au téléchargement` });
      openDownload(type, new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' }));
    }, 2000);
  };
  return (
    <ScreenWrapper
      {...shellProps}
      title="Comptabilité IA"
      rightAction={
        <Tap onPress={runAIAnalysis} style={styles.aiMiniButton}>
          <Icon icon={Sparkles} size={13} color={c.white} />
          <Txt weight="bold" style={{ color: c.white, fontSize: 10 }}>AI</Txt>
        </Tap>
      }
    >
      <View style={{ gap: 12 }}>
        <Segment value={accTab} onChange={setAccTab} options={[{ key: 'overview', label: 'Vue', icon: BarChart3 }, { key: 'sales', label: 'Ventes', icon: TrendingUp }, { key: 'expenses', label: 'Dépenses', icon: Receipt }, { key: 'ai', label: 'IA', icon: BrainCircuit }, { key: 'reports', label: 'Docs', icon: FileText }]} />
        {accTab === 'overview' ? (
          <>
            <LinearGradient colors={[c.formalio900, c.formalio800, c.formalio700]} style={styles.pnlHero}>
              <Row style={{ gap: 6, marginBottom: 8 }}>
                <Icon icon={Calculator} size={16} color={c.formalio300} />
                <Txt weight="semibold" style={{ color: c.formalio200, fontSize: 12 }}>Profit & Loss · mai</Txt>
              </Row>
              <Txt weight="black" style={{ color: c.white, fontSize: 34, lineHeight: 38 }}>{netProfit.toLocaleString('fr-FR')}<Txt weight="bold" style={{ color: c.formalio300, fontSize: 16 }}> FCFA</Txt></Txt>
              <Txt style={{ color: c.formalio200, fontSize: 12, marginTop: 5 }}>Marge nette: <Txt weight="bold" style={{ color: c.formalio200, fontSize: 12 }}>{margin}%</Txt> · {hasAccountingData ? (netProfit >= 0 ? 'Résultat positif' : 'Résultat négatif') : 'Données à compléter'}</Txt>
              <Grid columns={2} gap={8}>
                <View style={styles.glassMetric}><Txt style={{ color: c.formalio200, fontSize: 10 }}>â†— Revenus</Txt><Txt weight="black" style={{ color: c.white, fontSize: 14 }}>{(totalIncome / 1000).toFixed(0)}K</Txt></View>
                <View style={styles.glassMetric}><Txt style={{ color: c.formalio200, fontSize: 10 }}>↘ Dépenses</Txt><Txt weight="black" style={{ color: c.white, fontSize: 14 }}>{(totalExpense / 1000).toFixed(0)}K</Txt></View>
              </Grid>
            </LinearGradient>
            <Grid columns={2} gap={8}>
              <AccKpi label="Ventes du jour" value={`${(todayIncome / 1000).toFixed(0)}K`} sub="FCFA" icon={TrendingUp} delta={hasAccountingData ? Math.round(metrics.growthRate) : undefined} />
              <AccKpi label="Cash Flow" value={`${metrics.cashFlow >= 0 ? '+' : ''}${(metrics.cashFlow / 1000).toFixed(0)}K`} sub={metrics.cashFlow >= 0 ? 'positif' : 'négatif'} icon={Wallet} delta={hasAccountingData ? Math.round(metrics.growthRate) : undefined} />
              <AccKpi label="TVA estimée" value={`${(taxEstimate / 1000).toFixed(0)}K`} sub="à déclarer" icon={Receipt} tone="amber" />
              <AccKpi label="Transactions" value={String(metrics.transactionCount)} sub="enregistrées" icon={Package} />
            </Grid>
            <Card>
              <PeriodPicker period={period} setPeriod={setPeriod} />
              <AreaChart data={periodData} keys={['sales', 'expense']} colors={[c.formalio800, c.danger600]} height={150} />
            </Card>
            <Tap onPress={() => setAccTab('ai')} style={styles.aiInsightsBanner}>
              <LinearGradient colors={[c.info500, c.formalio700]} style={styles.aiBannerIcon}><Icon icon={BrainCircuit} size={20} color={c.white} /></LinearGradient>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" style={{ fontSize: 12 }}>{hasAccountingData ? 'Mosika AI lit vos données' : 'Mosika AI attend vos données'}</Txt>
                <Txt numberOfLines={1} style={{ color: c.surface600, fontSize: 11 }}>{hasAccountingData ? `${metrics.transactionCount} transactions · score ${metrics.mosikaScore}` : 'Ajoutez des transactions pour obtenir des insights.'}</Txt>
              </View>
              <Icon icon={ChevronRight} size={16} color={c.surface400} />
            </Tap>
            <Grid columns={2} gap={8}>
              <Tap onPress={() => setAccTab('reports')} style={styles.accQuick}><View style={[styles.metricIcon, { backgroundColor: c.formalio50 }]}><Icon icon={FileText} size={16} color={c.formalio700} /></View><View><Txt weight="bold" style={{ fontSize: 12 }}>Rapports IA</Txt><Txt style={{ color: c.surface500, fontSize: 10 }}>{metrics.reportCount} disponible(s)</Txt></View></Tap>
              <Tap onPress={() => navigate('tax')} style={styles.accQuick}><View style={[styles.metricIcon, { backgroundColor: c.gold50 }]}><Icon icon={Receipt} size={16} color={c.gold600} /></View><View><Txt weight="bold" style={{ fontSize: 12 }}>Estimation Fiscale</Txt><Txt style={{ color: c.surface500, fontSize: 10 }}>{(taxEstimate / 1000).toFixed(0)}K FCFA</Txt></View></Tap>
            </Grid>
          </>
        ) : null}
        {accTab === 'sales' ? (
          <>
            <PeriodPicker period={period} setPeriod={setPeriod} />
            <LinearGradient colors={[c.formalio700, c.formalio900]} style={styles.salesHero}>
              <Txt style={{ color: c.formalio200, fontSize: 12 }}>Chiffre d'affaires {period === 'daily' ? "aujourd'hui" : period === 'weekly' ? '(7 jours)' : period === 'monthly' ? '(30 jours)' : '(année)'}</Txt>
              <Txt weight="black" style={{ color: c.white, fontSize: 30, marginTop: 4 }}>{(periodData.reduce((s, d) => s + d.sales, 0) / 1000).toFixed(0)}K <Txt weight="bold" style={{ color: c.formalio300, fontSize: 16 }}>FCFA</Txt></Txt>
              <Row style={{ gap: 6, marginTop: 8 }}><Icon icon={ArrowUpRight} size={13} color={c.formalio300} /><Txt style={{ color: c.formalio300, fontSize: 12 }}>{hasAccountingData ? `${metrics.growthRate >= 0 ? '+' : ''}${metrics.growthRate.toFixed(1)}% vs période précédente` : 'Aucune tendance disponible'}</Txt></Row>
            </LinearGradient>
            <Card><Txt weight="bold" style={{ fontSize: 12, marginBottom: 8 }}>Tendance des ventes</Txt><BarChart data={periodData} keys={['sales']} colors={[c.formalio800]} height={166} /></Card>
            <Card>
              <Txt weight="bold" style={{ fontSize: 12, marginBottom: 10 }}>Répartition par catégorie</Txt>
              <View style={{ alignItems: 'center' }}><DonutChart data={categoryBreakdown} size={126} /></View>
              {categoryBreakdown.map((item) => <LegendRow key={item.name} {...item} />)}
            </Card>
            <View style={styles.adviceCard}><Icon icon={BrainCircuit} size={17} color={c.formalio700} /><View style={{ flex: 1 }}><Txt weight="bold" style={{ fontSize: 12 }}>Performance commerciale</Txt><Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{hasAccountingData ? `Revenus dominants: ${topIncomeCategory ? topIncomeCategory.name : 'non déterminé'}. Suivez la régularité avant d'augmenter vos charges.` : 'Ajoutez des ventes pour identifier les catégories et les jours les plus performants.'}</Txt></View></View>
          </>
        ) : null}
        {accTab === 'expenses' ? (
          <>
            <LinearGradient colors={[c.danger500, c.danger700]} style={styles.salesHero}>
              <Txt style={{ color: c.danger100, fontSize: 12 }}>Dépenses totales (mois)</Txt>
              <Txt weight="black" style={{ color: c.white, fontSize: 30, marginTop: 4 }}>{(totalExpense / 1000).toFixed(0)}K <Txt weight="bold" style={{ color: c.danger200, fontSize: 16 }}>FCFA</Txt></Txt>
              <Row style={{ gap: 6, marginTop: 8 }}><Icon icon={ArrowDownRight} size={13} color={c.danger100} /><Txt style={{ color: c.danger100, fontSize: 12 }}>{hasAccountingData ? `${expenseRatio}% des revenus` : 'Aucune dépense enregistrée'}</Txt></Row>
            </LinearGradient>
            <Card>
              <Txt weight="bold" style={{ fontSize: 12, marginBottom: 12 }}>Top catégories de dépenses</Txt>
              {expenseBreakdown.map((item) => (
                <View key={item.name} style={{ marginBottom: 10 }}>
                  <Row style={{ justifyContent: 'space-between', marginBottom: 5 }}><Txt weight="medium" style={{ color: c.surface700, fontSize: 11 }}>{item.name}</Txt><Txt weight="black" style={{ fontSize: 11 }}>{item.value}%</Txt></Row>
                  <ValueBar value={item.value} color={item.color} />
                </View>
              ))}
            </Card>
            <Card>
              <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
                <Txt weight="bold" style={{ fontSize: 12 }}>Détection d'anomalies IA</Txt>
                <Row style={{ gap: 5 }}><View style={styles.liveDot} /><Txt weight="bold" style={{ color: c.formalio700, fontSize: 10 }}>Live</Txt></Row>
              </Row>
              {anomalyRows.map((item) => (
                <Row key={item.label} style={styles.anomalyRow}>
                  <View style={[styles.tinyDot, { backgroundColor: item.tone }]} />
                  <View style={{ flex: 1 }}><Txt weight="bold" style={{ fontSize: 11 }}>{item.label}</Txt><Txt style={{ color: c.surface500, fontSize: 10 }}>{item.desc}</Txt></View>
                  {item.tone !== c.formalio500 ? <Pill>Vérifier</Pill> : null}
                </Row>
              ))}
            </Card>
          </>
        ) : null}
        {accTab === 'ai' ? (
          <>
            <LinearGradient colors={[c.info600, c.formalio700, c.formalio900]} style={styles.aiAccountantHero}>
              <Row style={{ gap: 8, marginBottom: 8 }}><View style={styles.glassIconSmall}><Icon icon={BrainCircuit} size={20} color={c.white} /></View><View><Txt weight="semibold" style={{ color: 'rgba(255,255,255,.82)', fontSize: 12 }}>Mosika AI Accountant</Txt><Txt weight="black" style={{ color: c.white, fontSize: 14 }}>Analyste financier IA</Txt></View></Row>
              <Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 11, lineHeight: 16 }}>IA accountant complète : analyse, détection d'anomalies, prédictions, recommandations.</Txt>
              <PrimaryButton label={aiThinking ? 'Mosika analyse...' : 'Lancer une analyse IA complète'} tone="white" icon={aiThinking ? RefreshCw : Sparkles} disabled={aiThinking} onPress={runAIAnalysis} style={{ marginTop: 12, borderRadius: 12, minHeight: 42 }} />
            </LinearGradient>
            {aiThinking ? <ThinkingCard /> : null}
            {aiAnalysis && !aiThinking ? (
              <Card style={{ borderColor: c.formalio200 }}>
                <Row style={{ gap: 6, marginBottom: 8 }}><Icon icon={Sparkles} size={16} color={c.formalio700} /><Txt weight="bold" style={{ color: c.formalio800, fontSize: 12 }}>Résultats de l'analyse</Txt></Row>
                <Txt style={{ color: c.surface700, fontSize: 11, lineHeight: 17 }}>{aiAnalysis}</Txt>
                <PrimaryButton label="Télécharger en PDF" icon={Download} onPress={() => generateAIReport("Rapport d'analyse IA")} style={{ marginTop: 12, minHeight: 38, borderRadius: 12 }} />
              </Card>
            ) : null}
            <Grid columns={2} gap={8}>
              {[
                { icon: TrendingUp, t: 'Tendance revenus', d: hasAccountingData ? `${metrics.growthRate.toFixed(1)}% observé` : 'en attente', tone: 'green' },
                { icon: AlertTriangle, t: 'Détection anomalies', d: `${anomalyRows.filter((item) => item.tone !== c.formalio500 && item.tone !== c.surface400).length} alerte(s)`, tone: 'amber' },
                { icon: Sparkles, t: 'Recommandations IA', d: `${optimizationSuggestions.length} action(s)`, tone: 'blue' },
                { icon: Calculator, t: 'Transactions classées', d: `${metrics.transactionCount} transaction(s)`, tone: 'green' },
              ].map((item) => <CapabilityCard key={item.t} {...item} />)}
            </Grid>
            <View style={styles.optimizationBox}>
              <Row style={{ gap: 5, marginBottom: 8 }}><Icon icon={Zap} size={15} color={c.gold600} /><Txt weight="bold" style={{ color: c.gold700, fontSize: 12 }}>Suggestions d'optimisation</Txt></Row>
              {optimizationSuggestions.map((txt) => <Row key={txt} style={{ gap: 8, marginTop: 5, alignItems: 'flex-start' }}><Icon icon={Check} size={12} color={c.gold700} /><Txt style={{ color: c.gold700, fontSize: 11, lineHeight: 16, flex: 1 }}>{txt}</Txt></Row>)}
            </View>
          </>
        ) : null}
        {accTab === 'reports' ? (
          <>
            <LinearGradient colors={[c.formalio800, c.formalio950]} style={styles.reportHero}>
              <Row style={{ gap: 7, marginBottom: 7 }}><Icon icon={FileText} size={16} color={c.formalio300} /><Txt weight="semibold" style={{ color: c.formalio200, fontSize: 12 }}>Documents générés par IA</Txt></Row>
              <Txt weight="black" style={{ color: c.white, fontSize: 18 }}>Rapports professionnels</Txt>
              <Txt style={{ color: c.formalio300, fontSize: 11, lineHeight: 16, marginTop: 5 }}>Génération automatique avec calculs concrets, explications IA et export PDF/Excel structuré.</Txt>
            </LinearGradient>
            <ReportPortfolioSummary metrics={metrics} />
            <Txt weight="bold" style={{ fontSize: 13, marginBottom: 2 }}>Exports disponibles</Txt>
            <View style={{ gap: 8 }}>
              {[
                { t: 'Compte de Résultat', d: 'P&L mensuel détaillé', icon: Calculator, tone: 'green' },
                { t: 'Bilan Financier', d: 'Actif / passif SYSCOHADA', icon: FileSpreadsheet, tone: 'green' },
                { t: 'Tableau Flux de Trésorerie', d: 'Cash flow opérationnel', icon: Wallet, tone: 'green' },
                { t: 'Estimation Fiscale TVA', d: `${(taxEstimate / 1000).toFixed(0)}K FCFA à déclarer`, icon: Receipt, tone: 'amber' },
                { t: 'Rapport Performance Business', d: 'KPIs + insights IA', icon: BarChart3, tone: 'blue' },
                { t: 'Rapport Éligibilité Prêt', d: 'Score Mosika + analyse', icon: Award, tone: 'green' },
                { t: 'Résumé Comptable Mensuel', d: 'Synthèse complète IA', icon: BrainCircuit, tone: 'blue' },
                { t: 'Santé Financière SME', d: 'Diagnostic Mosika AI', icon: Sparkles, tone: 'green' },
              ].map((r) => (
                <Tap key={r.t} onPress={() => generateAIReport(r.t)} disabled={generatingReport === r.t} style={styles.aiReportRow}>
                  <ToneIcon icon={r.icon} tone={r.tone as any} spinning={generatingReport === r.t} />
                  <View style={{ flex: 1 }}><Txt weight="bold" style={{ fontSize: 12 }}>{r.t}</Txt><Txt numberOfLines={1} style={{ color: c.surface500, fontSize: 10 }}>{r.d}</Txt></View>
                  <Row style={{ gap: 3 }}><Icon icon={Sparkles} size={12} color={c.formalio700} /><Txt weight="bold" style={{ color: c.formalio700, fontSize: 9 }}>IA</Txt></Row>
                </Tap>
              ))}
            </View>
            <View style={styles.infoCallout}><Icon icon={BrainCircuit} size={16} color={c.info600} /><Txt style={{ color: c.info700, fontSize: 11, lineHeight: 16, flex: 1 }}>L'IA génère des documents structurés conformes OHADA/SYSCOHADA avec calculs vérifiés, prêts pour comptable ou banque.</Txt></View>
          </>
        ) : null}
      </View>
    </ScreenWrapper>
  );
}

function PeriodPicker({ period, setPeriod }: { period: 'daily' | 'weekly' | 'monthly' | 'annual'; setPeriod: (p: 'daily' | 'weekly' | 'monthly' | 'annual') => void }) {
  return <Segment value={period} onChange={setPeriod} options={[{ key: 'daily', label: 'Jour' }, { key: 'weekly', label: 'Sem.' }, { key: 'monthly', label: 'Mois' }, { key: 'annual', label: 'Année' }]} style={{ marginBottom: 10 }} />;
}

function AccKpi({ label, value, sub, icon, tone = 'green', delta }: { label: string; value: string; sub?: string; icon: LucideIcon; tone?: 'green' | 'amber' | 'red'; delta?: number }) {
  const palette = tone === 'red' ? [c.danger50, c.danger600] : tone === 'amber' ? [c.gold50, c.gold600] : [c.formalio50, c.formalio700];
  return (
    <Card style={{ padding: 12 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
        <View style={[styles.metricIcon, { backgroundColor: palette[0] }]}><Icon icon={icon} size={16} color={palette[1]} /></View>
        {delta !== undefined ? <Txt weight="bold" style={{ color: delta >= 0 ? c.formalio600 : c.danger600, fontSize: 10 }}>{delta >= 0 ? 'â†—' : '↘'} {Math.abs(delta)}%</Txt> : null}
      </Row>
      <Txt style={{ color: c.surface500, fontSize: 10 }}>{label}</Txt>
      <Txt weight="black" style={{ fontSize: 16 }}>{value}</Txt>
      {sub ? <Txt style={{ color: c.surface400, fontSize: 9 }}>{sub}</Txt> : null}
    </Card>
  );
}

function LegendRow({ name, value, color }: { name: string; value: number; color: string }) {
  return (
    <Row style={{ gap: 8, marginTop: 6 }}>
      <View style={[styles.tinyDot, { backgroundColor: color }]} />
      <Txt style={{ color: c.surface600, flex: 1, fontSize: 11 }}>{name}</Txt>
      <Txt weight="black" style={{ fontSize: 11 }}>{value}%</Txt>
    </Row>
  );
}

async function saveReportExportFile(file: CloudReportExport) {
  if (Platform.OS === 'web') {
    const web = globalThis as typeof globalThis & {
      document?: Document;
      URL?: typeof URL;
      atob?: (value: string) => string;
    };
    if (!web.document || !web.URL) throw new Error('Browser download is unavailable.');
    const payload = file.encoding === 'base64'
      ? Uint8Array.from((web.atob?.(file.content) ?? '').split(''), (char) => char.charCodeAt(0))
      : file.content;
    const blob = new Blob([payload], { type: file.mimeType });
    const url = web.URL.createObjectURL(blob);
    const link = web.document.createElement('a');
    link.href = url;
    link.download = file.fileName;
    link.rel = 'noopener';
    web.document.body.appendChild(link);
    link.click();
    link.remove();
    setTimeout(() => web.URL?.revokeObjectURL(url), 1200);
    return { uri: file.fileName, name: file.fileName };
  }

  const fileUri = `${FileSystem.documentDirectory}${file.fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, file.content, {
    encoding: file.encoding === 'base64' ? FileSystem.EncodingType.Base64 : FileSystem.EncodingType.UTF8,
  });
  if (await Sharing.isAvailableAsync()) {
    await Sharing.shareAsync(fileUri, { mimeType: file.mimeType, dialogTitle: file.title });
  }
  return { uri: fileUri, name: file.fileName };
}


function DownloadModal({
  isOpen,
  onClose,
  reportTitle,
  reportPeriod,
  reportType,
  periodStart,
  periodEnd,
  companyId,
}: {
  isOpen: boolean;
  onClose: () => void;
  reportTitle: string;
  reportPeriod: string;
  reportType: BackendReportType;
  periodStart: string;
  periodEnd: string;
  companyId: string | null;
}) {
  type Phase = 'preview' | 'preparing' | 'downloading' | 'complete';
  const { showToast } = useToast();
  const [phase, setPhase] = useState<Phase>('preview');
  const [format, setFormat] = useState<'pdf' | 'xlsx' | 'csv'>('pdf');
  const [progress, setProgress] = useState(0);
  const [savedFile, setSavedFile] = useState<{ uri: string; name: string } | null>(null);
  useEffect(() => {
    if (!isOpen) {
      setPhase('preview');
      setProgress(0);
      setSavedFile(null);
    }
  }, [isOpen]);
  const startDownload = async (fmt: 'pdf' | 'xlsx' | 'csv') => {
    if (!companyId) {
      showToast({ type: 'error', title: 'Cloud requis', message: 'Reconnectez-vous pour générer un rapport réel.' });
      return;
    }
    setFormat(fmt);
    setProgress(12);
    setPhase('preparing');
    try {
      const generated = await formalioBackend.generateReport(companyId, reportType, periodStart, periodEnd, fmt);
      if (!generated?.export) throw new Error('Rapport indisponible.');
      setPhase('downloading');
      setProgress(72);
      const saved = await saveReportExportFile(generated.export);
      setSavedFile(saved);
      setProgress(100);
      setPhase('complete');
    } catch (error) {
      setPhase('preview');
      const message = error instanceof Error ? error.message : 'Ajoutez des transactions avant de générer le rapport.';
      showToast({ type: 'error', title: 'Export impossible', message });
    }
  };
  return (
    <ModalShell visible={isOpen} onClose={onClose}>
      <View style={{ maxHeight: '86%' }}>
        <LinearGradient colors={[c.formalio800, c.formalio900]} style={styles.downloadHeader}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 12 }}><View style={styles.glassIconSmall}><Icon icon={FileText} size={20} color={c.white} /></View><View><Txt weight="bold" style={{ color: c.white, fontSize: 15 }}>{reportTitle}</Txt><Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 12 }}>{reportPeriod} · SYSCOHADA</Txt></View></Row>
            <Tap onPress={onClose} style={styles.closeButton}><Icon icon={X} size={17} color={c.white} /></Tap>
          </Row>
        </LinearGradient>
        <ScrollView contentContainerStyle={{ padding: 20 }}>
          {phase === 'preview' ? (
            <>
              <View style={styles.docPreview}>
                <View style={styles.docPaper}>
                  <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}><View><Txt style={{ color: c.surface400, fontSize: 11 }}>FORMALIO</Txt><Txt weight="bold" style={{ fontSize: 13 }}>{reportTitle}</Txt></View><LogoMark size={32} /></Row>
                  {Array.from({ length: 6 }).map((_, i) => <Row key={i} style={{ justifyContent: 'space-between', marginTop: 6 }}><View style={[styles.skeleton, { width: '52%' }]} /><View style={[styles.skeleton, { width: 64, backgroundColor: c.surface300 }]} /></Row>)}
                  <View style={{ height: 1, backgroundColor: c.surface300, marginVertical: 10 }} />
                  <Row style={{ justifyContent: 'space-between' }}><View style={[styles.skeleton, { width: '34%', height: 10, backgroundColor: c.formalio300 }]} /><View style={[styles.skeleton, { width: 80, height: 10, backgroundColor: c.formalio500 }]} /></Row>
                </View>
                <Txt style={{ color: c.surface400, textAlign: 'center', fontSize: 10, marginTop: 8 }}>Aperçu · Page 1 sur 4</Txt>
              </View>
              <Txt weight="semibold" style={{ fontSize: 14, marginBottom: 12 }}>Choisir le format</Txt>
              <Grid columns={2} gap={12}>
                <Tap onPress={() => void startDownload('pdf')} style={styles.formatButton}><View style={[styles.formatIcon, { backgroundColor: c.danger50 }]}><Icon icon={FileText} size={26} color={c.danger600} /></View><Txt weight="semibold" style={{ fontSize: 14 }}>PDF</Txt><Txt style={{ color: c.surface500, fontSize: 10, marginTop: 4 }}>Audit imprimable</Txt></Tap>
                <Tap onPress={() => void startDownload('xlsx')} style={styles.formatButton}><View style={[styles.formatIcon, { backgroundColor: c.formalio50 }]}><Icon icon={FileSpreadsheet} size={26} color={c.formalio600} /></View><Txt weight="semibold" style={{ fontSize: 14 }}>Excel</Txt><Txt style={{ color: c.surface500, fontSize: 10, marginTop: 4 }}>XLSX structuré</Txt></Tap>
              </Grid>
              <Tap onPress={() => void startDownload('csv')} style={[styles.secondaryAction, { marginTop: 10, flexDirection: 'row', gap: 8 }]}>
                <Icon icon={FileSpreadsheet} size={16} color={c.surface600} />
                <Txt weight="medium" style={{ color: c.surface600, fontSize: 11 }}>Exporter en CSV</Txt>
              </Tap>
              <Grid columns={3} gap={8}>
                {[{ icon: Eye, label: 'Aperçu' }, { icon: Share2, label: 'Partager' }, { icon: Mail, label: 'Email' }].map((action) => <Tap key={action.label} style={styles.secondaryAction}><Icon icon={action.icon} size={16} color={c.surface600} /><Txt weight="medium" style={{ color: c.surface600, fontSize: 10 }}>{action.label}</Txt></Tap>)}
              </Grid>
            </>
          ) : null}
          {phase === 'preparing' || phase === 'downloading' ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <AnimatedMascot state="loading" size={100} />
              <Txt weight="semibold" style={{ fontSize: 18, marginTop: 16 }}>{phase === 'preparing' ? 'Préparation du fichier...' : 'Téléchargement...'}</Txt>
              <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 4 }}>{format === 'pdf' ? 'PDF en cours de génération' : format === 'xlsx' ? 'Excel en cours de génération' : 'CSV en cours de génération'}</Txt>
              <View style={styles.downloadProgress}>
                <Row style={{ gap: 12, marginBottom: 12 }}>
                  <View style={[styles.transactionIcon, { backgroundColor: format === 'pdf' ? c.danger100 : c.formalio100 }]}><Icon icon={format === 'pdf' ? FileText : FileSpreadsheet} size={20} color={format === 'pdf' ? c.danger600 : c.formalio600} /></View>
                  <View style={{ flex: 1 }}><Txt weight="medium" numberOfLines={1} style={{ fontSize: 13 }}>{reportTitle.toLowerCase().replace(/\s+/g, '-')}.{format}</Txt><Txt style={{ color: c.surface500, fontSize: 12 }}>{phase === 'preparing' ? 'Calculs comptables...' : `${Math.round(progress)}%`}</Txt></View>
                </Row>
                <ValueBar value={progress} color={format === 'pdf' ? c.danger500 : c.formalio500} />
              </View>
            </View>
          ) : null}
          {phase === 'complete' ? (
            <View style={{ alignItems: 'center', paddingVertical: 22 }}>
              <AnimatedMascot state="celebrate" size={120} />
              <Txt weight="bold" style={{ fontSize: 20, marginTop: 16 }}>Téléchargé avec succès !</Txt>
              <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 4, marginBottom: 22 }}>Votre rapport est prêt à être consulté</Txt>
              <View style={styles.completeFile}><View style={[styles.transactionIcon, { backgroundColor: c.formalio100 }]}><Icon icon={Check} size={20} color={c.formalio700} /></View><View style={{ flex: 1 }}><Txt weight="medium" numberOfLines={1} style={{ fontSize: 13 }}>{savedFile?.name ?? `${reportTitle}.${format}`}</Txt><Txt style={{ color: c.formalio600, fontSize: 12 }}>Fichier réel généré depuis vos données</Txt></View></View>
              <Row style={{ gap: 8, width: '100%' }}><PrimaryButton label="Nouveau format" tone="surface" onPress={() => setPhase('preview')} style={{ flex: 1, minHeight: 42 }} /><PrimaryButton label="Terminé" icon={Check} onPress={onClose} style={{ flex: 1, minHeight: 42 }} /></Row>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </ModalShell>
  );
}


function ConfettiBurst({ trigger }: { trigger: boolean }) {
  if (!trigger) return null;
  const colors = [c.formalio500, c.gold500, c.info500, c.danger500];
  return (
    <View pointerEvents="none" style={styles.confettiLayer}>
      {Array.from({ length: 28 }).map((_, i) => (
        <Animated.View
          key={i}
          entering={FadeIn.delay(i * 25).duration(180)}
          exiting={FadeOut.duration(400)}
          style={{
            position: 'absolute',
            width: 8,
            height: 14,
            borderRadius: 3,
            backgroundColor: colors[i % colors.length],
            left: `${(i * 37) % 100}%`,
            top: `${8 + ((i * 13) % 30)}%`,
            transform: [{ rotate: `${(i * 17) % 90}deg` }],
          }}
        />
      ))}
    </View>
  );
}
