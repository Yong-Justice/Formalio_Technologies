import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  AppState,
  ActivityIndicator,
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
import { MobileMoneyIcon, getMobileMoneyProvider } from '@/components/momo/MobileMoneyIcon';
import { formalioBackend, type CloudFinancialMetrics, type CloudReportExport, type CloudSubscription } from '@/services/api/formalioBackend';
import { getStockItemValue, getStockUnitEstimate, getTotalStockValue, useStockStore, type StockItem, type StockPriceType } from '@/store/stockStore';
import { useNetworkStore } from '@/services/sync/network';
import { localizeRuntimeText, translate, type SupportedLanguage } from '@/i18n';

const c = {
  formalio50: '#ecfdf5',
  formalio100: '#d1fae5',
  formalio200: '#a7f3d0',
  formalio300: '#6ee7b7',
  formalio400: '#34d399',
  formalio500: '#10b981',
  formalio600: '#059669',
  formalio700: '#047857',
  formalio800: '#0f4f4a',
  formalio900: '#0a3d3a',
  formalio950: '#052320',
  gold50: '#fffbeb',
  gold100: '#fef3c7',
  gold200: '#fde68a',
  gold400: '#fbbf24',
  gold500: '#f59e0b',
  gold600: '#d97706',
  gold700: '#b45309',
  danger50: '#fef2f2',
  danger100: '#fee2e2',
  danger200: '#fecaca',
  danger500: '#ef4444',
  danger600: '#dc2626',
  danger700: '#b91c1c',
  info50: '#eff6ff',
  info100: '#dbeafe',
  info200: '#bfdbfe',
  info500: '#3b82f6',
  info600: '#2563eb',
  info700: '#1d4ed8',
  surface0: '#ffffff',
  surface50: '#f8fafc',
  surface100: '#f1f5f9',
  surface200: '#e2e8f0',
  surface300: '#cbd5e1',
  surface400: '#94a3b8',
  surface500: '#64748b',
  surface600: '#475569',
  surface700: '#334155',
  surface800: '#1e293b',
  surface900: '#0f172a',
  surface950: '#020617',
  white: '#ffffff',
  amber50: '#fffbeb',
  amber100: '#fef3c7',
  amber200: '#fde68a',
  amber500: '#f59e0b',
  amber600: '#d97706',
  amber700: '#b45309',
  orange400: '#fb923c',
  orange500: '#f97316',
  purple500: '#a855f7',
};

const font = {
  light: 'Inter_300Light',
  regular: 'Inter_400Regular',
  medium: 'Inter_500Medium',
  semibold: 'Inter_600SemiBold',
  bold: 'Inter_700Bold',
  extraBold: 'Inter_800ExtraBold',
  black: 'Inter_900Black',
};

type Screen =
  | 'auth'
  | 'business-setup'
  | 'dashboard'
  | 'transactions'
  | 'add-transaction'
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

type BusinessProfile = {
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

type KycStatus = 'pending' | 'under-review' | 'approved' | 'rejected';
type EmailVerificationStatus = 'unverified' | 'sent' | 'queued' | 'deferred' | 'verified';

type KycDraft = {
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

const defaultBusinessProfile: BusinessProfile = {
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

const emptyFinancialMetrics: CloudFinancialMetrics = {
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
  minimumDataRequired: ['Ajoutez des transactions réelles', 'Complétez la vérification du profil'],
  dailyCashflow: [],
  categoryBreakdown: [],
  scoreFactors: {},
  emptyState: true,
};

const defaultSubscription: CloudSubscription = {
  tier: 'free',
  status: 'trialing',
  seats: 1,
};

const mascotImages: Record<MascotState, number> = {
  idle: require('../../../assets/prototype/mascot-onboarding.png'),
  wave: require('../../../assets/prototype/mascot-onboarding.png'),
  thinking: require('../../../assets/prototype/mascot-thinking.png'),
  celebrate: require('../../../assets/prototype/mascot-celebrate.png'),
  secure: require('../../../assets/prototype/mascot-secure.png'),
  listening: require('../../../assets/prototype/mascot-hero.png'),
  sleeping: require('../../../assets/prototype/mascot-onboarding.png'),
  loading: require('../../../assets/prototype/mascot-thinking.png'),
  success: require('../../../assets/prototype/mascot-celebrate.png'),
  error: require('../../../assets/prototype/mascot-secure.png'),
  pointing: require('../../../assets/prototype/mascot-hero.png'),
};

const officialLogo = require('../../../assets/images/official-logo.png');

const isAndroidNative = Platform.OS === 'android';
const defaultTextMaxScale = isAndroidNative ? 1 : 1.08;
const inputTextMaxScale = isAndroidNative ? 1 : 1.05;

let currentAppLanguage: SupportedLanguage = 'fr';
const AppLanguageContext = createContext<SupportedLanguage | null>(null);

function useAppLanguage() {
  return useContext(AppLanguageContext) ?? currentAppLanguage;
}

function Txt({
  children,
  style,
  weight = 'regular',
  numberOfLines,
  maxScale,
  adjustsFontSizeToFit,
  minimumFontScale,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  weight?: keyof typeof font;
  numberOfLines?: number;
  maxScale?: number;
  adjustsFontSizeToFit?: boolean;
  minimumFontScale?: number;
}) {
  const language = useAppLanguage();
  const localizedChildren = React.Children.map(children, (child) => (
    typeof child === 'string' || typeof child === 'number'
      ? localizeRuntimeText(language, String(child))
      : child
  ));

  return (
    <Text
      maxFontSizeMultiplier={maxScale ?? defaultTextMaxScale}
      numberOfLines={numberOfLines}
      adjustsFontSizeToFit={adjustsFontSizeToFit}
      minimumFontScale={minimumFontScale}
      style={[{ fontFamily: font[weight], color: c.surface900, includeFontPadding: !isAndroidNative }, style]}
    >
      {localizedChildren}
    </Text>
  );
}

function Tap({
  children,
  onPress,
  style,
  disabled,
  accessibilityLabel,
}: {
  children: React.ReactNode;
  onPress?: () => void;
  style?: StyleProp<ViewStyle>;
  disabled?: boolean;
  accessibilityLabel?: string;
}) {
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={accessibilityLabel}
      disabled={disabled}
      onPress={onPress}
      accessibilityState={{ disabled: Boolean(disabled) }}
      style={({ pressed }) => [
        StyleSheet.flatten(style),
        disabled && { opacity: 0.72 },
        pressed && !disabled && { opacity: 0.88, transform: [{ scale: 0.98 }] },
      ]}
    >
      {children}
    </Pressable>
  );
}

function Icon({ icon: IconComponent, size = 18, color = c.surface600, strokeWidth = 2.2 }: { icon: LucideIcon; size?: number; color?: string; strokeWidth?: number }) {
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}

function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

function Grid({ children, columns = 2, gap = 8 }: { children: React.ReactNode; columns?: number; gap?: number }) {
  const cells = React.Children.toArray(children);
  return (
    <View style={{ flexDirection: 'row', flexWrap: 'wrap', marginHorizontal: -gap / 2, marginVertical: -gap / 2 }}>
      {cells.map((child, index) => {
        const key = React.isValidElement(child) && child.key != null ? child.key : index;
        return (
          <View key={key} style={{ width: `${100 / columns}%`, padding: gap / 2 }}>
            {child}
          </View>
        );
      })}
    </View>
  );
}

function Pill({ children, tone = 'green', style }: { children: React.ReactNode; tone?: 'green' | 'gold' | 'blue' | 'red' | 'surface'; style?: StyleProp<ViewStyle> }) {
  const palette = {
    green: [c.formalio50, c.formalio700],
    gold: [c.gold50, c.gold700],
    blue: [c.info50, c.info700],
    red: [c.danger50, c.danger600],
    surface: [c.surface100, c.surface600],
  }[tone];
  return (
    <View style={[styles.pill, { backgroundColor: palette[0] }, style]}>
      {typeof children === 'string' || typeof children === 'number' ? (
        <Txt weight="bold" style={{ color: palette[1], fontSize: 10 }}>
          {children}
        </Txt>
      ) : (
        children
      )}
    </View>
  );
}

function PrimaryButton({
  label,
  onPress,
  icon,
  tone = 'green',
  disabled,
  style,
}: {
  label: string;
  onPress?: () => void;
  icon?: LucideIcon;
  tone?: 'green' | 'white' | 'danger' | 'surface' | 'outline';
  disabled?: boolean;
  style?: StyleProp<ViewStyle>;
}) {
  const colors = {
    green: { bg: c.formalio700, text: c.white, border: c.formalio700 },
    white: { bg: c.white, text: c.formalio800, border: c.white },
    danger: { bg: c.danger500, text: c.white, border: c.danger500 },
    surface: { bg: c.surface100, text: c.surface700, border: c.surface100 },
    outline: { bg: c.white, text: c.surface700, border: c.surface200 },
  }[tone];
  const effectiveColors = disabled
    ? { bg: c.surface200, text: c.surface700, border: c.surface300 }
    : colors;
  const flattenedStyle = StyleSheet.flatten(style) as ViewStyle | undefined;
  const radius = typeof flattenedStyle?.borderRadius === 'number' ? flattenedStyle.borderRadius : 18;
  return (
    <Tap disabled={disabled} onPress={onPress} style={[styles.primaryButton, { backgroundColor: effectiveColors.bg, borderColor: effectiveColors.border }, disabled && styles.primaryButtonDisabled, style]}>
      <View pointerEvents="none" style={[styles.primaryButtonFill, { borderRadius: radius, backgroundColor: effectiveColors.bg, borderColor: effectiveColors.border }, disabled && styles.primaryButtonFillDisabled]} />
      <Row style={styles.primaryButtonContent}>
        {icon ? <Icon icon={icon} size={17} color={effectiveColors.text} /> : null}
        <Txt weight="bold" numberOfLines={1} style={{ color: effectiveColors.text, fontSize: 14, flexShrink: 1, textAlign: 'center' }}>
          {label}
        </Txt>
      </Row>
    </Tap>
  );
}

function LogoMark({ size = 48, light = false }: { size?: number; light?: boolean }) {
  return (
    <View
      style={{
        width: size,
        height: size,
        borderRadius: size * 0.24,
        overflow: 'hidden',
        backgroundColor: light ? 'rgba(255,255,255,.06)' : c.formalio950,
      }}
    >
      <Image
        source={officialLogo}
        resizeMode="contain"
        accessibilityLabel="Formalio official logo"
        style={{ width: '100%', height: '100%' }}
      />
    </View>
  );
}

function Logo({ size = 40, light = false }: { size?: number; light?: boolean }) {
  return (
    <Row style={{ gap: 10 }}>
      <LogoMark size={size} light={light} />
      <View>
        <Txt weight="bold" style={{ fontSize: Math.max(16, size * 0.52), color: light ? c.white : c.formalio900, lineHeight: Math.max(18, size * 0.58) }}>
          Formalio
        </Txt>
        {size >= 34 ? (
          <Txt weight="semibold" style={{ fontSize: Math.max(7, size * 0.18), color: light ? 'rgba(255,255,255,.62)' : c.formalio600, letterSpacing: 0 }}>
            BUSINESS · COMPLIANT · GROWING
          </Txt>
        ) : null}
      </View>
    </Row>
  );
}

function AnimatedMascot({ state = 'idle', size = 120, showBubble, message }: { state?: MascotState; size?: number; showBubble?: boolean; message?: string }) {
  const float = useSharedValue(0);
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    float.value = 0;
    scale.value = 1;
    rotate.value = 0;

    if (['idle', 'wave', 'sleeping', 'loading', 'pointing'].includes(state)) {
      float.value = withRepeat(withSequence(withTiming(state === 'sleeping' ? 2 : -5, { duration: state === 'wave' ? 1250 : 1800, easing: Easing.inOut(Easing.ease) }), withTiming(0, { duration: state === 'wave' ? 1250 : 1800, easing: Easing.inOut(Easing.ease) })), -1, false);
    }
    if (state === 'thinking') {
      rotate.value = withRepeat(withSequence(withTiming(2, { duration: 900 }), withTiming(-2, { duration: 900 }), withTiming(0, { duration: 900 })), -1, false);
    }
    if (['celebrate', 'listening', 'secure'].includes(state)) {
      scale.value = withRepeat(withSequence(withTiming(state === 'celebrate' ? 1.06 : 1.035, { duration: state === 'celebrate' ? 600 : 700 }), withTiming(1, { duration: state === 'celebrate' ? 600 : 700 })), -1, false);
    }
    if (state === 'success') {
      scale.value = withSequence(withSpring(1.08), withSpring(1));
    }
    if (state === 'error') {
      rotate.value = withSequence(withTiming(-5, { duration: 80 }), withTiming(5, { duration: 80 }), withTiming(0, { duration: 80 }));
    }
  }, [state, float, rotate, scale]);

  const imageStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: float.value }, { scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={{ width: size, height: size, alignItems: 'center', justifyContent: 'center' }}>
      {state === 'listening' ? (
        <>
          <ListeningHalo size={size} delay={0} />
          <ListeningHalo size={size} delay={500} />
        </>
      ) : null}
      {state === 'loading' ? <LoadingHalo size={size} /> : null}
      {state === 'celebrate' ? <MascotSparkles size={size} /> : null}
      <Animated.Image source={mascotImages[state]} resizeMode="contain" style={[{ width: size, height: size }, imageStyle]} />
      {showBubble && message ? (
        <Animated.View entering={FadeIn.duration(180)} style={[styles.bubble, { left: size * 0.86, top: 10 }]}>
          <Txt weight="medium" style={{ fontSize: 12, color: c.surface700 }}>
            {message}
          </Txt>
        </Animated.View>
      ) : null}
    </View>
  );
}

function ListeningHalo({ size, delay }: { size: number; delay: number }) {
  const pulse = useSharedValue(0);
  useEffect(() => {
    pulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({
    opacity: 0.55 * (1 - pulse.value),
    transform: [{ scale: 1 + pulse.value * 0.5 }],
  }));
  useEffect(() => {
    const t = setTimeout(() => {
      pulse.value = withRepeat(withTiming(1, { duration: 1500, easing: Easing.out(Easing.ease) }), -1, false);
    }, delay);
    return () => clearTimeout(t);
  }, [delay, pulse]);
  return <Animated.View style={[styles.halo, { width: size * 0.9, height: size * 0.9, borderRadius: size, backgroundColor: 'rgba(52,211,153,.28)' }, style]} />;
}

function LoadingHalo({ size }: { size: number }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = withRepeat(withSequence(withTiming(1.18, { duration: 1000 }), withTiming(1, { duration: 1000 })), -1, false);
  }, [pulse]);
  const style = useAnimatedStyle(() => ({ transform: [{ scale: pulse.value }], opacity: 0.28 }));
  return <Animated.View style={[styles.halo, { width: size * 0.88, height: size * 0.88, borderRadius: size, backgroundColor: c.formalio400 }, style]} />;
}

function MascotSparkles({ size }: { size: number }) {
  const colors = [c.formalio500, c.gold500, c.info500];
  return (
    <View pointerEvents="none" style={[StyleSheet.absoluteFillObject, { overflow: 'hidden' }]}>
      {Array.from({ length: 6 }).map((_, i) => (
        <Animated.View
          key={i}
          entering={FadeIn.delay(i * 160).duration(500)}
          style={{
            position: 'absolute',
            width: 6,
            height: 6,
            borderRadius: 6,
            backgroundColor: colors[i % colors.length],
            left: size * (0.5 + Math.cos((i * Math.PI) / 3) * 0.28),
            top: size * (0.5 + Math.sin((i * Math.PI) / 3) * 0.28),
          }}
        />
      ))}
    </View>
  );
}

const ToastContext = createContext<{ showToast: (toast: Omit<Toast, 'id'>) => void } | null>(null);

function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

function ToastProvider({ children }: { children: React.ReactNode }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const insets = useSafeAreaInsets();

  const showToast = useCallback((toast: Omit<Toast, 'id'>) => {
    const id = Date.now() + Math.random();
    const next = { ...toast, id, duration: toast.duration ?? 3500 };
    setToasts((prev) => [...prev, next]);
    if (next.duration && next.duration > 0) {
      setTimeout(() => setToasts((prev) => prev.filter((t) => t.id !== id)), next.duration);
    }
  }, []);

  const removeToast = (id: number) => setToasts((prev) => prev.filter((t) => t.id !== id));

  return (
    <ToastContext.Provider value={{ showToast }}>
      {children}
      <View pointerEvents="box-none" style={[styles.toastHost, { top: insets.top + 10 }]}>
        {toasts.map((toast) => {
          const palette = toast.type === 'success' ? c.formalio800 : toast.type === 'error' ? c.danger600 : toast.type === 'loading' ? c.surface900 : c.info600;
          const ToastIcon = toast.type === 'success' ? CheckCircle2 : toast.type === 'error' ? AlertTriangle : toast.type === 'loading' ? RefreshCw : Lightbulb;
          return (
            <Animated.View key={toast.id} entering={SlideInDown.duration(220)} exiting={FadeOut.duration(160)} style={[styles.toast, { backgroundColor: palette }]}>
              <Icon icon={ToastIcon} size={19} color={c.white} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="semibold" style={{ color: c.white, fontSize: 13 }}>
                  {toast.title}
                </Txt>
                {toast.message ? <Txt style={{ color: 'rgba(255,255,255,.78)', fontSize: 11, marginTop: 2 }}>{toast.message}</Txt> : null}
              </View>
              <Tap onPress={() => removeToast(toast.id)} style={{ padding: 2 }}>
                <Icon icon={X} size={16} color="rgba(255,255,255,.72)" />
              </Tap>
            </Animated.View>
          );
        })}
      </View>
    </ToastContext.Provider>
  );
}

function ValueBar({ value, color = c.formalio500, track = c.surface100 }: { value: number; color?: string; track?: string }) {
  return (
    <View style={[styles.valueTrack, { backgroundColor: track }]}>
      <Animated.View entering={FadeIn.duration(500)} style={[styles.valueFill, { width: `${Math.max(4, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

function BarChart({ data, keys, colors, labels = true, height = 150 }: { data: any[]; keys: string[]; colors: string[]; labels?: boolean; height?: number }) {
  const { width: viewportWidth } = useWindowDimensions();
  const width = Math.max(260, Math.min(viewportWidth, 430) - 64);
  const chartHeight = height - 24;
  const max = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k] ?? 0))), 1);
  const slot = width / data.length;
  const barWidth = Math.min(14, slot / (keys.length + 1));
  const labelStride = Math.max(1, Math.ceil(data.length / 6));
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      {[0, 1, 2, 3].map((line) => (
        <Line key={line} x1="0" x2={width} y1={(chartHeight / 3) * line + 4} y2={(chartHeight / 3) * line + 4} stroke={c.surface100} strokeDasharray="4 4" />
      ))}
      {data.map((d, i) => (
        <G key={d.name ?? d.label ?? i}>
          {keys.map((key, keyIndex) => {
            const h = (Number(d[key] ?? 0) / max) * (chartHeight - 10);
            const x = i * slot + slot / 2 - (keys.length * barWidth) / 2 + keyIndex * (barWidth + 3);
            const y = chartHeight - h + 4;
            return <Rect key={key} x={x} y={y} width={barWidth} height={h} rx="5" fill={colors[keyIndex]} />;
          })}
          {labels && (data.length <= 7 || i % labelStride === 0 || i === data.length - 1) ? (
            <TextSvg x={i * slot + slot / 2} y={height - 4} textAnchor="middle" fill={c.surface400} fontSize="9">
              {String(d.name ?? d.label ?? '').slice(0, 6)}
            </TextSvg>
          ) : null}
        </G>
      ))}
    </Svg>
  );
}

function TextSvg(props: any) {
  const { children, ...rest } = props;
  return (
    <SvgText fontFamily={font.semibold} {...rest}>
      {children}
    </SvgText>
  );
}

function AreaChart({ data, keys, colors, height = 150 }: { data: any[]; keys: string[]; colors: string[]; height?: number }) {
  const { width: viewportWidth } = useWindowDimensions();
  const width = Math.max(260, Math.min(viewportWidth, 430) - 64);
  const chartHeight = height - 24;
  const max = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k] ?? 0))), 1);
  const labelStride = Math.max(1, Math.ceil(data.length / 6));
  const pointsFor = (key: string) =>
    data
      .map((d, i) => {
        const x = data.length === 1 ? width / 2 : (i / (data.length - 1)) * width;
        const y = chartHeight - (Number(d[key] ?? 0) / max) * (chartHeight - 12) + 4;
        return `${x},${y}`;
      })
      .join(' ');
  const fillFor = (key: string) => `0,${chartHeight + 4} ${pointsFor(key)} ${width},${chartHeight + 4}`;
  return (
    <Svg width="100%" height={height} viewBox={`0 0 ${width} ${height}`}>
      <Defs>
        {keys.map((key, i) => (
          <SvgLinearGradient key={key} id={`area-${key}`} x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0%" stopColor={colors[i]} stopOpacity="0.26" />
            <Stop offset="100%" stopColor={colors[i]} stopOpacity="0" />
          </SvgLinearGradient>
        ))}
      </Defs>
      {[0, 1, 2, 3].map((line) => (
        <Line key={line} x1="0" x2={width} y1={(chartHeight / 3) * line + 4} y2={(chartHeight / 3) * line + 4} stroke={c.surface100} strokeDasharray="4 4" />
      ))}
      {keys.map((key, i) => (
        <G key={key}>
          <Polygon points={fillFor(key)} fill={`url(#area-${key})`} />
          <Polyline points={pointsFor(key)} fill="none" stroke={colors[i]} strokeWidth={i === 0 ? 3 : 2.2} strokeLinecap="round" strokeLinejoin="round" />
        </G>
      ))}
      {data.map((d, i) =>
        data.length <= 7 || i % labelStride === 0 || i === data.length - 1 ? (
          <TextSvg key={d.name ?? d.label ?? i} x={data.length === 1 ? width / 2 : (i / (data.length - 1)) * width} y={height - 4} textAnchor="middle" fill={c.surface400} fontSize="9">
            {String(d.name ?? d.label ?? '').slice(0, 6)}
          </TextSvg>
        ) : null,
      )}
    </Svg>
  );
}

function DonutChart({ data, size = 128 }: { data: { name: string; value: number; color: string }[]; size?: number }) {
  const radius = size * 0.36;
  const circumference = 2 * Math.PI * radius;
  let offset = 0;
  return (
    <Svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
      <Circle cx={size / 2} cy={size / 2} r={radius} fill="none" stroke={c.surface100} strokeWidth={16} />
      {data.map((d) => {
        const dash = (d.value / 100) * circumference;
        const circle = (
          <Circle
            key={d.name}
            cx={size / 2}
            cy={size / 2}
            r={radius}
            fill="none"
            stroke={d.color}
            strokeWidth={16}
            strokeDasharray={`${dash} ${circumference - dash}`}
            strokeDashoffset={-offset}
            strokeLinecap="round"
            rotation="-90"
            origin={`${size / 2},${size / 2}`}
          />
        );
        offset += dash + 3;
        return circle;
      })}
      <TextSvg x={size / 2} y={size / 2 + 5} textAnchor="middle" fill={c.surface900} fontSize="18" fontFamily={font.black}>
        100%
      </TextSvg>
    </Svg>
  );
}

function getAndroidSegmentLabel(label: string, optionCount: number) {
  if (!isAndroidNative) return label;
  if (label === 'Add Stock') return 'Stock';
  if (label === 'Dépenses' && optionCount >= 5) return 'Dép.';
  return label;
}

function Segment<T extends string>({ value, options, onChange, style }: { value: T; options: { key: T; label: string; icon?: LucideIcon }[]; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
  const compact = options.length >= 4;
  const androidTight = isAndroidNative && options.length >= 3;
  return (
    <View style={[styles.segment, style]}>
      <View style={[styles.segmentTrack, styles.segmentTrackFill, androidTight && styles.segmentTrackAndroidTight, compact && !androidTight && styles.segmentTrackCompact]}>
      {options.map((option) => {
        const selected = value === option.key;
        const label = getAndroidSegmentLabel(option.label, options.length);
        if (androidTight) {
          return (
            <Pressable
              key={option.key}
              accessibilityRole="button"
              accessibilityState={{ selected }}
              onPress={() => onChange(option.key)}
              style={({ pressed }) => [
                styles.segmentAndroidCell,
                selected && styles.segmentAndroidCellSelected,
                pressed && { opacity: 0.88 },
              ]}
            >
              <Txt
                weight="bold"
                numberOfLines={1}
                adjustsFontSizeToFit
                minimumFontScale={0.66}
                style={[styles.segmentLabel, styles.segmentLabelAndroidTight, { color: selected ? c.formalio700 : c.surface500 }]}
              >
                {label}
              </Txt>
              {selected ? <Animated.View entering={FadeIn.duration(140)} style={styles.segmentAndroidGlow} /> : null}
            </Pressable>
          );
        }
        return (
          <Tap
            key={option.key}
            onPress={() => onChange(option.key)}
            style={styles.segmentTap}
          >
            <View style={[styles.segmentItem, compact && styles.segmentItemCompact, selected && styles.segmentSelected]}>
              {option.icon ? <Icon icon={option.icon} size={compact ? 13 : 14} color={selected ? c.formalio700 : c.surface500} /> : null}
              <Txt
                weight="bold"
                numberOfLines={1}
                style={[styles.segmentLabel, compact && styles.segmentLabelCompact, { color: selected ? c.formalio700 : c.surface500 }]}
              >
                {label}
              </Txt>
              {selected ? <Animated.View entering={FadeIn.duration(140)} style={styles.segmentGlow} /> : null}
            </View>
          </Tap>
        );
      })}
      </View>
    </View>
  );
}

function Field({
  label,
  value,
  onChangeText,
  placeholder,
  icon,
  secureTextEntry,
  keyboardType,
  right,
  large,
  multiline,
  error,
  editable = true,
}: {
  label?: string;
  value: string;
  onChangeText: (v: string) => void;
  placeholder?: string;
  icon?: LucideIcon;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  right?: React.ReactNode;
  large?: boolean;
  multiline?: boolean;
  error?: string;
  editable?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const language = useAppLanguage();
  return (
    <View>
      {label ? (
        <Txt weight="semibold" style={styles.fieldLabel}>
          {label}
        </Txt>
      ) : null}
      <Animated.View style={[styles.inputBox, focused && styles.inputBoxFocused, large && { paddingVertical: 15 }, multiline && { alignItems: 'flex-start' }, !editable && styles.calculatedInputBox, error && { borderColor: c.danger200, backgroundColor: c.danger50 }]}>
        {icon ? <Icon icon={icon} size={17} color={c.surface400} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          editable={editable}
          placeholder={placeholder ? localizeRuntimeText(language, placeholder) : undefined}
          placeholderTextColor={c.surface400}
          maxFontSizeMultiplier={inputTextMaxScale}
          selectionColor={c.formalio500}
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          multiline={multiline}
          textAlignVertical={multiline ? 'top' : undefined}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={[styles.textInput, large && { fontSize: 24, fontFamily: font.bold }, multiline && { minHeight: 76, paddingTop: 0 }]}
        />
        {right}
      </Animated.View>
      {error ? <Txt style={{ color: c.danger600, fontSize: 10, marginTop: 5 }}>{error}</Txt> : null}
    </View>
  );
}

function ModalShell({ visible, onClose, children, align = 'bottom' }: { visible: boolean; onClose: () => void; children: React.ReactNode; align?: 'bottom' | 'center' }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <Pressable style={StyleSheet.absoluteFill} onPress={onClose} />
        <Animated.View
          entering={align === 'bottom' ? SlideInDown.springify().damping(22).stiffness(180) : FadeIn.duration(180)}
          exiting={FadeOut.duration(160)}
          style={[styles.modalCard, align === 'center' && { alignSelf: 'center', marginTop: 80, marginBottom: 80 }]}
        >
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

function ScreenWrapper({
  title,
  children,
  showBack = true,
  noPadding = false,
  rightAction,
  floatingAction,
  showNav,
  activeTab,
  navigate,
  goBack,
  setActiveTab,
  offlineMode,
  setOfflineMode,
  notifications,
}: {
  title?: string;
  children: React.ReactNode;
  showBack?: boolean;
  noPadding?: boolean;
  rightAction?: React.ReactNode;
  floatingAction?: (scrollY: SharedValue<number>) => React.ReactNode;
  showNav: boolean;
  activeTab: string;
  navigate: (s: Screen) => void;
  goBack: () => void;
  setActiveTab: (tab: string) => void;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  notifications: typeof initialNotifications;
}) {
  const insets = useSafeAreaInsets();
  const { width } = useWindowDimensions();
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const bottomPadding = showNav ? (isAndroidNative ? 280 : 142) : Math.max(24, insets.bottom + 16);
  const wrapperMaxWidth = Math.min(width, 430);
  const navBottomOffset = Math.max(8, Math.min(18, insets.bottom || 10));
  const bottomTabs = [
    { key: 'home', label: 'Accueil', icon: Home, screen: 'dashboard' as Screen },
    { key: 'transactions', label: 'Activité', icon: Wallet, screen: 'transactions' as Screen },
    { key: 'add', label: '', icon: Plus, screen: 'add-transaction' as Screen },
    { key: 'reports', label: 'Rapports', icon: FileText, screen: 'reports' as Screen },
    { key: 'profile', label: 'Profil', icon: User, screen: 'profile' as Screen },
  ];
  return (
    <SafeAreaView style={styles.screenRoot} edges={['top']}>
      {title ? (
        <View style={styles.header}>
          {showBack ? (
            <Tap onPress={goBack} style={styles.headerBack}>
              <Icon icon={ArrowLeft} size={20} color={c.surface600} />
            </Tap>
          ) : null}
          <Txt weight="semibold" style={styles.headerTitle} numberOfLines={1}>
            {title}
          </Txt>
          {rightAction || showNav ? (
            <Row style={styles.headerActions}>
              {rightAction}
              {showNav ? <HeaderUtilityActions offlineMode={offlineMode} setOfflineMode={setOfflineMode} notifications={notifications} navigate={navigate} /> : null}
            </Row>
          ) : (
            <View style={{ width: showBack ? 40 : 0 }} />
          )}
        </View>
      ) : null}
      <Animated.View entering={SlideInRight.springify().damping(22).stiffness(180)} exiting={SlideOutLeft.duration(170)} style={{ flex: 1 }}>
        <Animated.ScrollView
          onScroll={scrollHandler}
          scrollEventThrottle={16}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
          contentContainerStyle={[noPadding ? { paddingBottom: bottomPadding } : { padding: 16, paddingBottom: bottomPadding }, { alignSelf: 'center', width: '100%', maxWidth: wrapperMaxWidth }]}
        >
          {children}
        </Animated.ScrollView>
      </Animated.View>
      {showNav ? (
        <Animated.View entering={SlideInDown.springify().damping(24).stiffness(180)} style={[styles.bottomNav, { bottom: navBottomOffset, paddingBottom: Math.max(8, Math.min(16, insets.bottom || 8)) }]}>
          {bottomTabs.map((tab) => {
            const selected = activeTab === tab.key;
            const isAdd = tab.key === 'add';
            return (
              <Tap
                key={tab.key}
                onPress={() => {
                  setActiveTab(tab.key);
                  navigate(tab.screen);
                }}
                style={[styles.bottomNavItem, selected && !isAdd && styles.bottomNavItemActive, isAdd && styles.bottomNavAddItem]}
              >
                {isAdd ? (
                  <View style={styles.addTab}>
                    <Icon icon={Plus} size={24} color={c.white} strokeWidth={2.6} />
                  </View>
                ) : (
                  <>
                    <Icon icon={tab.icon} size={20} color={selected ? c.formalio700 : c.surface400} />
                    <Txt weight="medium" numberOfLines={1} style={[styles.bottomNavLabel, { color: selected ? c.formalio700 : c.surface400 }]}>
                      {tab.label}
                    </Txt>
                  </>
                )}
              </Tap>
            );
          })}
        </Animated.View>
      ) : null}
      {floatingAction ? floatingAction(scrollY) : null}
    </SafeAreaView>
  );
}

function HeaderUtilityActions({
  offlineMode,
  setOfflineMode,
  notifications,
  navigate,
}: {
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  notifications: typeof initialNotifications;
  navigate: (s: Screen) => void;
}) {
  const { showToast } = useToast();
  const unread = notifications.some((n) => !n.read);
  const toggleMode = () => {
    const next = !offlineMode;
    setOfflineMode(next);
    showToast({
      type: 'info',
      title: next ? 'Mode hors ligne' : 'Mode en ligne',
      message: next ? 'Vous pouvez continuer à travailler.' : 'Vos données sont prêtes à se synchroniser.',
    });
  };
  return (
    <Row style={styles.headerUtilityActions}>
      <Tap
        onPress={toggleMode}
        accessibilityLabel={offlineMode ? 'Passer en mode en ligne' : 'Passer en mode hors ligne'}
        style={[styles.modeToggle, offlineMode && styles.modeToggleOffline]}
      >
        <Icon icon={offlineMode ? WifiOff : Wifi} size={14} color={offlineMode ? c.amber700 : c.formalio700} />
        <Txt weight="black" style={{ color: offlineMode ? c.amber700 : c.formalio700, fontSize: 10 }}>
          {offlineMode ? 'Offline' : 'Online'}
        </Txt>
      </Tap>
      <Tap onPress={() => navigate('notifications')} accessibilityLabel="Notifications" style={styles.iconButton}>
        <Icon icon={Bell} size={20} color={c.surface600} />
        {unread ? <View style={styles.notificationDot} /> : null}
      </Tap>
    </Row>
  );
}

function AuthFlows({
  onComplete,
  profile = defaultBusinessProfile,
  transactions = [],
  notifications = [],
  metrics = emptyFinancialMetrics,
}: {
  onComplete: (isNewUser: boolean) => void;
  profile?: BusinessProfile;
  transactions?: Transaction[];
  notifications?: typeof initialNotifications;
  metrics?: CloudFinancialMetrics;
}) {
  const { showToast } = useToast();
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
          {onboardingIndex < onboardingSlides.length - 1 ? (
            <PrimaryButton label="Continuer" onPress={() => setOnboardingIndex(onboardingIndex + 1)} style={styles.authPrimaryButton} />
          ) : (
            <>
              <PrimaryButton label="Créer un compte" onPress={() => navigate('signup')} style={styles.authPrimaryButton} />
              <PrimaryButton label="Se connecter" tone="outline" onPress={() => navigate('login')} style={styles.authSecondaryButton} />
            </>
          )}
          <Txt style={{ textAlign: 'center', color: c.surface400, fontSize: 11, lineHeight: 16 }}>
            En continuant, vous acceptez nos <Txt weight="medium" style={{ color: c.formalio700, fontSize: 11 }}>Conditions</Txt> et notre <Txt weight="medium" style={{ color: c.formalio700, fontSize: 11 }}>Confidentialité</Txt>
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
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  notifications: typeof initialNotifications;
};

function tabForScreen(screen: Screen) {
  if (screen === 'dashboard') return 'home';
  if (screen === 'transactions') return 'transactions';
  if (screen === 'add-transaction') return 'add';
  if (screen === 'reports' || screen === 'accounting' || screen === 'tax') return 'reports';
  if (['profile', 'settings', 'security', 'subscription', 'help', 'referral', 'offline', 'mobile-money'].includes(screen)) return 'profile';
  return undefined;
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
  const [screen, setScreen] = useState<Screen>('auth');
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('');
  const [showBalance, setShowBalance] = useState(true);
  const [offlineMode, setOfflineMode] = useState(false);
  const [activeTab, setActiveTab] = useState('home');
  const [profile, setProfile] = useState<BusinessProfile>(defaultBusinessProfile);
  const [pendingScan, setPendingScan] = useState<ScannedTicketData | null>(null);
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
  const cloudErrorToastShownRef = useRef(false);
  const cloudRetryCountRef = useRef(0);
  const hydrateStock = useStockStore((state) => state.hydrate);
  const replaceStockItems = useStockStore((state) => state.replaceItems);

  const showNav = !['auth', 'business-setup'].includes(screen);
  const navigate = useCallback((next: Screen) => {
    const nextTab = tabForScreen(next);
    if (nextTab) setActiveTab(nextTab);
    setScreen(next);
  }, []);
  const goBack = () => {
    const backMap: Record<Screen, Screen> = {
      auth: 'auth',
      'business-setup': 'auth',
      dashboard: 'dashboard',
      transactions: 'dashboard',
      'add-transaction': 'transactions',
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
    const nextTab = tabForScreen(next);
    if (nextTab) setActiveTab(nextTab);
    setScreen(next);
  };
  const shellProps = { showNav, activeTab, navigate, goBack, setActiveTab, offlineMode, setOfflineMode, notifications };
  const appLanguage = profile.language ?? 'fr';
  currentAppLanguage = appLanguage;
  const withLanguage = (children: React.ReactNode) => (
    <AppLanguageContext.Provider value={appLanguage}>
      {children}
    </AppLanguageContext.Provider>
  );

  useEffect(() => {
    hydrateStock();
  }, [hydrateStock]);

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
      setFinancialMetrics(data.metrics ?? emptyFinancialMetrics);
      setSubscription(data.subscription ?? defaultSubscription);
      setNotifications(data.notifications);
      setLoanRequests(data.loanRequests as LoanRequestRecord[]);
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
  }, [isOnline, replaceStockItems, showToast]);

  const applyTransactionSnapshot = useCallback((nextTransactions: Transaction[]) => {
    setTransactions(nextTransactions);
    setFinancialMetrics((current) => calculateLocalFinancialMetrics(nextTransactions, profile, current.reportCount, current.documentCount));
    if (cloudCompanyId) {
      void formalioBackend.getFinancialMetrics(cloudCompanyId)
        .then(setFinancialMetrics)
        .catch((error) => {
          showToast({ type: 'error', title: 'Indicateurs cloud', message: error instanceof Error ? error.message : 'Les calculs seront rafraîchis plus tard.' });
        });
    }
  }, [cloudCompanyId, profile, showToast]);

  useEffect(() => {
    let active = true;
    if (!formalioBackend.isConfigured) return () => {
      active = false;
    };
    (async () => {
      const loaded = await hydrateCloudData(false);
      if (active && loaded) setScreen('dashboard');
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
        setCloudCompanyId(null);
        setTransactions([]);
        setNotifications([]);
        setLoanRequests([]);
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
    setFinancialMetrics((current) => calculateLocalFinancialMetrics(transactions, profile, current.reportCount, current.documentCount));
  }, [cloudCompanyId, profile, transactions]);

  const handleVoiceTransaction = async (parsed: ParsedTransaction) => {
    const fallbackTransaction: Transaction = {
      id: transactions.length + 1,
      date: new Date().toISOString().split('T')[0],
      description: parsed.description,
      category: parsed.category,
      type: parsed.type,
      amount: parsed.amount,
      method: parsed.method,
      status: 'completed',
    };
    const cloudTransaction = cloudCompanyId
      ? await formalioBackend.createTransaction(cloudCompanyId, {
          description: parsed.description,
          category: parsed.category,
          type: parsed.type,
          amount: parsed.amount,
          method: parsed.method,
        }).catch((error) => {
          showToast({ type: 'error', title: 'Cloud sync transaction', message: error instanceof Error ? error.message : 'Transaction gardée localement.' });
          return null;
        })
      : null;
    applyTransactionSnapshot([cloudTransaction ?? fallbackTransaction, ...transactions]);
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
    const scannedTransaction: Transaction = {
      id: transactions.length + 1,
      date: new Date().toISOString().split('T')[0],
      description: 'Ticket scanné - Achat stock',
      category: 'Achats',
      type: 'expense',
      amount: 28500,
      method: 'Espèces',
      status: 'completed',
    };
    const cloudTransaction = cloudCompanyId
      ? await formalioBackend.createTransaction(cloudCompanyId, {
          description: scannedTransaction.description,
          category: scannedTransaction.category,
          type: scannedTransaction.type,
          amount: scannedTransaction.amount,
          method: scannedTransaction.method,
        }).catch(() => null)
      : null;
    applyTransactionSnapshot([cloudTransaction ?? scannedTransaction, ...transactions]);
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

  if (screen === 'auth') {
    return withLanguage(
      <AuthFlows
        profile={profile}
        transactions={transactions}
        notifications={notifications}
        metrics={financialMetrics}
        onComplete={async (isNewUser) => {
          showToast({ type: 'success', title: isNewUser ? 'Compte créé !' : 'Connexion réussie', message: isNewUser ? 'Bienvenue sur Formalio' : 'Bon retour !' });
          const loaded = await hydrateCloudData(true);
          if (loaded) setScreen('dashboard');
          else if (isNewUser && !businessName) setScreen('business-setup');
          else setScreen('dashboard');
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
        <DashboardScreen shellProps={shellProps} businessName={profile.ownerFullName || businessName || profile.storeName} avatarId={profile.avatarId} showBalance={showBalance} setShowBalance={setShowBalance} notifications={notifications} offlineMode={offlineMode} setOfflineMode={setOfflineMode} transactions={transactions} metrics={financialMetrics} navigate={navigate} openAi={() => setAiAssistantOpen(true)} />
      ) : null}
      {screen === 'transactions' ? <TransactionsScreen shellProps={shellProps} transactions={transactions} /> : null}
      {screen === 'add-transaction' ? <AddTransactionScreen shellProps={shellProps} cloudCompanyId={cloudCompanyId} transactions={transactions} setTransactions={applyTransactionSnapshot} navigate={navigate} openVoice={() => setVoiceRecorderOpen(true)} openScanner={() => setScannerOpen(true)} setShowConfetti={setShowConfetti} scannedDraft={pendingScan} onScanConsumed={handleScanDraftConsumed} /> : null}
      {screen === 'stock' ? <StockManagerScreen shellProps={shellProps} cloudCompanyId={cloudCompanyId} /> : null}
      {screen === 'cashflow' ? <CashflowScreen shellProps={shellProps} metrics={financialMetrics} cloudCompanyId={cloudCompanyId} /> : null}
      {screen === 'credit-score' ? <CreditScoreScreen shellProps={shellProps} metrics={financialMetrics} onLoanSubmitted={handleLoanSubmitted} /> : null}
      {screen === 'reports' ? <ReportsScreen shellProps={shellProps} openDownload={openDownload} loanRequests={loanRequests} metrics={financialMetrics} transactions={transactions} /> : null}
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
            void formalioBackend.signOut();
            setCloudCompanyId(null);
            setTransactions([]);
            replaceStockItems([]);
            setNotifications([]);
            setLoanRequests([]);
            setFinancialMetrics(emptyFinancialMetrics);
            setSubscription(defaultSubscription);
            setScreen('auth');
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

function DashboardScreen({
  shellProps,
  businessName,
  avatarId,
  showBalance,
  setShowBalance,
  notifications,
  offlineMode,
  setOfflineMode,
  transactions,
  metrics,
  navigate,
  openAi,
}: {
  shellProps: ShellProps;
  businessName: string;
  avatarId?: string;
  showBalance: boolean;
  setShowBalance: (v: boolean) => void;
  notifications: typeof initialNotifications;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  transactions: Transaction[];
  metrics: CloudFinancialMetrics;
  navigate: (s: Screen) => void;
  openAi: () => void;
}) {
  const { width } = useWindowDimensions();
  const recentTransactions = transactions.slice(0, 4);
  const emptyState = metrics.emptyState || metrics.transactionCount === 0;
  const displayName = businessName || 'Formalio';
  const balanceLabel = showBalance ? formatFCFA(metrics.balance) : '********';
  const growthLabel = `${metrics.growthRate >= 0 ? '+' : ''}${metrics.growthRate.toFixed(1)}%`;
  const eligibleRatio = Math.max(0, Math.min(1, metrics.mosikaScore / 1000));
  const hasInstitutionalLoanSignal = !emptyState && metrics.mosikaScore >= 520 && metrics.scoreConfidence >= 45 && metrics.riskAssessmentLevel !== 'high';
  const estimatedLoan = hasInstitutionalLoanSignal ? Math.round((100000 + Math.pow(eligibleRatio, 2) * 1900000) / 50000) * 50000 : 0;
  const compactQuick = width < 390;
  const ultraCompactQuick = width < 350;
  const dashboardTip = emptyState
    ? 'Ajoutez vos premieres donnees, puis construisez plusieurs mois de regularite pour activer un Score Mosika credible.'
    : metrics.profit >= 0
      ? `Votre marge nette est de ${metrics.profitMargin.toFixed(1)}%. Continuez à suivre les dépenses récurrentes pour renforcer le cash flow.`
      : `Vos dépenses dépassent les revenus de ${formatFCFA(Math.abs(metrics.profit))}. Priorisez les encaissements et les charges fixes.`;
  return (
    <ScreenWrapper {...shellProps} noPadding floatingAction={(scrollY) => <FloatingAIFab scrollY={scrollY} onPress={openAi} />}>
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <Row style={{ gap: 12 }}>
            <Tap onPress={() => navigate('profile')} style={styles.avatar}>
              <BuiltInAvatar avatarId={avatarId} size={42} />
            </Tap>
            <View>
              <Txt style={{ color: c.surface400, fontSize: 12 }}>Bonjour 👋</Txt>
              <Txt weight="semibold" style={{ fontSize: 14 }}>{displayName}</Txt>
            </View>
          </Row>
          <HeaderUtilityActions offlineMode={offlineMode} setOfflineMode={setOfflineMode} notifications={notifications} navigate={navigate} />
        </Row>
        <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.balanceCard}>
          <View style={[styles.softOrb, { right: -70, top: -70, backgroundColor: 'rgba(255,255,255,.06)' }]} />
          <View style={[styles.softOrb, { left: -52, bottom: -56, backgroundColor: 'rgba(255,255,255,.05)', width: 110, height: 110 }]} />
          <Row style={{ justifyContent: 'space-between', marginBottom: 6 }}>
            <Row style={{ gap: 8 }}>
              <LogoMark size={20} />
              <Txt weight="medium" style={{ color: 'rgba(255,255,255,.6)', fontSize: 12 }}>Solde Total</Txt>
            </Row>
            <Tap onPress={() => setShowBalance(!showBalance)}>
              <Icon icon={showBalance ? EyeOff : Eye} size={17} color="rgba(255,255,255,.65)" />
            </Tap>
          </Row>
          <Txt weight="bold" style={{ color: c.white, fontSize: 30, marginBottom: 13 }}>{balanceLabel}</Txt>
          <Row style={{ gap: 12 }}>
            <View style={styles.balancePill}>
              <Icon icon={TrendingUp} size={14} color={c.formalio300} />
              <Txt weight="medium" style={{ color: c.formalio300, fontSize: 12 }}>{growthLabel}</Txt>
            </View>
            <Tap onPress={() => navigate('cashflow')} style={styles.balanceDetail}>
              <Txt style={{ color: c.white, fontSize: 12 }}>Détails</Txt>
              <Icon icon={ChevronRight} size={13} color={c.white} />
            </Tap>
          </Row>
        </LinearGradient>
        <View style={styles.dashboardQuickRow}>
          {[
            { label: 'Revenus', icon: TrendingUp, bg: c.formalio50, color: c.formalio700, value: formatCompactFCFA(metrics.revenue), screen: 'cashflow' as Screen },
            { label: 'Dépenses', icon: TrendingDown, bg: c.danger50, color: c.danger600, value: formatCompactFCFA(metrics.expenses), screen: 'cashflow' as Screen },
            { label: 'Score', icon: Award, bg: c.gold50, color: c.gold600, value: String(metrics.mosikaScore), screen: 'credit-score' as Screen },
            { label: 'Rapports', icon: FileText, bg: c.info50, color: c.info600, value: String(metrics.reportCount), screen: 'reports' as Screen },
          ].map((item, index) => (
            <Animated.View key={item.label} entering={FadeIn.delay(index * 55).duration(220)} style={[styles.dashboardQuickCell, index < 3 && styles.dashboardQuickCellGap]}>
              <Tap onPress={() => navigate(item.screen)} style={[styles.quickAction, compactQuick && styles.quickActionCompact, ultraCompactQuick && styles.quickActionUltraCompact]}>
                <View style={[styles.quickIcon, compactQuick && styles.quickIconCompact, { backgroundColor: item.bg }]}>
                  <Icon icon={item.icon} size={compactQuick ? 14 : 17} color={item.color} />
                </View>
                <Txt weight="black" numberOfLines={1} style={[styles.quickValue, compactQuick && styles.quickValueCompact]}>{item.value}</Txt>
                <Txt numberOfLines={1} style={[styles.quickLabel, compactQuick && styles.quickLabelCompact]}>{item.label}</Txt>
              </Tap>
            </Animated.View>
          ))}
        </View>
        <Tap onPress={() => navigate('accounting')} style={{ marginTop: 14 }}>
          <LinearGradient colors={[c.formalio800, c.formalio700, c.info600]} start={{ x: 0, y: 0 }} end={{ x: 1, y: 1 }} style={styles.aiAccounting}>
            <View style={[styles.softOrb, { right: -32, top: -36, width: 120, height: 120, backgroundColor: 'rgba(255,255,255,.1)' }]} />
            <Row style={{ gap: 12 }}>
              <View style={styles.aiIconBox}><Icon icon={BrainCircuit} size={24} color={c.white} /></View>
              <View style={{ flex: 1, minWidth: 0 }}>
                <Row style={{ gap: 6 }}>
                  <Txt weight="black" style={{ color: c.white, fontSize: 14 }}>Comptabilité IA Mosika</Txt>
                  <View style={styles.newBadge}><Txt weight="black" style={{ color: c.white, fontSize: 8 }}>NEW</Txt></View>
                </Row>
                <Txt style={{ color: 'rgba(255,255,255,.8)', fontSize: 11, marginTop: 3 }}>P&L, cash flow, fiscalité, rapports IA</Txt>
              </View>
              <Icon icon={ChevronRight} size={20} color="rgba(255,255,255,.72)" />
            </Row>
          </LinearGradient>
        </Tap>
        <View style={styles.mosikaTip}>
          <AnimatedMascot state="thinking" size={48} />
          <View style={{ flex: 1 }}>
            <Row style={{ gap: 4, marginBottom: 3 }}>
              <Icon icon={Sparkles} size={13} color={c.formalio700} />
              <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Conseil de Mosika</Txt>
            </Row>
            <Txt style={{ color: c.surface700, fontSize: 13, lineHeight: 19 }}>{dashboardTip}</Txt>
            <Tap onPress={() => navigate('ai-insights')} style={{ marginTop: 8 }}>
              <Row style={{ gap: 3 }}>
                <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Voir tous les insights</Txt>
                <Icon icon={ChevronRight} size={13} color={c.formalio700} />
              </Row>
            </Tap>
          </View>
        </View>
        <Card style={{ marginTop: 16, marginBottom: 16 }}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
            <Txt weight="semibold" style={{ fontSize: 14 }}>Transactions Récentes</Txt>
            <Tap onPress={() => navigate('transactions')}>
              <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12 }}>Voir tout</Txt>
            </Tap>
          </Row>
          {recentTransactions.length === 0 ? (
            <View style={styles.noResultsState}>
              <Icon icon={Receipt} size={24} color={c.surface400} />
              <Txt weight="semibold" style={{ marginTop: 10, color: c.surface700 }}>0 transaction</Txt>
              <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 4, textAlign: 'center' }}>Ajoutez un revenu ou une depense pour activer vos KPI.</Txt>
            </View>
          ) : recentTransactions.map((t) => <TransactionRow key={t.id} transaction={t} compact />)}
        </Card>
        <View style={styles.loanCard}>
          <View style={styles.loanIcon}><Icon icon={Award} size={21} color={c.gold600} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight="semibold" style={{ fontSize: 14 }}>{emptyState ? 'Score en construction' : 'Éligibilité Mosika dynamique'}</Txt>
            <Txt style={{ color: c.surface600, fontSize: 12, lineHeight: 17, marginTop: 4 }}>
              {emptyState
                ? 'Votre score demarre a 0. Plusieurs mois de donnees verifiees sont necessaires avant toute eligibilite.'
                : hasInstitutionalLoanSignal
                  ? `Score ${metrics.mosikaScore}. Limite indicative stricte: ${formatFCFA(estimatedLoan)} selon vos donnees verifiees.`
                  : `Score ${metrics.mosikaScore}. Historique encore insuffisant pour une pre-approbation institutionnelle.`}
            </Txt>
            <Tap onPress={() => navigate('credit-score')} style={styles.loanButton}>
              <Txt weight="medium" style={{ color: c.white, fontSize: 12 }}>{emptyState ? 'Construire le score' : "Voir l'offre"}</Txt>
            </Tap>
          </View>
        </View>
      </View>
    </ScreenWrapper>
  );
}

function FloatingAIFab({ scrollY, onPress }: { scrollY: SharedValue<number>; onPress: () => void }) {
  const float = useSharedValue(0);
  const dragY = useSharedValue(0);

  useEffect(() => {
    float.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
        withTiming(0, { duration: 1800, easing: Easing.inOut(Easing.ease) }),
      ),
      -1,
      false,
    );
  }, [float]);

  const pan = Gesture.Pan()
    .onUpdate((event) => {
      dragY.value = Math.max(-86, Math.min(28, event.translationY));
    })
    .onFinalize(() => {
      dragY.value = withSpring(0, { damping: 18, stiffness: 160 });
    });

  const animatedStyle = useAnimatedStyle(() => {
    const scrollLift = interpolate(scrollY.value, [0, 80, 180], [0, 8, 24], Extrapolation.CLAMP);
    const scale = interpolate(scrollY.value, [0, 120, 260], [1, 0.96, 0.86], Extrapolation.CLAMP);
    const opacity = interpolate(scrollY.value, [0, 180, 320], [1, 0.94, 0.72], Extrapolation.CLAMP);
    return {
      opacity,
      transform: [{ translateY: float.value + scrollLift + dragY.value }, { scale }],
    };
  });

  return (
    <GestureDetector gesture={pan}>
      <Animated.View entering={SlideInDown.springify().damping(20).stiffness(180)} style={[styles.aiFabDock, animatedStyle]}>
        <Tap onPress={onPress} accessibilityLabel="Ouvrir Mosika AI" style={styles.aiFab}>
          <LinearGradient colors={[c.formalio600, c.formalio800]} style={styles.aiFabInner}>
            <Icon icon={Sparkles} size={21} color={c.white} />
          </LinearGradient>
          <View style={styles.aiFabBadge}><Txt weight="bold" style={{ color: c.white, fontSize: 9 }}>AI</Txt></View>
        </Tap>
      </Animated.View>
    </GestureDetector>
  );
}

type TransactionTimeFilter = 'all' | 'morning' | 'afternoon' | 'evening';

function normalizeSearchText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .trim();
}

function parseNumberInput(value: string) {
  const cleaned = value.replace(/\s/g, '').replace(/[^\d.,]/g, '');
  const normalized = /^\d{1,3}([,.]\d{3})+$/.test(cleaned)
    ? cleaned.replace(/[,.]/g, '')
    : cleaned.replace(',', '.');
  const parsed = Number(normalized);
  return Number.isFinite(parsed) ? parsed : 0;
}

function getTransactionHour(transaction: Transaction) {
  const idSeed = typeof transaction.id === 'number'
    ? transaction.id
    : transaction.id.split('').reduce((sum, char) => sum + char.charCodeAt(0), 0);
  return (idSeed * 3 + 7) % 24;
}

function getTransactionTime(transaction: Transaction) {
  return `${String(getTransactionHour(transaction)).padStart(2, '0')}:15`;
}

function getTransactionTimeBucket(transaction: Transaction): TransactionTimeFilter {
  const hour = getTransactionHour(transaction);
  if (hour < 12) return 'morning';
  if (hour < 17) return 'afternoon';
  return 'evening';
}

function FilterChipGroup({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { key: string; label: string }[];
  value: string;
  onChange: (value: string) => void;
}) {
  return (
    <View style={{ gap: 8 }}>
      <Txt weight="bold" style={{ color: c.surface700, fontSize: 11 }}>{label}</Txt>
      <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8 }}>
        {options.map((option) => {
          const active = value === option.key;
          return (
            <Tap key={option.key} onPress={() => onChange(option.key)} style={[styles.filterChip, active && styles.filterChipActive]}>
              <Txt weight="bold" style={{ color: active ? c.formalio700 : c.surface600, fontSize: 11 }}>{option.label}</Txt>
            </Tap>
          );
        })}
      </ScrollView>
    </View>
  );
}

function PaymentMethodInline({ method, color = c.surface500 }: { method: string; color?: string }) {
  const provider = getMobileMoneyProvider(method);
  return (
    <Row style={styles.paymentMethodInline}>
      {provider ? <MobileMoneyIcon provider={provider} size={16} containerStyle={styles.paymentMethodMiniIcon} /> : null}
      <Txt numberOfLines={1} style={{ color, fontSize: 11 }}>{method}</Txt>
    </Row>
  );
}

function PaymentBrandPill({ label }: { label: string }) {
  const provider = getMobileMoneyProvider(label);
  if (!provider) return <Pill>{label}</Pill>;

  return (
    <Pill tone="surface" style={styles.paymentBrandPill}>
      <Row style={{ gap: 5 }}>
        <MobileMoneyIcon provider={provider} size={18} containerStyle={styles.paymentMethodMiniIcon} />
        <Txt weight="bold" style={{ color: c.surface700, fontSize: 10 }}>{label}</Txt>
      </Row>
    </Pill>
  );
}

function TransactionRow({ transaction, compact = false }: { transaction: Transaction; compact?: boolean }) {
  const income = transaction.type === 'income';
  return (
    <View style={[styles.transactionRow, compact && { paddingVertical: 8 }]}>
      <Row style={{ gap: 12, flex: 1, minWidth: 0 }}>
        <View style={[styles.transactionIcon, { backgroundColor: income ? c.formalio50 : c.danger50 }]}>
          <Icon icon={income ? TrendingUp : TrendingDown} size={compact ? 16 : 20} color={income ? c.formalio600 : c.danger500} />
        </View>
        <View style={{ flex: 1, minWidth: 0 }}>
          <Txt weight="medium" numberOfLines={1} style={{ fontSize: 13 }}>{transaction.description}</Txt>
          <Row style={{ gap: 5, marginTop: 2, minWidth: 0 }}>
            <Txt numberOfLines={1} style={{ color: c.surface400, fontSize: 11, flexShrink: 1 }}>{compact ? transaction.category : `${transaction.date} | ${getTransactionTime(transaction)}`}</Txt>
            <Txt style={{ color: c.surface300, fontSize: 11 }}>|</Txt>
            <PaymentMethodInline method={transaction.method} color={c.surface400} />
          </Row>
        </View>
      </Row>
      <Txt weight="bold" style={{ color: income ? c.formalio600 : c.danger500, fontSize: 13 }}>{income ? '+' : '-'}{transaction.amount.toLocaleString('fr-FR')}</Txt>
    </View>
  );
}

function TransactionsScreen({ shellProps, transactions }: { shellProps: ShellProps; transactions: Transaction[] }) {
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
            <Card key={t.id} style={{ padding: 4, borderRadius: 12 }}>
              <TransactionRow transaction={t} />
            </Card>
          ))}
        </View>
      )}
    </ScreenWrapper>
  );
}

function formatStockPrice(item: StockItem) {
  if (item.priceType === 'fixed') return formatFCFA(item.unitPrice ?? 0);
  return `~${formatFCFA(item.minPrice ?? 0).replace(' FCFA', '')} - ${formatFCFA(item.maxPrice ?? 0)}`;
}

function formatStockCompactValue(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${(value / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}M FCFA`;
  if (abs >= 1000) return `${Math.round(value / 1000)}k FCFA`;
  return formatFCFA(value);
}

function stockUpdatedAtMs(item: StockItem) {
  const parsed = new Date(item.updatedAt).getTime();
  return Number.isFinite(parsed) ? parsed : 0;
}

function sortStockItems(items: StockItem[]) {
  return [...items].sort((a, b) => stockUpdatedAtMs(b) - stockUpdatedAtMs(a));
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

function StockManagerScreen({ shellProps, cloudCompanyId }: { shellProps: ShellProps; cloudCompanyId: string | null }) {
  return (
    <ScreenWrapper {...shellProps} title="Gestionnaire de Stock">
      <StockManagerPanel cloudCompanyId={cloudCompanyId} />
    </ScreenWrapper>
  );
}

function StockManagerPanel({ embedded = false, cloudCompanyId = null }: { embedded?: boolean; cloudCompanyId?: string | null }) {
  const { showToast } = useToast();
  const items = useStockStore((state) => state.items);
  const upsertItem = useStockStore((state) => state.upsertItem);
  const deleteItem = useStockStore((state) => state.deleteItem);
  const replaceItems = useStockStore((state) => state.replaceItems);
  const [searchQuery, setSearchQuery] = useState('');
  const [formOpen, setFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<StockItem | null>(null);
  const [itemName, setItemName] = useState('');
  const [quantity, setQuantity] = useState('');
  const [priceType, setPriceType] = useState<StockPriceType>('fixed');
  const [unitPrice, setUnitPrice] = useState('');
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [formErrors, setFormErrors] = useState<Record<string, string>>({});
  const [stockSyncing, setStockSyncing] = useState(false);
  const filteredItems = useMemo(() => {
    const query = normalizeSearchText(searchQuery);
    if (!query) return items;
    return items.filter((item) => normalizeSearchText(item.name).includes(query));
  }, [items, searchQuery]);
  const totalValue = useMemo(() => getTotalStockValue(items), [items]);

  const resetForm = () => {
    setEditingItem(null);
    setItemName('');
    setQuantity('');
    setPriceType('fixed');
    setUnitPrice('');
    setMinPrice('');
    setMaxPrice('');
    setFormErrors({});
  };

  const openCreateForm = () => {
    resetForm();
    setFormOpen(true);
  };

  const openEditForm = (item: StockItem) => {
    setEditingItem(item);
    setItemName(item.name);
    setQuantity(String(item.quantity));
    setPriceType(item.priceType);
    setUnitPrice(item.unitPrice ? String(item.unitPrice) : '');
    setMinPrice(item.minPrice ? String(item.minPrice) : '');
    setMaxPrice(item.maxPrice ? String(item.maxPrice) : '');
    setFormErrors({});
    setFormOpen(true);
  };

  const closeForm = () => {
    setFormOpen(false);
    resetForm();
  };

  const validateForm = () => {
    const nextErrors: Record<string, string> = {};
    const parsedQuantity = parseNumberInput(quantity);
    const parsedUnitPrice = parseNumberInput(unitPrice);
    const parsedMinPrice = parseNumberInput(minPrice);
    const parsedMaxPrice = parseNumberInput(maxPrice);

    if (!itemName.trim()) nextErrors.name = 'Nom requis';
    if (!quantity.trim() || parsedQuantity < 0) nextErrors.quantity = 'Quantité ≥ 0 requise';
    if (priceType === 'fixed' && parsedUnitPrice <= 0) nextErrors.unitPrice = 'Prix unitaire > 0 requis';
    if (priceType === 'range') {
      if (parsedMinPrice <= 0) nextErrors.minPrice = 'Prix min > 0 requis';
      if (parsedMaxPrice < parsedMinPrice) nextErrors.maxPrice = 'Prix max ≥ prix min requis';
    }

    setFormErrors(nextErrors);
    return { ok: Object.keys(nextErrors).length === 0, parsedQuantity, parsedUnitPrice, parsedMinPrice, parsedMaxPrice };
  };

  const saveItem = async () => {
    const validation = validateForm();
    if (!validation.ok) return;

    const saved = upsertItem({
      id: editingItem?.id,
      name: itemName,
      quantity: validation.parsedQuantity,
      priceType,
      unitPrice: validation.parsedUnitPrice,
      minPrice: validation.parsedMinPrice,
      maxPrice: validation.parsedMaxPrice,
    });
    if (cloudCompanyId) {
      setStockSyncing(true);
      try {
        const cloudSaved = await formalioBackend.upsertStockItem(cloudCompanyId, saved);
        if (cloudSaved) {
          const nextItems = useStockStore.getState().items.map((item) => (item.id === cloudSaved.id ? cloudSaved : item));
          replaceItems(sortStockItems(nextItems));
        }
      } catch (error) {
        showToast({ type: 'error', title: 'Sync cloud stock', message: error instanceof Error ? error.message : 'Stock gardé localement.' });
      } finally {
        setStockSyncing(false);
      }
    }
    showToast({ type: 'success', title: editingItem ? 'Stock modifié' : 'Article ajouté', message: 'Gestionnaire de stock mis à jour.' });
    closeForm();
  };

  const removeItem = async (item: StockItem) => {
    deleteItem(item.id);
    if (cloudCompanyId) {
      try {
        await formalioBackend.deleteStockItem(cloudCompanyId, item.id);
      } catch (error) {
        showToast({ type: 'error', title: 'Sync cloud stock', message: error instanceof Error ? error.message : 'Suppression gardée localement.' });
      }
    }
    showToast({ type: 'info', title: 'Article supprimé', message: 'Les anciennes transactions restent conservées.' });
  };

  return (
    <View style={{ gap: 14 }}>
      <Card style={embedded ? styles.stockEmbeddedHeader : styles.stockHeaderCard}>
        <Row style={{ justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Row style={{ gap: 8, marginBottom: 4 }}>
              <View style={[styles.metricIcon, { backgroundColor: c.formalio50 }]}><Icon icon={Package} size={16} color={c.formalio700} /></View>
              <Txt weight="black" style={{ fontSize: 15 }}>Gestionnaire de Stock</Txt>
            </Row>
            <Txt style={{ color: c.surface500, fontSize: 12 }}>{items.length} article{items.length > 1 ? 's' : ''} · {isAndroidNative ? formatStockCompactValue(totalValue) : formatFCFA(totalValue)}</Txt>
          </View>
          <PrimaryButton label="Ajouter" icon={Plus} onPress={openCreateForm} style={styles.stockAddButton} />
        </Row>
      </Card>

      <View style={styles.inputBox}>
        <Icon icon={Search} size={16} color={c.surface400} />
        <TextInput
          value={searchQuery}
          onChangeText={setSearchQuery}
          placeholder="Rechercher un article..."
          placeholderTextColor={c.surface400}
          autoCapitalize="none"
          maxFontSizeMultiplier={inputTextMaxScale}
          style={styles.textInput}
        />
        {searchQuery ? (
          <Tap onPress={() => setSearchQuery('')} accessibilityLabel="Effacer la recherche stock">
            <Icon icon={X} size={15} color={c.surface400} />
          </Tap>
        ) : null}
      </View>

      {filteredItems.length === 0 ? (
        <View style={styles.stockEmptyState}>
          <Icon icon={Package} size={26} color={c.surface400} />
          <Txt weight="semibold" style={{ color: c.surface700, marginTop: 10 }}>{items.length === 0 ? 'Aucun article en stock' : 'Aucun article trouvé'}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{items.length === 0 ? 'Ajoutez un article pour activer la valorisation et les ventes automatiques.' : 'Essayez un autre nom.'}</Txt>
          {items.length === 0 ? (
            <Tap onPress={openCreateForm} style={styles.stockEmptyButton}>
              <Txt weight="black" style={{ color: c.white, fontSize: 12 }}>Ajouter le premier article</Txt>
            </Tap>
          ) : null}
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {filteredItems.map((item) => {
            const outOfStock = item.quantity <= 0;
            return (
              <Card key={item.id} style={[styles.stockItemCard, outOfStock && styles.stockItemCardMuted]}>
                <Row style={{ justifyContent: 'space-between', gap: 12, alignItems: 'flex-start' }}>
                  <Row style={{ gap: 10, flex: 1, minWidth: 0 }}>
                    <View style={[styles.stockItemIcon, outOfStock && { backgroundColor: c.surface100 }]}>
                      <Icon icon={Package} size={17} color={outOfStock ? c.surface400 : c.formalio700} />
                    </View>
                    <View style={{ flex: 1, minWidth: 0 }}>
                      <Txt weight="black" numberOfLines={1} style={{ color: outOfStock ? c.surface500 : c.surface900, fontSize: 14 }}>{item.name}</Txt>
                      <Row style={{ gap: 6, marginTop: 5 }}>
                        <Pill tone={outOfStock ? 'surface' : 'green'}>{outOfStock ? 'Rupture' : `${item.quantity} unités`}</Pill>
                        <Pill tone={item.priceType === 'fixed' ? 'blue' : 'gold'}>{item.priceType === 'fixed' ? 'fixed' : 'range'}</Pill>
                      </Row>
                    </View>
                  </Row>
                  <Row style={{ gap: 6 }}>
                    <Tap onPress={() => openEditForm(item)} style={styles.stockIconButton} accessibilityLabel={`Modifier ${item.name}`}>
                      <Icon icon={Pencil} size={15} color={c.info700} />
                    </Tap>
                    <Tap onPress={() => { void removeItem(item); }} style={[styles.stockIconButton, styles.stockDeleteButton]} accessibilityLabel={`Supprimer ${item.name}`}>
                      <Icon icon={Trash2} size={15} color={c.danger600} />
                    </Tap>
                  </Row>
                </Row>
                <Grid columns={isAndroidNative ? 2 : 3} gap={8}>
                  <View style={styles.stockMetaCell}>
                    <Txt style={styles.stockMetaLabel}>Prix</Txt>
                    <Txt weight="black" numberOfLines={1} style={styles.stockMetaValue}>{formatStockPrice(item)}</Txt>
                  </View>
                  <View style={styles.stockMetaCell}>
                    <Txt style={styles.stockMetaLabel}>Qté</Txt>
                    <Txt weight="black" style={styles.stockMetaValue}>{item.quantity}</Txt>
                  </View>
                  <View style={styles.stockMetaCell}>
                    <Txt style={styles.stockMetaLabel}>Valeur</Txt>
                    <Txt weight="black" numberOfLines={1} style={styles.stockMetaValue}>{isAndroidNative ? formatStockCompactValue(getStockItemValue(item)) : formatFCFA(getStockItemValue(item))}</Txt>
                  </View>
                </Grid>
              </Card>
            );
          })}
        </View>
      )}

      <ModalShell visible={formOpen} onClose={closeForm}>
        <View style={{ gap: 14 }}>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <View style={{ flex: 1 }}>
              <Txt weight="black" style={{ fontSize: 18 }}>{editingItem ? 'Modifier article' : 'Ajouter article'}</Txt>
              <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 3 }}>Prix et quantité en FCFA.</Txt>
            </View>
            <Tap onPress={closeForm} style={styles.iconButton}>
              <Icon icon={X} size={18} color={c.surface500} />
            </Tap>
          </Row>
          <Field label="Item Name" value={itemName} onChangeText={setItemName} placeholder="Ex: Riz 25kg" error={formErrors.name} />
          <Field label="Quantity" value={quantity} onChangeText={setQuantity} placeholder="0" keyboardType="numeric" error={formErrors.quantity} />
          <View>
            <Txt weight="medium" style={styles.fieldLabel}>Price Type</Txt>
            <Segment value={priceType} onChange={setPriceType} options={[{ key: 'fixed', label: 'Fixed Price' }, { key: 'range', label: 'Price Range' }]} />
          </View>
          {priceType === 'fixed' ? (
            <Field label="Unit Price (FCFA)" value={unitPrice} onChangeText={setUnitPrice} placeholder="Ex: 1500" keyboardType="numeric" error={formErrors.unitPrice} />
          ) : (
            <Grid columns={2} gap={8}>
              <Field label="Min Price (FCFA)" value={minPrice} onChangeText={setMinPrice} placeholder="1500" keyboardType="numeric" error={formErrors.minPrice} />
              <Field label="Max Price (FCFA)" value={maxPrice} onChangeText={setMaxPrice} placeholder="2000" keyboardType="numeric" error={formErrors.maxPrice} />
            </Grid>
          )}
          <PrimaryButton label={stockSyncing ? 'Synchronisation...' : 'Save'} icon={stockSyncing ? RefreshCw : Check} disabled={stockSyncing} onPress={() => { void saveItem(); }} style={{ marginTop: 2 }} />
        </View>
      </ModalShell>
    </View>
  );
}

function AddTransactionScreen({
  shellProps,
  cloudCompanyId,
  transactions,
  setTransactions,
  navigate,
  openVoice,
  openScanner,
  setShowConfetti,
  scannedDraft,
  onScanConsumed,
}: {
  shellProps: ShellProps;
  cloudCompanyId: string | null;
  transactions: Transaction[];
  setTransactions: (v: Transaction[]) => void;
  navigate: (s: Screen) => void;
  openVoice: () => void;
  openScanner: () => void;
  setShowConfetti: (v: boolean) => void;
  scannedDraft: ScannedTicketData | null;
  onScanConsumed: () => void;
}) {
  const { showToast } = useToast();
  const [type, setType] = useState<'income' | 'expense'>('income');
  const [amount, setAmount] = useState('');
  const [desc, setDesc] = useState('');
  const [category, setCategory] = useState('');
  const [scanPreview, setScanPreview] = useState<ScannedTicketData | null>(null);
  const [method, setMethod] = useState('Espèces');
  const [transactionDate, setTransactionDate] = useState(new Date().toISOString().split('T')[0]);
  const [revenueSource, setRevenueSource] = useState<'stock' | 'other'>('other');
  const [selectedStockId, setSelectedStockId] = useState('');
  const [stockSearchQuery, setStockSearchQuery] = useState('');
  const [quantitySold, setQuantitySold] = useState('');
  const [rangeSaleUnitPrice, setRangeSaleUnitPrice] = useState('');
  const [stockError, setStockError] = useState('');
  const stockItems = useStockStore((state) => state.items);
  const decreaseStock = useStockStore((state) => state.decreaseStock);
  const replaceItems = useStockStore((state) => state.replaceItems);
  const isExpense = type === 'expense';
  const stockSaleActive = type === 'income' && revenueSource === 'stock' && stockItems.length > 0;
  const selectedStockItem = useMemo(() => stockItems.find((item) => item.id === selectedStockId), [selectedStockId, stockItems]);
  const stockSearchResults = useMemo(() => {
    const query = normalizeSearchText(stockSearchQuery);
    if (!query) return stockItems;
    return stockItems.filter((item) => normalizeSearchText(item.name).includes(query));
  }, [stockItems, stockSearchQuery]);
  const quantitySoldNumber = parseNumberInput(quantitySold);
  const stockSaleUnitPrice = selectedStockItem?.priceType === 'fixed'
    ? getStockUnitEstimate(selectedStockItem)
    : parseNumberInput(rangeSaleUnitPrice);
  const stockSaleAmount = selectedStockItem && quantitySoldNumber > 0 && stockSaleUnitPrice > 0
    ? quantitySoldNumber * stockSaleUnitPrice
    : 0;
  const stockQuantityError = selectedStockItem && quantitySoldNumber > selectedStockItem.quantity
    ? `Stock insuffisant. Maximum disponible: ${selectedStockItem.quantity}`
    : '';
  const flowAccent = isExpense ? c.danger600 : c.formalio700;
  const flowSoft = isExpense ? c.danger50 : c.formalio50;
  const signedAmount = Number(amount || 0);
  const categories = isExpense ? ['Achats', 'Transport', 'Loyer', 'Salaires', 'Taxes', 'Autres'] : ['Ventes', 'Services', 'Locations', 'Apports', 'Autres'];
  const paymentMethods = [
    { label: 'Espèces', icon: Wallet },
    { label: 'MTN MoMo', icon: Smartphone },
    { label: 'Orange Money', icon: CreditCard },
  ];
  useEffect(() => {
    if (type === 'expense' || stockItems.length === 0) {
      setRevenueSource('other');
    }
  }, [stockItems.length, type]);
  useEffect(() => {
    if (!stockSaleActive) return;
    setAmount(stockSaleAmount > 0 ? String(Math.round(stockSaleAmount)) : '');
  }, [stockSaleActive, stockSaleAmount]);
  useEffect(() => {
    if (!stockSaleActive || !selectedStockItem) return;
    setDesc(`Vente de ${selectedStockItem.name}`);
  }, [selectedStockItem, stockSaleActive]);
  useEffect(() => {
    setStockError('');
  }, [quantitySold, rangeSaleUnitPrice, revenueSource, selectedStockId, type]);
  useEffect(() => {
    if (scanPreview?.type === type) return;
    setCategory('');
  }, [scanPreview, type]);
  useEffect(() => {
    if (!scannedDraft) return;
    setType(scannedDraft.type);
    setRevenueSource('other');
    setAmount(String(scannedDraft.amount));
    setDesc(scannedDraft.description);
    setCategory(scannedDraft.category);
    setMethod(scannedDraft.method);
    setTransactionDate(scannedDraft.date || new Date().toISOString().split('T')[0]);
    setScanPreview(scannedDraft);
    onScanConsumed();
  }, [onScanConsumed, scannedDraft]);
  const handleSave = async () => {
    if (stockSaleActive) {
      if (!selectedStockItem) {
        setStockError('Sélectionnez un article.');
        return showToast({ type: 'error', title: 'Article requis', message: 'Sélectionnez un article en stock.' });
      }
      if (selectedStockItem.quantity <= 0) {
        setStockError('Article en rupture de stock.');
        return showToast({ type: 'error', title: 'Rupture de stock', message: 'Cet article ne peut pas être vendu.' });
      }
      if (quantitySoldNumber < 1) {
        setStockError('Quantité vendue ≥ 1 requise.');
        return showToast({ type: 'error', title: 'Quantité invalide', message: 'Entrez au moins 1 unité vendue.' });
      }
      if (quantitySoldNumber > selectedStockItem.quantity) {
        setStockError(`Stock insuffisant. Maximum disponible: ${selectedStockItem.quantity}`);
        return;
      }
      if (selectedStockItem.priceType === 'range' && stockSaleUnitPrice <= 0) {
        setStockError('Prix de vente unitaire requis.');
        return showToast({ type: 'error', title: 'Prix requis', message: 'Entrez le prix de vente unitaire.' });
      }
      if (stockSaleAmount <= 0) {
        setStockError('Montant calculé invalide.');
        return;
      }
    }

    const finalAmount = stockSaleActive ? Math.round(stockSaleAmount) : Number(amount);
    const finalDescription = stockSaleActive && selectedStockItem ? (desc.trim() || `Vente de ${selectedStockItem.name}`) : desc;
    const finalCategory = stockSaleActive ? 'Ventes' : (category || 'Autres');

    if (!finalAmount || !finalDescription) return showToast({ type: 'error', title: 'Champs manquants', message: 'Montant et description requis' });
    const fallbackTransaction: Transaction = {
      id: transactions.length + 1,
      date: transactionDate || new Date().toISOString().split('T')[0],
      description: finalDescription,
      category: finalCategory,
      type,
      amount: finalAmount,
      method,
      status: 'completed',
    };
    const cloudTransaction = cloudCompanyId
      ? await formalioBackend.createTransaction(cloudCompanyId, {
          description: finalDescription,
          category: finalCategory,
          type,
          amount: finalAmount,
          method,
        }).catch((error) => {
          showToast({ type: 'error', title: 'Cloud sync transaction', message: error instanceof Error ? error.message : 'Transaction gardée localement.' });
          return null;
        })
      : null;
    setTransactions([cloudTransaction ?? fallbackTransaction, ...transactions]);
    if (stockSaleActive && selectedStockItem) {
      const result = decreaseStock(selectedStockItem.id, quantitySoldNumber);
      if (!result.ok) {
        setStockError(result.error ?? 'Impossible de mettre à jour le stock.');
        return showToast({ type: 'error', title: 'Stock non mis à jour', message: result.error ?? 'Vérifiez la quantité disponible.' });
      }
      if (cloudCompanyId && result.item) {
        try {
          const cloudSaved = await formalioBackend.upsertStockItem(cloudCompanyId, result.item);
          if (cloudSaved) {
            const nextItems = useStockStore.getState().items.map((item) => (item.id === cloudSaved.id ? cloudSaved : item));
            replaceItems(sortStockItems(nextItems));
          }
        } catch (error) {
          showToast({ type: 'error', title: 'Sync cloud stock', message: error instanceof Error ? error.message : 'Stock mis à jour localement.' });
        }
      }
    }
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    showToast({ type: 'success', title: stockSaleActive ? 'Transaction enregistrée. Stock mis à jour.' : 'Transaction enregistrée !', message: `${isExpense ? '-' : '+'}${finalAmount.toLocaleString('fr-FR')} FCFA` });
    navigate('dashboard');
  };
  return (
    <ScreenWrapper {...shellProps} title="Nouvelle Transaction">
      <View style={{ gap: 16 }}>
        <Segment value={type} onChange={setType} options={[{ key: 'income', label: '+ Revenu' }, { key: 'expense', label: '- Dépense' }]} />
        {!isExpense && stockItems.length > 0 ? (
          <View>
            <Txt weight="medium" style={styles.fieldLabel}>Revenue Source</Txt>
            <Segment value={revenueSource} onChange={setRevenueSource} options={[{ key: 'stock', label: 'Stock', icon: Package }, { key: 'other', label: 'Service', icon: Receipt }]} />
          </View>
        ) : null}
        <View style={[styles.transactionPreview, { borderColor: isExpense ? c.danger200 : c.formalio200, backgroundColor: flowSoft }]}>
          <View style={[styles.transactionPreviewIcon, { backgroundColor: isExpense ? c.danger100 : c.formalio100 }]}>
            <Icon icon={isExpense ? ArrowDownRight : ArrowUpRight} size={18} color={flowAccent} />
          </View>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt weight="semibold" style={{ color: flowAccent, fontSize: 12 }}>{isExpense ? 'Sortie de trésorerie' : 'Entrée de trésorerie'}</Txt>
            <Txt numberOfLines={1} style={{ color: c.surface600, fontSize: 11, marginTop: 2 }}>{isExpense ? 'Les montants seront affichés en négatif avec un accent rouge contrôlé.' : 'Les montants seront affichés en positif avec un accent vert.'}</Txt>
          </View>
          <Txt weight="black" style={{ color: flowAccent, fontSize: 18 }}>
            {isExpense ? '-' : '+'}{signedAmount > 0 ? signedAmount.toLocaleString('fr-FR') : '0'}
          </Txt>
        </View>
        {scanPreview ? (
          <Animated.View entering={FadeIn.duration(180)} style={styles.ocrAutofillCard}>
            <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
              <Row style={{ gap: 8 }}>
                <View style={[styles.metricIcon, { backgroundColor: c.info50 }]}><Icon icon={ScanLine} size={16} color={c.info700} /></View>
                <View>
                  <Txt weight="black" style={{ fontSize: 12 }}>Ticket Scanner auto-fill</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 10 }}>{scanPreview.merchant} · {scanPreview.ticketNumber}</Txt>
                </View>
              </Row>
              <Pill tone="blue">OCR 98%</Pill>
            </Row>
            <Grid columns={2} gap={8}>
              <View style={styles.ocrAutofillCell}><Txt style={{ color: c.surface400, fontSize: 10 }}>Reference</Txt><Txt weight="bold" numberOfLines={1} style={{ fontSize: 11 }}>{scanPreview.referenceNumber}</Txt></View>
              <View style={styles.ocrAutofillCell}><Txt style={{ color: c.surface400, fontSize: 10 }}>Date</Txt><Txt weight="bold" numberOfLines={1} style={{ fontSize: 11 }}>{scanPreview.date}</Txt></View>
            </Grid>
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 9 }}>{scanPreview.details}</Txt>
            <Row style={{ gap: 8, marginTop: 10 }}>
              <Tap onPress={openScanner} style={styles.ocrRetryButton}><Icon icon={RefreshCw} size={13} color={c.info700} /><Txt weight="bold" style={{ color: c.info700, fontSize: 10 }}>Relancer le scan</Txt></Tap>
              <Tap onPress={() => setScanPreview(null)} style={styles.ocrRetryButton}><Icon icon={FileText} size={13} color={c.surface600} /><Txt weight="bold" style={{ color: c.surface600, fontSize: 10 }}>Saisie manuelle</Txt></Tap>
            </Row>
          </Animated.View>
        ) : null}
        {stockSaleActive ? (
          <>
            <View style={styles.stockSalePanel}>
              <Txt weight="medium" style={styles.fieldLabel}>Article vendu</Txt>
              <View style={styles.inputBox}>
                <Icon icon={Search} size={16} color={c.surface400} />
                <TextInput
                  value={stockSearchQuery}
                  onChangeText={setStockSearchQuery}
                  placeholder="Sélectionner un article..."
                  placeholderTextColor={c.surface400}
                  autoCapitalize="none"
                  maxFontSizeMultiplier={inputTextMaxScale}
                  style={styles.textInput}
                />
              </View>
              <View style={styles.stockSaleList}>
                {stockSearchResults.map((item) => {
                  const selected = item.id === selectedStockId;
                  const outOfStock = item.quantity <= 0;
                  return (
                    <Tap
                      key={item.id}
                      disabled={outOfStock}
                      onPress={() => setSelectedStockId(item.id)}
                      style={[styles.stockSaleOption, selected && styles.stockSaleOptionSelected, outOfStock && styles.stockSaleOptionDisabled]}
                    >
                      <Row style={{ justifyContent: 'space-between', gap: 10 }}>
                        <View style={{ flex: 1, minWidth: 0 }}>
                          <Txt weight="bold" numberOfLines={1} style={{ color: outOfStock ? c.surface400 : c.surface800, fontSize: 12 }}>{item.name}</Txt>
                          <Txt style={{ color: outOfStock ? c.surface400 : c.surface500, fontSize: 11, marginTop: 2 }}>Stock: {item.quantity} unités</Txt>
                        </View>
                        <Pill tone={outOfStock ? 'surface' : selected ? 'green' : 'blue'}>{outOfStock ? 'Rupture de stock' : formatStockPrice(item)}</Pill>
                      </Row>
                    </Tap>
                  );
                })}
                {stockSearchResults.length === 0 ? (
                  <View style={styles.stockSaleOptionDisabled}>
                    <Txt style={{ color: c.surface500, fontSize: 12, textAlign: 'center' }}>Aucun article trouvé.</Txt>
                  </View>
                ) : null}
              </View>
              {stockError && !stockQuantityError ? <Txt style={{ color: c.danger600, fontSize: 10, marginTop: 5 }}>{stockError}</Txt> : null}
            </View>
            <Field label="Quantité vendue" value={quantitySold} onChangeText={setQuantitySold} placeholder="1" keyboardType="numeric" error={stockQuantityError || undefined} />
            {selectedStockItem?.priceType === 'range' ? (
              <View style={{ gap: 6 }}>
                <Field
                  label="Prix de vente unitaire (FCFA)"
                  value={rangeSaleUnitPrice}
                  onChangeText={setRangeSaleUnitPrice}
                  placeholder={`Ex: 1800 FCFA (estimé entre ${formatFCFA(selectedStockItem.minPrice ?? 0).replace(' FCFA', '')} et ${formatFCFA(selectedStockItem.maxPrice ?? 0)})`}
                  keyboardType="numeric"
                />
                <Txt style={{ color: c.surface500, fontSize: 11 }}>Fourchette enregistrée: {formatFCFA(selectedStockItem.minPrice ?? 0).replace(' FCFA', '')} - {formatFCFA(selectedStockItem.maxPrice ?? 0)}</Txt>
              </View>
            ) : null}
            {selectedStockItem?.priceType === 'fixed' ? (
              <Row style={styles.autoCalcHint}>
                <Icon icon={Lock} size={13} color={c.info700} />
                <Txt weight="bold" style={{ color: c.info700, fontSize: 11 }}>Calculé automatiquement: {formatFCFA(getStockUnitEstimate(selectedStockItem))} × quantité</Txt>
              </Row>
            ) : null}
            <Field
              label="Montant (FCFA)"
              value={amount}
              onChangeText={() => undefined}
              placeholder="0"
              keyboardType="numeric"
              large
              editable={false}
              right={<Row style={styles.lockedFieldBadge}><Icon icon={Lock} size={12} color={c.info700} /><Txt weight="black" style={{ color: c.info700, fontSize: 9 }}>Calculé automatiquement</Txt></Row>}
            />
            <Field label="Description" value={desc} onChangeText={setDesc} placeholder="Vente de ..." />
            <Field label="Date" value={transactionDate} onChangeText={setTransactionDate} placeholder="YYYY-MM-DD" />
          </>
        ) : (
          <>
            <Field label="Montant (FCFA)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" large />
            <Field label="Description" value={desc} onChangeText={setDesc} placeholder="Ex: Vente de tissus" />
            <Field label="Date" value={transactionDate} onChangeText={setTransactionDate} placeholder="YYYY-MM-DD" />
            <View>
              <Txt weight="medium" style={styles.fieldLabel}>Catégorie</Txt>
              <View style={styles.chipWrapLeft}>
                {categories.map((cat) => (
                  <Tap key={cat} onPress={() => setCategory(cat)} style={[styles.selectChip, category === cat && (isExpense ? styles.selectChipExpenseActive : styles.selectChipActive)]}>
                    <Row style={{ gap: 6 }}>
                      {category === cat ? <View style={[styles.tinyDot, { backgroundColor: flowAccent }]} /> : null}
                      <Txt weight="medium" style={{ color: category === cat ? flowAccent : c.surface600, fontSize: 12 }}>{cat}</Txt>
                    </Row>
                  </Tap>
                ))}
              </View>
            </View>
          </>
        )}
        <View>
          <Txt weight="medium" style={styles.fieldLabel}>Mode de paiement</Txt>
          <Grid columns={3} gap={8}>
            {paymentMethods.map((m) => (
              <Tap key={m.label} onPress={() => setMethod(m.label)} style={[styles.choiceCard, method === m.label && (isExpense ? styles.choiceSelectedExpense : styles.choiceSelected)]}>
                {getMobileMoneyProvider(m.label) ? (
                  <MobileMoneyIcon method={m.label} size={32} containerStyle={[styles.choiceIcon, styles.mobileMoneyChoiceIcon, method === m.label && { borderColor: flowAccent }]} />
                ) : (
                  <View style={[styles.choiceIcon, { backgroundColor: method === m.label ? flowSoft : c.surface50 }]}>
                    <Icon icon={m.icon} size={16} color={method === m.label ? flowAccent : c.surface500} />
                  </View>
                )}
                <Txt weight="medium" style={{ color: method === m.label ? flowAccent : c.surface600, fontSize: 11, textAlign: 'center' }}>{m.label}</Txt>
              </Tap>
            ))}
          </Grid>
        </View>
        <View style={styles.addTransactionActions}>
          <PrimaryButton label="Saisie vocale Mosika AI" icon={Mic} onPress={openVoice} style={styles.formActionButton} />
          <PrimaryButton label="Scanner ticket, document ou reçu" tone="outline" icon={ScanLine} onPress={openScanner} style={styles.formActionButton} />
          <PrimaryButton label={isExpense ? 'Enregistrer la dépense' : 'Enregistrer le revenu'} tone={isExpense ? 'danger' : 'green'} icon={Check} onPress={handleSave} style={styles.formActionButton} />
        </View>
      </View>
    </ScreenWrapper>
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

function formatFCFA(value: number) {
  return `${Math.round(value).toLocaleString('fr-FR')} FCFA`;
}

function formatCompactFCFA(value: number) {
  const abs = Math.abs(value);
  if (abs >= 1000000) return `${(value / 1000000).toFixed(abs >= 10000000 ? 0 : 1)}M`;
  if (abs >= 1000) return `${Math.round(value / 1000)}K`;
  return Math.round(value).toLocaleString('fr-FR');
}

type AvatarStyle = 'short' | 'bob' | 'curly' | 'wrap' | 'waves' | 'fade';
type ProfileAvatar = { id: string; label: string; group: 'Women' | 'Men' | 'Neutral'; skin: string; hair: string; accent: string; suit: string; style: AvatarStyle };

const profileAvatars: ProfileAvatar[] = [
  { id: 'avatar-01', label: 'Amina', group: 'Women', skin: '#8d5524', hair: '#1f2937', accent: '#10b981', suit: '#064e3b', style: 'wrap' },
  { id: 'avatar-02', label: 'Claire', group: 'Women', skin: '#c68642', hair: '#111827', accent: '#38bdf8', suit: '#0f172a', style: 'bob' },
  { id: 'avatar-03', label: 'Nadia', group: 'Women', skin: '#f1c27d', hair: '#4b2e1f', accent: '#f59e0b', suit: '#115e59', style: 'waves' },
  { id: 'avatar-04', label: 'Fatou', group: 'Women', skin: '#5c3317', hair: '#0f172a', accent: '#a78bfa', suit: '#312e81', style: 'curly' },
  { id: 'avatar-05', label: 'Elise', group: 'Women', skin: '#e0ac69', hair: '#78350f', accent: '#fb7185', suit: '#7f1d1d', style: 'bob' },
  { id: 'avatar-06', label: 'Mireille', group: 'Women', skin: '#9f7042', hair: '#1e1b4b', accent: '#14b8a6', suit: '#134e4a', style: 'wrap' },
  { id: 'avatar-07', label: 'Jonas', group: 'Men', skin: '#8d5524', hair: '#111827', accent: '#0ea5e9', suit: '#0f172a', style: 'short' },
  { id: 'avatar-08', label: 'Daniel', group: 'Men', skin: '#c68642', hair: '#1f2937', accent: '#10b981', suit: '#064e3b', style: 'fade' },
  { id: 'avatar-09', label: 'Yves', group: 'Men', skin: '#f1c27d', hair: '#3f2a1d', accent: '#f59e0b', suit: '#78350f', style: 'short' },
  { id: 'avatar-10', label: 'Malik', group: 'Men', skin: '#5c3317', hair: '#020617', accent: '#6366f1', suit: '#1e1b4b', style: 'fade' },
  { id: 'avatar-11', label: 'Samuel', group: 'Men', skin: '#e0ac69', hair: '#422006', accent: '#ef4444', suit: '#7f1d1d', style: 'curly' },
  { id: 'avatar-12', label: 'Noah', group: 'Men', skin: '#9f7042', hair: '#171717', accent: '#22c55e', suit: '#14532d', style: 'short' },
  { id: 'avatar-13', label: 'Sage', group: 'Neutral', skin: '#b77c52', hair: '#111827', accent: '#06b6d4', suit: '#164e63', style: 'waves' },
  { id: 'avatar-14', label: 'Morgan', group: 'Neutral', skin: '#7c4a2d', hair: '#0f172a', accent: '#84cc16', suit: '#365314', style: 'curly' },
  { id: 'avatar-15', label: 'Alex', group: 'Neutral', skin: '#f3c99b', hair: '#57534e', accent: '#a855f7', suit: '#581c87', style: 'short' },
  { id: 'avatar-16', label: 'Rene', group: 'Neutral', skin: '#6b3f25', hair: '#1c1917', accent: '#f97316', suit: '#7c2d12', style: 'wrap' },
  { id: 'avatar-17', label: 'Iris', group: 'Women', skin: '#d6a06f', hair: '#581c87', accent: '#06b6d4', suit: '#0e7490', style: 'waves' },
  { id: 'avatar-18', label: 'Grace', group: 'Women', skin: '#4a2414', hair: '#111827', accent: '#f43f5e', suit: '#881337', style: 'curly' },
  { id: 'avatar-19', label: 'Kevin', group: 'Men', skin: '#b7794f', hair: '#0f172a', accent: '#22c55e', suit: '#166534', style: 'fade' },
  { id: 'avatar-20', label: 'Eric', group: 'Men', skin: '#f0b879', hair: '#713f12', accent: '#3b82f6', suit: '#1d4ed8', style: 'short' },
];

const coverThemes = [
  { id: 'emerald', label: 'Emerald', colors: [c.formalio900, c.formalio700] as const },
  { id: 'midnight', label: 'Midnight', colors: ['#111827', '#334155'] as const },
  { id: 'gold', label: 'Gold', colors: ['#78350f', '#d97706'] as const },
  { id: 'indigo', label: 'Indigo', colors: ['#312e81', '#2563eb'] as const },
];

function getProfileAvatar(id?: string) {
  return profileAvatars.find((avatar) => avatar.id === id) ?? profileAvatars[0];
}

function getCoverTheme(id?: string) {
  return coverThemes.find((theme) => theme.id === id) ?? coverThemes[0];
}

function BuiltInAvatar({ avatarId, size = 72, selected = false }: { avatarId?: string; size?: number; selected?: boolean }) {
  const avatar = getProfileAvatar(avatarId);
  const hairY = avatar.style === 'wrap' ? 19 : avatar.style === 'bob' ? 18 : avatar.style === 'curly' ? 16 : 21;
  return (
    <View style={{ width: size, height: size }}>
      <Svg width={size} height={size} viewBox="0 0 100 100">
        <Defs>
          <SvgLinearGradient id={`avatar-bg-${avatar.id}`} x1="0" y1="0" x2="1" y2="1">
            <Stop offset="0" stopColor={avatar.accent} stopOpacity="0.95" />
            <Stop offset="1" stopColor={avatar.suit} stopOpacity="1" />
          </SvgLinearGradient>
        </Defs>
        <Circle cx="50" cy="50" r="48" fill={`url(#avatar-bg-${avatar.id})`} />
        <Circle cx="50" cy="43" r="21" fill={avatar.skin} />
        {avatar.style === 'wrap' ? <Rect x="27" y="14" width="46" height="22" rx="11" fill={avatar.hair} /> : null}
        {avatar.style === 'curly' ? <Circle cx="34" cy="24" r="10" fill={avatar.hair} /> : null}
        {avatar.style === 'curly' ? <Circle cx="50" cy="19" r="12" fill={avatar.hair} /> : null}
        {avatar.style === 'curly' ? <Circle cx="66" cy="24" r="10" fill={avatar.hair} /> : null}
        {avatar.style !== 'wrap' && avatar.style !== 'curly' ? <Rect x={avatar.style === 'bob' ? 27 : 32} y={hairY} width={avatar.style === 'bob' ? 46 : 36} height={avatar.style === 'fade' ? 15 : 18} rx={avatar.style === 'bob' ? 16 : 9} fill={avatar.hair} /> : null}
        {avatar.style === 'bob' || avatar.style === 'waves' ? <Rect x="25" y="32" width="10" height="25" rx="5" fill={avatar.hair} /> : null}
        {avatar.style === 'bob' || avatar.style === 'waves' ? <Rect x="65" y="32" width="10" height="25" rx="5" fill={avatar.hair} /> : null}
        <Circle cx="42" cy="43" r="2.4" fill="#111827" opacity="0.9" />
        <Circle cx="58" cy="43" r="2.4" fill="#111827" opacity="0.9" />
        <Rect x="43" y="54" width="14" height="4" rx="2" fill="#7f1d1d" opacity="0.5" />
        <Rect x="28" y="68" width="44" height="26" rx="15" fill={avatar.suit} />
        <Rect x="44" y="66" width="12" height="22" rx="6" fill={avatar.skin} />
        <Rect x="36" y="72" width="28" height="5" rx="2.5" fill={avatar.accent} />
        {selected ? <Circle cx="78" cy="22" r="10" fill={c.white} /> : null}
        {selected ? <SvgText x="78" y="26" textAnchor="middle" fontSize="13" fill={c.formalio700} fontWeight="900">✓</SvgText> : null}
      </Svg>
    </View>
  );
}

function transactionMonthKey(date: string) {
  return date.slice(0, 7);
}

function monthLabel(date: Date) {
  return date.toLocaleDateString('fr-FR', { month: 'short' }).replace('.', '');
}

function calculateProfileCompletion(profile: BusinessProfile) {
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

function calculateLocalFinancialMetrics(transactions: Transaction[], profile = defaultBusinessProfile, reportCount = 0, documentCount = 0): CloudFinancialMetrics {
  const revenue = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const expenses = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
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
    const expense = monthTransactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
    return { date: `${month.key}-01`, label: month.label, income, expense, net: income - expense };
  });
  const currentMonth = monthly[monthly.length - 1]?.income ?? 0;
  const previousMonth = monthly[monthly.length - 2]?.income ?? 0;
  const growthRate = previousMonth ? ((currentMonth - previousMonth) / previousMonth) * 100 : currentMonth > 0 ? 100 : 0;
  const byCategory = new Map<string, { name: string; type: 'income' | 'expense'; amount: number }>();
  transactions.forEach((transaction) => {
    const key = `${transaction.type}:${transaction.category || 'Autres'}`;
    const current = byCategory.get(key) ?? { name: transaction.category || 'Autres', type: transaction.type, amount: 0 };
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
  const maturityCap = transactions.length === 0 ? 0 : mosikaMaturityCap(activeMonths, observedDays, incomeTransactions.length, transactions.filter((t) => t.type === 'expense').length);
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
    balance: profit,
    cashFlow: profit,
    profitMargin: revenue ? Math.round((profit / revenue) * 10000) / 100 : 0,
    taxCollected: Math.round(revenue * 0.1925),
    taxDeductible: Math.round(expenses * 0.1925),
    taxDue: Math.max(0, Math.round((revenue - expenses) * 0.1925)),
    transactionCount: transactions.length,
    revenueCount: incomeTransactions.length,
    expenseCount: transactions.filter((t) => t.type === 'expense').length,
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
      ...(transactions.filter((t) => t.type === 'expense').length === 0 ? ['Ajoutez au moins une depense reelle'] : []),
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

const backendReportTypeFor = (type: ReportType): BackendReportType => {
  if (type === 'compte-resultat') return 'resultat';
  if (type === 'tresorerie') return 'cashflow';
  return type;
};

function ReportsScreen({ shellProps, openDownload, loanRequests, metrics, transactions }: { shellProps: ShellProps; openDownload: (title: string, period: string, type?: BackendReportType) => void; loanRequests: LoanRequestRecord[]; metrics: CloudFinancialMetrics; transactions: Transaction[] }) {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanRequestRecord | null>(null);
  const hasFinancialData = transactions.length > 0;
  const titleMap = {
    bilan: 'Bilan Comptable',
    'compte-resultat': 'Compte de Résultat',
    tresorerie: 'Flux de Trésorerie',
    tva: 'Déclaration TVA',
  } as const;
  if (selectedReport) {
    return (
      <ScreenWrapper {...shellProps} title={titleMap[selectedReport]}>
        <Tap onPress={() => setSelectedReport(null)} style={{ marginBottom: 12 }}>
          <Row style={{ gap: 4 }}>
            <Icon icon={ArrowLeft} size={13} color={c.formalio700} />
            <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12 }}>Retour aux rapports</Txt>
          </Row>
        </Tap>
        <ReportIntelligenceDeck type={selectedReport} metrics={metrics} />
        <SYSCOHADAReport type={selectedReport} period={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })} metrics={metrics} />
        <ReportExportPanel
          title={titleMap[selectedReport]}
          period={new Date().toLocaleDateString('fr-FR', { month: 'long', year: 'numeric' })}
          type={backendReportTypeFor(selectedReport)}
          canExport={!metrics.emptyState && metrics.transactionCount > 0}
          requirements={metrics.minimumDataRequired}
          onExport={openDownload}
        />
      </ScreenWrapper>
    );
  }
  if (selectedLoan) {
    return (
      <ScreenWrapper {...shellProps} title="Loan request">
        <Tap onPress={() => setSelectedLoan(null)} style={{ marginBottom: 12 }}>
          <Row style={{ gap: 4 }}>
            <Icon icon={ArrowLeft} size={13} color={c.formalio700} />
            <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12 }}>Back to reports</Txt>
          </Row>
        </Tap>
        <LoanRequestDetail request={selectedLoan} />
      </ScreenWrapper>
    );
  }
  return (
    <ScreenWrapper {...shellProps} title="Rapports">
      <LinearGradient colors={[c.formalio800, c.formalio900]} style={styles.reportHero}>
        <Row style={{ gap: 12, marginBottom: 8 }}>
          <View style={styles.glassIconSmall}><Icon icon={FileText} size={20} color={c.formalio300} /></View>
          <View>
            <Txt weight="semibold" style={{ color: c.white, fontSize: 14 }}>Rapports OHADA</Txt>
            <Txt style={{ color: 'rgba(255,255,255,.7)', fontSize: 12 }}>Conforme SYSCOHADA 2017</Txt>
          </View>
        </Row>
        <Txt style={{ color: 'rgba(255,255,255,.7)', fontSize: 12, lineHeight: 17 }}>Générez des rapports comptables officiels en un clic, prêts pour l'audit.</Txt>
      </LinearGradient>
      <LoanTrackingSection requests={loanRequests} onSelect={setSelectedLoan} />
      <ReportPortfolioSummary metrics={metrics} />
      <Txt weight="bold" style={{ fontSize: 14, marginBottom: 10 }}>Documents intelligents</Txt>
      <View style={{ gap: 12 }}>
        {[
          { title: 'Bilan Comptable', type: 'bilan' as const, date: hasFinancialData ? 'Période courante' : 'Aucune donnée', status: hasFinancialData ? 'ready' : 'empty', icon: FileSpreadsheet, tone: 'blue', desc: 'Actif, passif et capitaux propres' },
          { title: 'Compte de Résultat', type: 'compte-resultat' as const, date: hasFinancialData ? 'Période courante' : 'Aucune donnée', status: hasFinancialData ? 'ready' : 'empty', icon: Calculator, tone: 'green', desc: 'Revenus, charges et marge nette' },
          { title: 'Flux de Trésorerie', type: 'tresorerie' as const, date: hasFinancialData ? 'Période courante' : 'Aucune donnée', status: hasFinancialData ? 'ready' : 'empty', icon: Wallet, tone: 'green', desc: 'Cash opérationnel et variation nette' },
          { title: 'Déclaration TVA', type: 'tva' as const, date: hasFinancialData ? 'Période courante' : 'Aucune donnée', status: hasFinancialData ? 'ready' : 'empty', icon: Receipt, tone: 'amber', desc: 'TVA collectée, déductible et solde' },
        ].map((report) => (
          <Tap key={report.title} onPress={() => setSelectedReport(report.type)} style={styles.reportTap}>
            <View style={styles.reportRow}>
            <ToneIcon icon={report.icon} tone={report.tone as any} />
            <View style={styles.reportRowBody}>
              <Txt weight="medium" numberOfLines={1} style={{ fontSize: 13 }}>{report.title}</Txt>
              <Txt numberOfLines={1} style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>{report.desc}</Txt>
              <Txt style={{ color: c.surface400, fontSize: 10, marginTop: 4 }}>{report.date}</Txt>
            </View>
            <Row style={styles.reportRowAction}>
              {report.status === 'ready' ? <Pill style={styles.reportBadge}>Prêt</Pill> : <Pill tone="gold" style={styles.reportBadge}>Vide</Pill>}
              <Icon icon={ChevronRight} size={16} color={c.surface400} />
            </Row>
            </View>
          </Tap>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const loanStatusStages: { key: LoanStatusStage; label: string; icon: LucideIcon }[] = [
  { key: 'submitted', label: 'Soumise', icon: Send },
  { key: 'under-review', label: 'En revue', icon: Eye },
  { key: 'risk-assessment', label: 'Risk Assessment', icon: Shield },
  { key: 'pending-documents', label: 'Documents requis', icon: FileText },
  { key: 'approved', label: 'Approuvée', icon: CheckCircle2 },
  { key: 'rejected', label: 'Rejected', icon: AlertTriangle },
  { key: 'disbursed', label: 'Disbursed', icon: Wallet },
];

function LoanTrackingSection({ requests, onSelect }: { requests: LoanRequestRecord[]; onSelect: (request: LoanRequestRecord) => void }) {
  return (
    <View style={{ marginBottom: 16 }}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 10 }}>
        <View>
          <Txt weight="black" style={{ fontSize: 14 }}>Loan request tracking</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>Follow lending partner review progress.</Txt>
        </View>
        {requests.length ? <Pill tone="blue">{requests.length} active</Pill> : null}
      </Row>
      {requests.length === 0 ? (
        <View style={styles.loanEmptyState}>
          <View style={[styles.metricIcon, { backgroundColor: c.gold50 }]}><Icon icon={CreditCard} size={16} color={c.gold700} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight="bold" style={{ fontSize: 12 }}>No submitted loan requests yet</Txt>
            <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, marginTop: 3 }}>Once you submit a Score Mosika loan request, its progress timeline appears here automatically.</Txt>
          </View>
        </View>
      ) : (
        <View style={{ gap: 10 }}>
          {requests.map((request) => <LoanRequestCard key={request.id} request={request} onPress={() => onSelect(request)} />)}
        </View>
      )}
    </View>
  );
}

function LoanRequestCard({ request, onPress }: { request: LoanRequestRecord; onPress: () => void }) {
  const meta = getLoanStatusMeta(request.status);
  const progress = loanProgressForStatus(request.status);
  return (
    <Tap onPress={onPress} style={styles.loanTrackingCard}>
      <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
        <View style={{ flex: 1 }}>
          <Txt weight="black" style={{ fontSize: 13 }}>{request.id}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>{formatFCFA(request.amount)} · {request.duration} months · {request.purpose}</Txt>
        </View>
        <LoanStatusBadge status={request.status} />
      </Row>
      <ValueBar value={progress} color={meta.color} />
      <Row style={{ justifyContent: 'space-between', marginTop: 9 }}>
        <Txt style={{ color: c.surface500, fontSize: 10 }}>{new Date(request.requestedAt).toLocaleDateString('fr-FR')}</Txt>
        <Txt weight="bold" style={{ color: meta.color, fontSize: 10 }}>Revue {request.expectedReviewDuration}</Txt>
      </Row>
      <Row style={{ gap: 7, marginTop: 10 }}>
        <Icon icon={Bell} size={13} color={request.notificationCount ? c.gold700 : c.surface400} />
        <Txt numberOfLines={1} style={{ color: c.surface600, fontSize: 11, flex: 1 }}>{request.nextAction}</Txt>
        <Icon icon={ChevronRight} size={15} color={c.surface400} />
      </Row>
    </Tap>
  );
}

function LoanRequestDetail({ request }: { request: LoanRequestRecord }) {
  const currentIndex = loanStatusStages.findIndex((stage) => stage.key === request.status);
  return (
    <View style={{ gap: 12 }}>
      <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.loanDetailHero}>
        <Row style={{ justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt style={{ color: c.formalio200, fontSize: 11 }}>Loan request</Txt>
            <Txt weight="black" style={{ color: c.white, fontSize: 24, marginTop: 3 }}>{formatFCFA(request.amount)}</Txt>
            <Txt style={{ color: c.formalio200, fontSize: 11, marginTop: 4 }}>{request.id} · Soumise {new Date(request.requestedAt).toLocaleDateString('fr-FR')}</Txt>
          </View>
          <LoanStatusBadge status={request.status} />
        </Row>
        <View style={{ marginTop: 14 }}><ValueBar value={loanProgressForStatus(request.status)} color={getLoanStatusMeta(request.status).color} track="rgba(255,255,255,.16)" /></View>
      </LinearGradient>
      <Grid columns={2} gap={10}>
        <ReportMetricCard label="Approval signal" value={`${request.approvalProbability}%`} detail="AI probability" icon={Sparkles} tone="blue" />
        <ReportMetricCard label="Strength index" value={`${request.borrowingStrengthIndex}%`} detail="cash behavior" icon={Award} tone="green" />
        <ReportMetricCard label="Total repayment" value={`${Math.round(request.totalRepayment / 1000)}K`} detail="FCFA estimate" icon={Wallet} tone="green" />
        <ReportMetricCard label="Temps de revue" value={request.expectedReviewDuration} detail="estimé" icon={RefreshCw} tone="amber" />
      </Grid>
      <Card style={{ padding: 14 }}>
        <Txt weight="black" style={{ fontSize: 13, marginBottom: 10 }}>Approval timeline</Txt>
        {loanStatusStages.map((stage, index) => {
          const active = index <= currentIndex;
          const rejected = request.status === 'rejected' && stage.key === 'rejected';
          const color = active ? getLoanStatusMeta(rejected ? 'rejected' : stage.key).color : c.surface300;
          return (
            <Row key={stage.key} style={styles.loanTimelineRow}>
              <View style={[styles.loanTimelineNode, { backgroundColor: active ? color : c.surface100 }]}>
                <Icon icon={stage.icon} size={13} color={active ? c.white : c.surface400} />
              </View>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" style={{ color: active ? c.surface900 : c.surface400, fontSize: 12 }}>{stage.label}</Txt>
                <Txt style={{ color: c.surface500, fontSize: 10, marginTop: 2 }}>{active ? (index === currentIndex ? 'Current stage' : 'Completed') : 'Upcoming'}</Txt>
              </View>
            </Row>
          );
        })}
      </Card>
    </View>
  );
}

function LoanStatusBadge({ status }: { status: LoanStatusStage }) {
  const meta = getLoanStatusMeta(status);
  return (
    <View style={[styles.loanStatusBadge, { backgroundColor: meta.bg }]}>
      <View style={[styles.tinyDot, { backgroundColor: meta.color }]} />
      <Txt weight="black" style={{ color: meta.color, fontSize: 10 }}>{meta.label}</Txt>
    </View>
  );
}

function getLoanStatusMeta(status: LoanStatusStage) {
  const map = {
    submitted: { label: 'Soumise', color: c.info700, bg: c.info50 },
    'under-review': { label: 'En revue', color: c.info700, bg: c.info50 },
    'risk-assessment': { label: 'Risk Check', color: c.gold700, bg: c.gold50 },
    'pending-documents': { label: 'Docs Needed', color: c.gold700, bg: c.gold50 },
    approved: { label: 'Approuvée', color: c.formalio700, bg: c.formalio50 },
    rejected: { label: 'Rejected', color: c.danger600, bg: c.danger50 },
    disbursed: { label: 'Disbursed', color: c.formalio700, bg: c.formalio50 },
  } satisfies Record<LoanStatusStage, { label: string; color: string; bg: string }>;
  return map[status];
}

function loanProgressForStatus(status: LoanStatusStage) {
  const index = loanStatusStages.findIndex((stage) => stage.key === status);
  return Math.max(8, Math.round(((index + 1) / loanStatusStages.length) * 100));
}

function ReportPortfolioSummary({ metrics }: { metrics: CloudFinancialMetrics }) {
  const empty = metrics.emptyState || metrics.transactionCount === 0;
  return (
    <View style={{ gap: 12, marginBottom: 16 }}>
      <Grid columns={2} gap={10}>
        <ReportMetricCard label="Rapports prêts" value={`${metrics.reportCount}/4`} detail={empty ? 'Aucune génération' : 'Données réelles'} icon={FileText} tone="green" />
        <ReportMetricCard label="Conformité" value={`${metrics.complianceScore}%`} detail="KYC + documents" icon={Shield} tone="blue" />
        <ReportMetricCard label="Cash net" value={formatCompactFCFA(metrics.cashFlow)} detail={`${metrics.growthRate.toFixed(1)}% ce mois`} icon={Wallet} tone={metrics.cashFlow >= 0 ? 'green' : 'red'} />
        <ReportMetricCard label="TVA nette" value={formatCompactFCFA(metrics.taxDue)} detail={metrics.taxDue > 0 ? 'à payer' : 'aucun solde'} icon={Receipt} tone="amber" />
      </Grid>
      <View style={styles.reportInsightCallout}>
        <Icon icon={BrainCircuit} size={17} color={c.formalio700} />
        <View style={{ flex: 1 }}>
          <Txt weight="bold" style={{ color: c.formalio800, fontSize: 12 }}>Synthèse comptable Mosika</Txt>
          <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 3 }}>{empty ? 'Aucun rapport financier n’est généré tant que vos transactions sont vides.' : 'Les documents sont calculés avec vos transactions, ratios, TVA et contrôles de cohérence.'}</Txt>
        </View>
      </View>
    </View>
  );
}

const reportAnalytics: Record<ReportType, {
  headline: string;
  sub: string;
  tone: 'green' | 'amber' | 'blue' | 'red';
  score: number;
  kpis: { label: string; value: string; detail: string; icon: LucideIcon; tone: 'green' | 'amber' | 'blue' | 'red' }[];
  insights: string[];
}> = {
  bilan: {
    headline: 'Structure financière saine',
    sub: 'Liquidité 3.2x, capitaux propres solides, dette court terme maîtrisée.',
    tone: 'blue',
    score: 82,
    kpis: [
      { label: 'Actifs', value: '4.25M', detail: '+9% mois', icon: FileSpreadsheet, tone: 'blue' },
      { label: 'Passifs', value: '1.32M', detail: '31% actifs', icon: TrendingDown, tone: 'amber' },
      { label: 'Capitaux', value: '2.93M', detail: 'équilibre fort', icon: Shield, tone: 'green' },
      { label: 'Liquidité', value: '3.2x', detail: 'très confortable', icon: Wallet, tone: 'green' },
    ],
    insights: ['Les actifs courants couvrent largement les obligations court terme.', 'Le niveau de fonds propres renforce la crédibilité bancaire.', 'Aucune rupture de liquidité détectée sur le mois.'],
  },
  'compte-resultat': {
    headline: 'Rentabilité nette élevée',
    sub: 'Résultat positif porté par les ventes marchandises et des charges stables.',
    tone: 'green',
    score: 88,
    kpis: [
      { label: 'CA', value: '1.24M', detail: '+23% mois', icon: TrendingUp, tone: 'green' },
      { label: 'Charges', value: '420K', detail: '-8% mois', icon: Receipt, tone: 'red' },
      { label: 'Résultat', value: '825K', detail: 'net positif', icon: Calculator, tone: 'green' },
      { label: 'Marge', value: '66%', detail: '+6 pts', icon: BarChart3, tone: 'blue' },
    ],
    insights: ['Les ventes progressent plus vite que les charges opérationnelles.', 'Transport reste le poste à surveiller cette semaine.', 'Le seuil de rentabilité est atteint dès la troisième semaine du mois.'],
  },
  tresorerie: {
    headline: 'Cash flow opérationnel robuste',
    sub: 'Les encaissements couvrent les investissements et renforcent le cash net.',
    tone: 'green',
    score: 79,
    kpis: [
      { label: 'Opérationnel', value: '+845K', detail: 'encaissements', icon: Wallet, tone: 'green' },
      { label: 'Invest.', value: '-125K', detail: 'stock outil', icon: ArrowDownRight, tone: 'red' },
      { label: 'Cash net', value: '+720K', detail: 'variation', icon: TrendingUp, tone: 'green' },
      { label: 'Couverture', value: '18j', detail: 'charges fixes', icon: Shield, tone: 'blue' },
    ],
    insights: ['Le cash opérationnel reste positif malgré l’investissement stock.', 'Les sorties sont concentrées sur trois catégories récurrentes.', 'La réserve disponible couvre presque trois semaines de charges fixes.'],
  },
  tva: {
    headline: 'TVA à payer sous contrôle',
    sub: 'Solde net identifié avec séparation claire collectée / déductible.',
    tone: 'amber',
    score: 74,
    kpis: [
      { label: 'Collectée', value: '239K', detail: 'ventes', icon: TrendingUp, tone: 'green' },
      { label: 'Déductible', value: '80K', detail: 'achats', icon: Receipt, tone: 'blue' },
      { label: 'Net TVA', value: '158K', detail: 'à payer', icon: Calculator, tone: 'amber' },
      { label: 'Échéance', value: '15 Fév', detail: '5 jours', icon: AlertTriangle, tone: 'red' },
    ],
    insights: ['Le solde net est prêt pour revue avant déclaration.', 'Trois justificatifs achats doivent être vérifiés avant export final.', 'Prévoir la trésorerie TVA avant paiement fournisseur principal.'],
  },
};

function ReportIntelligenceDeck({ type, metrics }: { type: ReportType; metrics: CloudFinancialMetrics }) {
  void reportAnalytics[type];
  const empty = metrics.emptyState || metrics.transactionCount === 0;
  const report = {
    bilan: {
      headline: empty ? 'Bilan encore vide' : 'Structure financière calculée',
      sub: empty ? 'Ajoutez des transactions et documents pour produire le bilan.' : `Actifs nets estimés: ${formatFCFA(Math.max(metrics.balance, 0))}, obligations courantes basées sur les charges.`,
      tone: 'blue' as const,
      score: metrics.financialHealth,
      kpis: [
        { label: 'Actifs', value: formatCompactFCFA(Math.max(metrics.balance, 0)), detail: 'cash net estimé', icon: FileSpreadsheet, tone: 'blue' as const },
        { label: 'Passifs', value: formatCompactFCFA(metrics.expenses), detail: 'charges de la période', icon: TrendingDown, tone: 'amber' as const },
        { label: 'Capitaux', value: formatCompactFCFA(metrics.profit), detail: metrics.profit >= 0 ? 'positif' : 'deficit', icon: Shield, tone: metrics.profit >= 0 ? 'green' as const : 'red' as const },
        { label: 'Sante', value: `${metrics.financialHealth}%`, detail: 'score financier', icon: Wallet, tone: 'green' as const },
      ],
      insights: empty ? ['Aucun actif/passif calculé sans transactions.', 'Complétez votre profil et ajoutez vos documents.', 'Le bilan restera à zéro pour un nouvel utilisateur.'] : [`Cash net: ${formatFCFA(metrics.cashFlow)}.`, `Conformité: ${metrics.complianceScore}%.`, `Score Mosika: ${metrics.mosikaScore}.`],
    },
    'compte-resultat': {
      headline: empty ? 'Compte de résultat vide' : metrics.profit >= 0 ? 'Résultat net positif' : 'Résultat net à surveiller',
      sub: empty ? 'Les revenus et charges démarrent à zéro.' : `Revenus ${formatFCFA(metrics.revenue)}, charges ${formatFCFA(metrics.expenses)}, marge ${metrics.profitMargin.toFixed(1)}%.`,
      tone: metrics.profit >= 0 ? 'green' as const : 'red' as const,
      score: metrics.financialHealth,
      kpis: [
        { label: 'CA', value: formatCompactFCFA(metrics.revenue), detail: `${metrics.revenueCount} revenus`, icon: TrendingUp, tone: 'green' as const },
        { label: 'Charges', value: formatCompactFCFA(metrics.expenses), detail: `${metrics.expenseCount} dépenses`, icon: Receipt, tone: 'red' as const },
        { label: 'Résultat', value: formatCompactFCFA(metrics.profit), detail: metrics.profit >= 0 ? 'net positif' : 'net négatif', icon: Calculator, tone: metrics.profit >= 0 ? 'green' as const : 'red' as const },
        { label: 'Marge', value: `${metrics.profitMargin.toFixed(1)}%`, detail: 'période', icon: BarChart3, tone: 'blue' as const },
      ],
      insights: empty ? ['Aucun revenu enregistré.', 'Aucune charge enregistrée.', 'Le résultat net reste à zéro.'] : [`Variation revenus: ${metrics.growthRate.toFixed(1)}%.`, `Ratio charges/revenus: ${metrics.revenue ? Math.round((metrics.expenses / metrics.revenue) * 100) : 0}%.`, 'Les rapports se recalculent après chaque transaction.'],
    },
    tresorerie: {
      headline: empty ? 'Flux de trésorerie vide' : metrics.cashFlow >= 0 ? 'Cash flow opérationnel positif' : 'Cash flow opérationnel négatif',
      sub: empty ? 'Aucun encaissement ou décaissement pour le moment.' : `Variation nette: ${formatFCFA(metrics.cashFlow)} sur la période.`,
      tone: metrics.cashFlow >= 0 ? 'green' as const : 'red' as const,
      score: metrics.financialHealth,
      kpis: [
        { label: 'Encaissements', value: formatCompactFCFA(metrics.revenue), detail: 'revenus', icon: Wallet, tone: 'green' as const },
        { label: 'Décaissements', value: formatCompactFCFA(metrics.expenses), detail: 'sorties', icon: ArrowDownRight, tone: 'red' as const },
        { label: 'Cash net', value: formatCompactFCFA(metrics.cashFlow), detail: 'variation', icon: TrendingUp, tone: metrics.cashFlow >= 0 ? 'green' as const : 'red' as const },
        { label: 'Transactions', value: String(metrics.transactionCount), detail: 'période', icon: Shield, tone: 'blue' as const },
      ],
      insights: empty ? ['Aucun flux détecté.', 'Ajoutez revenus et dépenses pour visualiser la trésorerie.', 'Les graphiques resteront neutres jusque-là.'] : [`Cash flow: ${formatFCFA(metrics.cashFlow)}.`, `Dépenses: ${formatFCFA(metrics.expenses)}.`, `Revenus: ${formatFCFA(metrics.revenue)}.`],
    },
    tva: {
      headline: empty ? 'TVA non calculée' : 'TVA calculée depuis les transactions',
      sub: empty ? 'Aucune TVA sans revenus ou charges.' : `Collectée ${formatFCFA(metrics.taxCollected)}, déductible ${formatFCFA(metrics.taxDeductible)}.`,
      tone: 'amber' as const,
      score: metrics.taxDue > 0 ? Math.min(100, Math.max(30, metrics.financialHealth)) : 0,
      kpis: [
        { label: 'Collectée', value: formatCompactFCFA(metrics.taxCollected), detail: 'ventes', icon: TrendingUp, tone: 'green' as const },
        { label: 'Déductible', value: formatCompactFCFA(metrics.taxDeductible), detail: 'achats', icon: Receipt, tone: 'blue' as const },
        { label: 'Net TVA', value: formatCompactFCFA(metrics.taxDue), detail: metrics.taxDue > 0 ? 'à payer' : 'zéro', icon: Calculator, tone: 'amber' as const },
        { label: 'Docs', value: String(metrics.documentCount), detail: 'justificatifs', icon: AlertTriangle, tone: metrics.documentCount ? 'blue' as const : 'red' as const },
      ],
      insights: empty ? ['Aucun solde TVA pour un nouveau compte.', 'Les justificatifs augmenteront la précision.', 'La déclaration se préparera avec les transactions réelles.'] : [`TVA nette: ${formatFCFA(metrics.taxDue)}.`, `TVA collectée: ${formatFCFA(metrics.taxCollected)}.`, `TVA déductible: ${formatFCFA(metrics.taxDeductible)}.`],
    },
  }[type];
  const palette = report.tone === 'amber' ? [c.gold50, c.gold600] : report.tone === 'blue' ? [c.info50, c.info600] : [c.formalio50, c.formalio700];
  return (
    <View style={{ gap: 12, marginBottom: 14 }}>
      <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.reportDetailHero}>
        <Row style={{ justifyContent: 'space-between', gap: 12 }}>
          <View style={{ flex: 1 }}>
            <Txt weight="black" style={{ color: c.white, fontSize: 20 }}>{report.headline}</Txt>
            <Txt style={{ color: c.formalio200, fontSize: 11, lineHeight: 16, marginTop: 6 }}>{report.sub}</Txt>
          </View>
          <View style={styles.reportScoreRing}>
            <Txt weight="black" style={{ color: c.white, fontSize: 18 }}>{report.score}</Txt>
            <Txt style={{ color: c.formalio200, fontSize: 9 }}>score</Txt>
          </View>
        </Row>
        <View style={{ marginTop: 14 }}>
          <ValueBar value={report.score} color={palette[1]} track="rgba(255,255,255,.16)" />
        </View>
      </LinearGradient>
      <Grid columns={2} gap={10}>
        {report.kpis.map((kpi) => <ReportMetricCard key={kpi.label} {...kpi} />)}
      </Grid>
      <Card style={{ padding: 14 }}>
        <Row style={{ gap: 7, marginBottom: 10 }}>
          <Icon icon={Sparkles} size={16} color={c.formalio700} />
          <Txt weight="bold" style={{ fontSize: 12 }}>Insights avant export</Txt>
        </Row>
        {report.insights.map((insight) => (
          <Row key={insight} style={{ alignItems: 'flex-start', gap: 8, marginTop: 7 }}>
            <View style={[styles.tinyDot, { backgroundColor: palette[1], marginTop: 5 }]} />
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, flex: 1 }}>{insight}</Txt>
          </Row>
        ))}
      </Card>
    </View>
  );
}

function ReportMetricCard({ label, value, detail, icon, tone }: { label: string; value: string; detail: string; icon: LucideIcon; tone: 'green' | 'amber' | 'blue' | 'red' }) {
  const palette = tone === 'green' ? [c.formalio50, c.formalio700] : tone === 'amber' ? [c.gold50, c.gold600] : tone === 'red' ? [c.danger50, c.danger600] : [c.info50, c.info600];
  return (
    <Card style={styles.reportMetricCard}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
        <View style={[styles.metricIcon, { backgroundColor: palette[0] }]}><Icon icon={icon} size={15} color={palette[1]} /></View>
        <View style={[styles.reportMetricAccent, { backgroundColor: palette[1] }]} />
      </Row>
      <Txt style={{ color: c.surface500, fontSize: 10 }}>{label}</Txt>
      <Txt weight="black" style={{ color: tone === 'red' ? c.danger600 : c.surface900, fontSize: 18, marginTop: 2 }}>{value}</Txt>
      <Txt numberOfLines={1} style={{ color: c.surface400, fontSize: 10, marginTop: 2 }}>{detail}</Txt>
    </Card>
  );
}

function ReportExportPanel({
  title,
  period,
  type,
  canExport,
  requirements,
  onExport,
}: {
  title: string;
  period: string;
  type: BackendReportType;
  canExport: boolean;
  requirements: string[];
  onExport: (title: string, period: string, type?: BackendReportType) => void;
}) {
  return (
    <Card style={styles.reportExportPanel}>
      <Row style={{ justifyContent: 'space-between', gap: 12, marginBottom: 12 }}>
        <View style={{ flex: 1 }}>
          <Txt weight="bold" style={{ fontSize: 14 }}>Export sécurisé</Txt>
          <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, marginTop: 3 }}>PDF signé ou Excel structuré avec période, contrôles et annexes de calcul.</Txt>
        </View>
        <View style={styles.exportBadge}><Icon icon={Download} size={16} color={c.formalio700} /></View>
      </Row>
      <Grid columns={2} gap={10}>
        <View style={styles.exportFormatMini}><Icon icon={FileText} size={16} color={c.danger600} /><Txt weight="bold" style={{ fontSize: 11 }}>PDF audit</Txt></View>
        <View style={styles.exportFormatMini}><Icon icon={FileSpreadsheet} size={16} color={c.formalio700} /><Txt weight="bold" style={{ fontSize: 11 }}>Excel data</Txt></View>
      </Grid>
      {!canExport ? (
        <View style={[styles.infoCallout, { marginTop: 12 }]}>
          <Icon icon={AlertTriangle} size={16} color={c.amber700} />
          <View style={{ flex: 1 }}>
            <Txt weight="bold" style={{ color: c.amber700, fontSize: 12 }}>Données insuffisantes</Txt>
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 3 }}>
              {(requirements.length ? requirements : ['Ajoutez des transactions terminées avant de générer un rapport officiel.']).join(' · ')}
            </Txt>
          </View>
        </View>
      ) : null}
      <PrimaryButton disabled={!canExport} label={canExport ? "Préparer l'export" : 'Export indisponible'} icon={Download} onPress={() => onExport(title, period, type)} style={{ marginTop: 12, minHeight: 46, borderRadius: 14 }} />
    </Card>
  );
}

function SYSCOHADAReport({ type, period, metrics }: { type: ReportType; period: string; metrics: CloudFinancialMetrics }) {
  const title = {
    bilan: 'Bilan Comptable',
    'compte-resultat': 'Compte de Résultat',
    tresorerie: 'Flux de Trésorerie',
    tva: 'Déclaration TVA',
  }[type];
  const rows = type === 'bilan'
    ? [['Actifs courants', Math.max(metrics.balance, 0)], ['Passifs courants', metrics.expenses], ['Capitaux propres', metrics.profit]]
    : type === 'compte-resultat'
      ? [["Chiffre d'affaires", metrics.revenue], ['Charges operationnelles', metrics.expenses], ['Resultat net', metrics.profit]]
      : type === 'tresorerie'
        ? [['Flux operationnel', metrics.cashFlow], ['Encaissements', metrics.revenue], ['Decaissements', -metrics.expenses]]
        : [['TVA collectée', metrics.taxCollected], ['TVA déductible', metrics.taxDeductible], ['Net à payer', metrics.taxDue]];
  return (
    <Card style={styles.reportDocumentCard}>
      <Row style={{ justifyContent: 'space-between', marginBottom: 18 }}>
        <View>
          <Txt style={{ color: c.surface400, fontSize: 11 }}>FORMALIO</Txt>
          <Txt weight="black" style={{ fontSize: 18, marginTop: 2 }}>{title}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 2 }}>{period} · SYSCOHADA</Txt>
        </View>
        <LogoMark size={42} />
      </Row>
      {rows.map(([label, value], i) => {
        const amount = Number(value);
        const outgoing = amount < 0 || String(label).includes('Charges') || String(label).includes('payer') || String(label).includes('Passifs') || String(label).includes('Decaissements');
        const emphasisColor = outgoing ? c.danger600 : i === rows.length - 1 ? c.formalio700 : c.surface900;
        return (
          <Row key={String(label)} style={[styles.reportLine, i === rows.length - 1 && { borderTopWidth: 1, borderTopColor: c.surface200, paddingTop: 12 }]}>
            <Txt weight={i === rows.length - 1 ? 'bold' : 'medium'} style={{ color: c.surface700, fontSize: 13 }}>{label}</Txt>
            <Txt weight="black" style={{ color: emphasisColor, fontSize: 14 }}>{formatFCFA(amount)}</Txt>
          </Row>
        );
      })}
      <View style={styles.reportStamp}>
        <Icon icon={CheckCircle2} size={15} color={c.formalio700} />
        <Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Validé pour revue comptable</Txt>
      </View>
    </Card>
  );
}

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

function ProfileScreen({
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
          <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Txt weight="black" style={{ fontSize: 15 }}>{t('profile.businessProfile')}</Txt>
              <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>{editing ? t('profile.editingHint') : t('profile.detailsHint')}</Txt>
            </View>
            {editing ? (
              <Row style={{ gap: 8 }}>
                <Tap onPress={cancelProfileEdit} disabled={saving} style={styles.profileMiniButton}><Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>{t('common.cancel')}</Txt></Tap>
                <Tap onPress={saveProfile} disabled={saving} style={[styles.profileMiniButton, styles.profileMiniButtonPrimary]}>
                  {saving ? <ActivityIndicator color={c.white} size="small" /> : <Txt weight="bold" style={{ color: c.white, fontSize: 11 }}>{t('common.save')}</Txt>}
                </Tap>
              </Row>
            ) : (
              <Tap onPress={() => setEditing(true)} style={[styles.profileMiniButton, styles.profileMiniButtonPrimary]}>
                <Txt weight="bold" style={{ color: c.white, fontSize: 11 }}>{t('profile.editProfile')}</Txt>
              </Tap>
            )}
          </Row>

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
        <Tap
          onPress={() => {
            showToast({ type: 'info', title: 'Déconnexion', message: 'À bientôt !' });
            setTimeout(logout, 800);
          }}
          style={styles.logoutButton}
        >
          <Icon icon={LogOut} size={16} color={c.danger500} />
          <Txt weight="medium" style={{ color: c.danger500, fontSize: 14 }}>{t('profile.logout')}</Txt>
        </Tap>
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

function getEmailVerificationMeta(status: EmailVerificationStatus) {
  const map = {
    verified: { label: 'Vérifié', title: 'Email vérifié', copy: 'Vos emails de récupération et de sécurité sont actifs.', color: c.formalio700, bg: c.formalio50 },
    sent: { label: 'Code envoyé', title: 'Email de vérification envoyé', copy: 'Entrez le code reçu ou ouvrez le lien dans votre boîte mail.', color: c.info700, bg: c.info50 },
    queued: { label: 'En file', title: 'Vérification en attente', copy: 'Le service email gratuit est occupé. Formalio vous laissera réessayer bientôt.', color: c.gold700, bg: c.gold50 },
    deferred: { label: 'Réessayer plus tard', title: 'Vérification différée', copy: 'Vous pouvez continuer à utiliser Formalio. Réessayez l’envoi dans quelques instants.', color: c.gold700, bg: c.gold50 },
    unverified: { label: 'Non vérifié', title: 'Vérifiez votre email', copy: 'Vous pouvez utiliser Formalio maintenant. La vérification améliore la récupération et la confiance du compte.', color: c.surface600, bg: c.surface50 },
  } satisfies Record<EmailVerificationStatus, { label: string; title: string; copy: string; color: string; bg: string }>;
  return map[status];
}

function EmailVerificationCard({ profile, setProfile, compact }: { profile: BusinessProfile; setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>; compact?: boolean }) {
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

function SettingsScreen({ shellProps, profile, setProfile, onSaveProfile }: { shellProps: ShellProps; profile: BusinessProfile; setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>; onSaveProfile?: (profile: BusinessProfile) => Promise<void> }) {
  const { showToast } = useToast();
  const [toggles, setToggles] = useState({ darkMode: false, notifications: true, offlineSync: true });
  const t = useCallback((key: string, fallback?: string) => translate(profile.language, key, fallback), [profile.language]);
  const emailMeta = getEmailVerificationMeta(profile.emailVerificationStatus);
  const setLanguage = (language: SupportedLanguage) => {
    const nextProfile = { ...profile, language };
    setProfile(nextProfile);
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

function ToneIcon({ icon, tone, spinning }: { icon: LucideIcon; tone: 'green' | 'amber' | 'blue'; spinning?: boolean }) {
  const palette = tone === 'green' ? [c.formalio50, c.formalio700] : tone === 'amber' ? [c.gold50, c.gold600] : [c.info50, c.info600];
  return (
    <View style={[styles.transactionIcon, { backgroundColor: palette[0] }]}>
      <Icon icon={spinning ? RefreshCw : icon} size={16} color={palette[1]} />
    </View>
  );
}

function CapabilityCard({ icon, t, d, tone }: { icon: LucideIcon; t: string; d: string; tone: string }) {
  const palette = tone === 'green' ? [c.formalio50, c.formalio700] : tone === 'amber' ? [c.gold50, c.gold600] : [c.info50, c.info600];
  return (
    <Card style={{ padding: 12 }}>
      <View style={[styles.metricIcon, { backgroundColor: palette[0], marginBottom: 8 }]}><Icon icon={icon} size={16} color={palette[1]} /></View>
      <Txt weight="bold" style={{ fontSize: 11, lineHeight: 15 }}>{t}</Txt>
      <Txt style={{ color: c.surface500, fontSize: 10, marginTop: 3 }}>{d}</Txt>
    </Card>
  );
}

function ThinkingCard() {
  return (
    <Card>
      <Row style={{ gap: 12, marginBottom: 10 }}>
        <AnimatedMascot state="thinking" size={48} />
        <View><Txt weight="bold" style={{ fontSize: 12 }}>Mosika analyse vos données</Txt><Txt style={{ color: c.surface500, fontSize: 10 }}>Transactions, tendances, anomalies...</Txt></View>
      </Row>
      {['Lecture des transactions', 'Calcul des tendances', "Détection d'anomalies", "Génération d'insights"].map((step, i) => (
        <Animated.View key={step} entering={FadeIn.delay(i * 300)} style={{ flexDirection: 'row', gap: 8, alignItems: 'center', marginTop: 6 }}>
          <View style={styles.tinyDot} />
          <Txt style={{ color: c.surface600, fontSize: 11 }}>{step}</Txt>
        </Animated.View>
      ))}
    </Card>
  );
}

type AssistantVoiceMode = 'idle' | 'recording' | 'preview' | 'playing';

function formatAssistantVoiceDuration(seconds: number) {
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`;
}

function RecordingPulse({ active }: { active: boolean }) {
  const pulse = useSharedValue(1);
  useEffect(() => {
    pulse.value = active ? withRepeat(withSequence(withTiming(1.12, { duration: 760 }), withTiming(1, { duration: 760 })), -1, false) : withTiming(1, { duration: 180 });
  }, [active, pulse]);
  const pulseStyle = useAnimatedStyle(() => ({
    opacity: active ? interpolate(pulse.value, [1, 1.12], [0.18, 0.06], Extrapolation.CLAMP) : 0,
    transform: [{ scale: pulse.value }],
  }));
  return <Animated.View pointerEvents="none" style={[styles.voicePulseRing, pulseStyle]} />;
}

function AssistantVoiceNotePanel({
  mode,
  duration,
  error,
  onStop,
  onCancel,
  onReplay,
  onSend,
}: {
  mode: AssistantVoiceMode;
  duration: number;
  error: string;
  onStop: () => void;
  onCancel: () => void;
  onReplay: () => void;
  onSend: () => void;
}) {
  if (mode === 'idle' && !error) return null;
  const recording = mode === 'recording';
  const preview = mode === 'preview' || mode === 'playing';
  return (
    <Animated.View entering={FadeIn.duration(180)} style={styles.voiceNotePanel}>
      {error ? (
        <Row style={{ gap: 8, alignItems: 'flex-start' }}>
          <Icon icon={AlertTriangle} size={16} color={c.danger600} />
          <Txt style={{ color: c.danger600, fontSize: 12, lineHeight: 17, flex: 1 }}>{error}</Txt>
          <Tap onPress={onCancel}><Icon icon={X} size={16} color={c.surface500} /></Tap>
        </Row>
      ) : null}
      {recording ? (
        <View style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <Row style={{ gap: 10 }}>
              <View style={styles.recordingMicWrap}>
                <RecordingPulse active />
                <View style={styles.recordingMic}><Icon icon={Mic} size={18} color={c.white} /></View>
              </View>
              <View>
                <Txt weight="black" style={{ color: c.surface900, fontSize: 13 }}>Recording voice note</Txt>
                <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>Tap stop when you are finished.</Txt>
              </View>
            </Row>
            <Txt weight="black" style={{ color: c.formalio700, fontSize: 16 }}>{formatAssistantVoiceDuration(duration)}</Txt>
          </Row>
          <Waveform active />
          <Row style={{ gap: 8 }}>
            <Tap onPress={onCancel} style={styles.voiceControlButton}>
              <Icon icon={Trash2} size={15} color={c.surface600} />
              <Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>Cancel</Txt>
            </Tap>
            <Tap onPress={onStop} style={[styles.voiceControlButton, styles.voiceStopButton]}>
              <Icon icon={Square} size={14} color={c.white} />
              <Txt weight="bold" style={{ color: c.white, fontSize: 11 }}>Stop</Txt>
            </Tap>
          </Row>
        </View>
      ) : null}
      {preview ? (
        <View style={{ gap: 12 }}>
          <Row style={{ justifyContent: 'space-between', gap: 10 }}>
            <View>
              <Txt weight="black" style={{ color: c.surface900, fontSize: 13 }}>Voice note ready</Txt>
              <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>Preview before sending. Transcription will run after upload.</Txt>
            </View>
            <Txt weight="black" style={{ color: c.formalio700, fontSize: 16 }}>{formatAssistantVoiceDuration(duration)}</Txt>
          </Row>
          <Waveform active={mode === 'playing'} />
          <Row style={{ gap: 8 }}>
            <Tap onPress={onReplay} disabled={mode === 'playing'} style={styles.voiceControlButton}>
              <Icon icon={Play} size={15} color={c.surface600} />
              <Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>{mode === 'playing' ? 'Playing' : 'Listen'}</Txt>
            </Tap>
            <Tap onPress={onCancel} style={styles.voiceControlButton}>
              <Icon icon={Trash2} size={15} color={c.danger600} />
              <Txt weight="bold" style={{ color: c.danger600, fontSize: 11 }}>Delete</Txt>
            </Tap>
            <Tap onPress={onSend} style={[styles.voiceControlButton, styles.voiceSendButton]}>
              <Icon icon={Send} size={15} color={c.white} />
              <Txt weight="bold" style={{ color: c.white, fontSize: 11 }}>Send</Txt>
            </Tap>
          </Row>
        </View>
      ) : null}
    </Animated.View>
  );
}

function AIAssistant({ isOpen, onClose, transactions, loanRequests, metrics, companyId, language }: { isOpen: boolean; onClose: () => void; transactions: Transaction[]; loanRequests: LoanRequestRecord[]; metrics: CloudFinancialMetrics; companyId: string | null; language: SupportedLanguage }) {
  type Message = { id: number; type: 'user' | 'ai'; content: string; timestamp: Date; suggestions?: string[]; action?: 'categorize' | 'insight' | 'alert' | 'report' };
  const t = useCallback((key: string, fallback?: string) => translate(language, key, fallback), [language]);
  const totalIncome = metrics.revenue;
  const totalExpense = metrics.expenses;
  const profit = metrics.profit;
  const healthScore = metrics.financialHealth;
  const dailyTransactions = transactions.slice(0, 5);
  const expenseCategoryItems = metrics.categoryBreakdown.filter((item) => item.type === 'expense' && item.share > 0);
  const incomeCategoryItems = metrics.categoryBreakdown.filter((item) => item.type === 'income' && item.share > 0);
  const topExpense = expenseCategoryItems[0];
  const topIncome = incomeCategoryItems[0];
  const currentExpenseRatio = totalIncome > 0 ? Math.round((totalExpense / totalIncome) * 100) : 0;
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'ai', content: metrics.emptyState ? t('ai.helloEmpty') : `${t('ai.helloWithData')} Revenus: ${formatFCFA(metrics.revenue)}, dépenses: ${formatFCFA(metrics.expenses)}, Score Mosika ${metrics.mosikaScore}.`, timestamp: new Date(), suggestions: ['Voir mes dépenses', 'Quel profit ai-je réalisé ?', 'Analyser mon activité', 'Vérifier mon éligibilité'] },
  ]);
  const [inputValue, setInputValue] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [voiceMode, setVoiceMode] = useState<AssistantVoiceMode>('idle');
  const [voiceDuration, setVoiceDuration] = useState(0);
  const [voiceError, setVoiceError] = useState('');
  const [conversationId, setConversationId] = useState<string | undefined>();
  const voiceTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const playbackTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const scrollRef = useRef<ScrollView>(null);
  const clearVoiceTimers = useCallback(() => {
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    if (playbackTimerRef.current) {
      clearTimeout(playbackTimerRef.current);
      playbackTimerRef.current = null;
    }
  }, []);
  const resetVoiceNote = useCallback(() => {
    clearVoiceTimers();
    setVoiceMode('idle');
    setVoiceDuration(0);
    setVoiceError('');
  }, [clearVoiceTimers]);
  useEffect(() => {
    setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 80);
  }, [messages, isTyping, voiceMode]);
  useEffect(() => () => clearVoiceTimers(), [clearVoiceTimers]);
  useEffect(() => {
    if (!isOpen) resetVoiceNote();
  }, [isOpen, resetVoiceNote]);
  const getAIResponse = (userMessage: string): Pick<Message, 'content' | 'suggestions' | 'action'> => {
    const lower = userMessage.toLowerCase();
    if (lower.includes('download') || lower.includes('rapport') || lower.includes('report') || lower.includes('export')) return { content: metrics.emptyState ? "Aucun rapport financier fiable n'est encore disponible pour ce compte. Ajoutez des transactions réelles pour générer un bilan, un compte de résultat, un flux de trésorerie ou une TVA exportable." : `Je peux préparer un export avec vos données actuelles: ${metrics.transactionCount} transaction(s), ${formatFCFA(metrics.revenue)} de revenus et ${formatFCFA(metrics.expenses)} de dépenses.`, suggestions: ['Télécharger le rapport mensuel', 'Résumer les rapports', 'Retrouver le rapport TVA'], action: 'report' };
    if (lower.includes('invoice') || lower.includes('facture') || lower.includes('unpaid')) return { content: "Je n'ai pas trouvé de factures impayées connectées à votre base pour ce compte. Quand le module factures sera alimenté, je pourrai lister les échéances, retards et montants réels sans estimation fictive.", suggestions: ['Voir le risque de trésorerie', 'Exporter les créances', 'Analyser mon activité'], action: 'alert' };
    if (lower.includes('profit') || lower.includes('bénéf') || lower.includes('benef') || lower.includes('make')) return { content: `Votre profit net calculé depuis vos transactions est de ${formatFCFA(profit)}.\n\nRevenus analysés: ${formatFCFA(totalIncome)}\nDépenses analysées: ${formatFCFA(totalExpense)}\nMarge nette: ${totalIncome ? Math.round((profit / totalIncome) * 100) : 0}%\n\nLecture Mosika: ${metrics.emptyState ? "l'historique est vide, donc je ne peux pas conclure sur la rentabilité." : profit >= 0 ? "la rentabilité est positive sur les données enregistrées." : "les dépenses dépassent les revenus enregistrés."}`, suggestions: ['Analyser mon activité', 'Voir mes dépenses', 'Télécharger le rapport mensuel'], action: 'insight' };
    if (lower.includes('catégoris') || lower.includes('transaction') || lower.includes('today') || lower.includes('summarize')) return { content: dailyTransactions.length === 0 ? 'Aucune transaction récente. Votre historique est vide pour ce compte.' : `Résumé des transactions récentes:\n\n${dailyTransactions.map((t) => `• ${t.description}: ${t.type === 'income' ? '+' : '-'}${formatFCFA(t.amount)} (${t.category})`).join('\n')}\n\nCes lignes viennent de votre historique connecté.`, suggestions: ['Rechercher dans l’historique', 'Voir mes dépenses', 'Expliquer les métriques comptables'], action: 'categorize' };
    if (lower.includes('insight') || lower.includes('conseil') || lower.includes('analyze') || lower.includes('analyse') || lower.includes('business') || lower.includes('activit')) return { content: metrics.emptyState ? `Analyse business Mosika:\n\n• Santé financière: ${healthScore}%\n• Aucune transaction réelle pour le moment.\n• Revenus: ${formatFCFA(0)}\n• Dépenses: ${formatFCFA(0)}\n\nMa recommandation: ajoutez une première transaction et complétez le profil pour activer les tendances.` : `Analyse business Mosika:\n\n• Santé financière: ${healthScore}%\n• Revenus: ${formatFCFA(metrics.revenue)}\n• Dépenses: ${formatFCFA(metrics.expenses)}\n• Profit net: ${formatFCFA(metrics.profit)}\n• Croissance: ${metrics.growthRate.toFixed(1)}%\n\nMa recommandation: ${metrics.profit >= 0 ? 'documentez vos revenus récurrents et gardez les charges sous contrôle.' : 'réduisez les charges prioritaires et sécurisez de nouveaux encaissements.'}`, suggestions: ['Vérifier mon éligibilité', 'Voir le risque de trésorerie', 'Télécharger le rapport mensuel'], action: 'insight' };
    if (lower.includes('dépens') || lower.includes('depens') || lower.includes('expense')) return { content: metrics.emptyState ? "Aucune dépense réelle n'est enregistrée pour ce compte." : `Dépenses analysées: ${formatFCFA(totalExpense)}.\n\nRatio dépenses/revenus: ${currentExpenseRatio}%.\nPoste dominant: ${topExpense ? `${topExpense.name} (${Math.round(topExpense.share)}%)` : 'non déterminé'}.\n\nRecommandation: ${currentExpenseRatio > 85 ? 'réduisez les charges variables avant toute demande de financement.' : 'continuez à surveiller les charges récurrentes et les justificatifs.'}`, suggestions: ['Créer une alerte dépenses', 'Voir la tendance des dépenses', 'Summarize today’s transactions'], action: 'alert' };
    if (lower.includes('tva') || lower.includes('déclar') || lower.includes('tax')) return { content: `TVA estimée depuis les transactions: ${formatFCFA(metrics.taxDue)}.\nTVA collectée: ${formatFCFA(metrics.taxCollected)}.\nTVA déductible: ${formatFCFA(metrics.taxDeductible)}.\n\n${metrics.emptyState ? 'Ajoutez des transactions taxables pour préparer une déclaration exploitable.' : 'Ces montants viennent des mouvements enregistrés et restent à valider avec votre comptable.'}`, suggestions: ['Expliquer la TVA', 'Retrouver les rapports', 'Télécharger le rapport mensuel'], action: 'alert' };
    if (lower.includes('loan') || lower.includes('prêt') || lower.includes('score') || lower.includes('crédit') || lower.includes('eligibility') || lower.includes('éligibil')) {
      const loanReady = !metrics.emptyState && metrics.mosikaScore >= 520 && metrics.scoreConfidence >= 45 && !['high', 'insufficient_data'].includes(metrics.riskAssessmentLevel);
      const strictLimit = loanReady ? Math.round((100000 + Math.pow(Math.max(0, Math.min(1, metrics.mosikaScore / 1000)), 2) * 1900000) / 50000) * 50000 : 0;
      return {
        content: metrics.emptyState
          ? `Votre Score Mosika est au niveau initial: ${metrics.mosikaScore}.\n\nAucune eligibilite credit n'est active sans historique financier. Le score commence a 0 et demande plusieurs mois de donnees verifiees.`
          : loanReady
            ? `Votre Score Mosika actuel est ${metrics.mosikaScore} avec ${metrics.scoreConfidence}% de confiance modele.\n\nLimite indicative stricte: ${formatFCFA(strictLimit)}\nProbabilite estimee: ${metrics.loanApprovalProbability}%\nDemandes actives: ${loanRequests.length}\n\nConseil: maintenez une tresorerie positive, des justificatifs propres et une regularite sur plusieurs mois.`
            : `Votre Score Mosika actuel est ${metrics.mosikaScore} avec ${metrics.scoreConfidence}% de confiance modele.\n\nLe dossier n'est pas encore pre-approuve. Les banques regardent surtout la maturite temporelle, la stabilite des revenus, les anomalies et la conformite, pas seulement le nombre de transactions.`,
        suggestions: ['Ouvrir le suivi du prêt', 'Améliorer mon score', 'Analyser le risque de remboursement'],
        action: 'insight',
      };
    }
    return { content: metrics.emptyState ? "Votre espace financier est encore vide. Je peux vous aider à créer vos premières transactions, comprendre les rapports, préparer le suivi TVA ou expliquer comment construire votre Score Mosika." : `Je peux analyser vos transactions réelles, expliquer vos rapports, résumer la journée, estimer le profit, analyser les dépenses ou suivre une demande de prêt. Revenu dominant actuel: ${topIncome ? topIncome.name : 'non déterminé'}.`, suggestions: ['Voir mes dépenses', 'Télécharger le rapport mensuel', 'Quel profit ai-je réalisé ?', 'Vérifier mon éligibilité'] };
  };
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const value = inputValue;
    const userMessage: Message = { id: Date.now(), type: 'user', content: value, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    if (companyId && formalioBackend.isConfigured) {
      void formalioBackend.chat(companyId, value, conversationId, language)
        .then((response) => {
          if (!response) throw new Error('No AI response.');
          setConversationId(response.conversationId);
          setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'ai', content: response.reply, timestamp: new Date(), suggestions: response.quickActions }]);
        })
        .catch(() => {
          const response = getAIResponse(value);
          setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'ai', timestamp: new Date(), ...response }]);
        })
        .finally(() => setIsTyping(false));
      return;
    }
    setTimeout(() => {
      const response = getAIResponse(value);
      setMessages((prev) => [...prev, { id: Date.now() + 1, type: 'ai', timestamp: new Date(), ...response }]);
      setIsTyping(false);
    }, 1500);
  };
  const startVoiceRecording = async () => {
    clearVoiceTimers();
    setVoiceError('');
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        setVoiceError('Microphone permission is required to record a voice note.');
        setVoiceMode('idle');
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      setVoiceDuration(0);
      setVoiceMode('recording');
      voiceTimerRef.current = setInterval(() => setVoiceDuration((current) => current + 1), 1000);
    } catch {
      setVoiceError('Unable to start the microphone. You can still type your message.');
      setVoiceMode('idle');
    }
  };
  const stopVoiceRecording = () => {
    if (voiceMode !== 'recording') return;
    if (voiceTimerRef.current) {
      clearInterval(voiceTimerRef.current);
      voiceTimerRef.current = null;
    }
    setVoiceDuration((current) => Math.max(current, 1));
    setVoiceMode('preview');
  };
  const replayVoiceNote = () => {
    if (voiceMode !== 'preview') return;
    setVoiceMode('playing');
    playbackTimerRef.current = setTimeout(() => {
      playbackTimerRef.current = null;
      setVoiceMode('preview');
    }, Math.min(2400, Math.max(900, voiceDuration * 260)));
  };
  const sendVoiceNote = () => {
    if (voiceMode !== 'preview' && voiceMode !== 'playing') return;
    const duration = Math.max(voiceDuration, 1);
    clearVoiceTimers();
    const userMessage: Message = {
      id: Date.now(),
      type: 'user',
      content: `Voice note · ${formatAssistantVoiceDuration(duration)}\nTranscription pending for future AI audio processing.`,
      timestamp: new Date(),
    };
    setMessages((prev) => [...prev, userMessage]);
    resetVoiceNote();
    setIsTyping(true);
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        {
          id: Date.now() + 1,
          type: 'ai',
          timestamp: new Date(),
          content: 'Voice note received. In this prototype, audio is queued for transcription. Once the backend audio service is connected, I will transcribe it, summarize the request, and answer with the same accounting context.',
          suggestions: ['Summarize today’s transactions', 'Voir mes dépenses', 'Télécharger le rapport mensuel'],
          action: 'insight',
        },
      ]);
      setIsTyping(false);
    }, 1100);
  };
  const latestMessageId = messages[messages.length - 1]?.id;
  const assistantCoreActions = [
    { icon: Download, label: 'Télécharger', onPress: () => setInputValue('Télécharger le rapport mensuel') },
    { icon: TrendingDown, label: 'Dépenses', onPress: () => setInputValue('Voir mes dépenses') },
    { icon: Calculator, label: 'Profit', onPress: () => setInputValue('Quel profit ai-je réalisé ?') },
  ];
  const voiceComposerDisabled = voiceMode === 'preview' || voiceMode === 'playing';
  return (
    <ModalShell visible={isOpen} onClose={onClose}>
      <View style={styles.assistantModal}>
        <View style={styles.assistantHeader}>
          <Row style={{ justifyContent: 'space-between' }}>
          <Row style={{ gap: 10 }}><View style={styles.assistantHeaderIcon}><Icon icon={MessageCircle} size={18} color={c.formalio700} /></View><View><Txt weight="black" style={{ color: c.surface900, fontSize: 15 }}>Mosika</Txt><Txt style={{ color: c.surface500, fontSize: 12 }}>{t('ai.assistant')}</Txt></View></Row>
            <Tap onPress={onClose} style={styles.closeButton}><Icon icon={X} size={17} color={c.surface600} /></Tap>
          </Row>
        </View>
        <ScrollView ref={scrollRef} style={styles.assistantScroll} contentContainerStyle={{ padding: 14, gap: 12 }}>
          {messages.map((message) => (
            <View key={message.id} style={[styles.messageRow, message.type === 'user' && { justifyContent: 'flex-end' }]}>
              <View style={[styles.messageBubble, message.type === 'user' ? styles.userBubble : styles.aiBubble]}>
                {message.type === 'ai' ? <Txt weight="medium" style={{ color: c.formalio700, fontSize: 12, marginBottom: 6 }}>Mosika</Txt> : null}
                <Txt style={{ color: message.type === 'user' ? c.white : c.surface700, fontSize: 13, lineHeight: 19 }}>{message.content}</Txt>
                {message.suggestions && message.id === latestMessageId ? (
                  <View style={styles.suggestions}>
                    {message.suggestions.map((suggestion) => (
                      <Tap key={suggestion} onPress={() => setInputValue(suggestion)} style={styles.suggestionChip}>
                        <Txt weight="medium" style={{ color: c.formalio700, fontSize: 11 }}>{suggestion}</Txt>
                        <Icon icon={ChevronRight} size={12} color={c.formalio700} />
                      </Tap>
                    ))}
                  </View>
                ) : null}
                <Txt style={{ color: message.type === 'user' ? 'rgba(255,255,255,.62)' : c.surface400, fontSize: 10, marginTop: 8 }}>
                  {message.timestamp.toLocaleTimeString('fr-FR', { hour: '2-digit', minute: '2-digit' })}
                </Txt>
              </View>
            </View>
          ))}
          {isTyping ? <View style={[styles.messageBubble, styles.aiBubble, { alignSelf: 'flex-start' }]}><Row style={{ gap: 8 }}><ActivityIndicator color={c.formalio600} /><Txt style={{ color: c.surface500, fontSize: 13 }}>{t('ai.thinking')}</Txt></Row></View> : null}
        </ScrollView>
        <AssistantVoiceNotePanel
          mode={voiceMode}
          duration={voiceDuration}
          error={voiceError}
          onStop={stopVoiceRecording}
          onCancel={resetVoiceNote}
          onReplay={replayVoiceNote}
          onSend={sendVoiceNote}
        />
        <View style={styles.assistantActionBar}>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingBottom: 8 }}>
            {assistantCoreActions.map((action) => (
              <Tap key={action.label} onPress={action.onPress} style={styles.assistantActionPill}>
                <Icon icon={action.icon} size={14} color={c.surface600} />
                <Txt weight="medium" style={{ color: c.surface600, fontSize: 12 }}>{action.label}</Txt>
              </Tap>
            ))}
          </ScrollView>
        </View>
        <View style={styles.assistantInputArea}>
          <Tap
            onPress={voiceMode === 'recording' ? stopVoiceRecording : startVoiceRecording}
            disabled={voiceComposerDisabled}
            accessibilityLabel={voiceMode === 'recording' ? 'Stop voice recording' : 'Record voice note'}
            style={[styles.assistantMicButton, voiceMode === 'recording' && styles.assistantMicButtonRecording, voiceComposerDisabled && { opacity: 0.55 }]}
          >
            <RecordingPulse active={voiceMode === 'recording'} />
            <Icon icon={voiceMode === 'recording' ? Square : Mic} size={18} color={voiceMode === 'recording' ? c.white : c.formalio700} />
          </Tap>
          <View style={styles.assistantInput}>
            <TextInput value={inputValue} onChangeText={setInputValue} placeholder={t('ai.placeholder')} placeholderTextColor={c.surface400} maxFontSizeMultiplier={inputTextMaxScale} style={styles.textInput} onSubmitEditing={handleSend} />
          </View>
          <Tap onPress={handleSend} disabled={!inputValue.trim()} style={styles.sendButton}>
            <Icon icon={Send} size={17} color={c.white} />
          </Tap>
        </View>
      </View>
    </ModalShell>
  );
}

function VoiceRecorder({ isOpen, onClose, onComplete, companyId }: { isOpen: boolean; onClose: () => void; onComplete: (transaction: ParsedTransaction) => void; companyId: string | null }) {
  type Phase = 'idle' | 'recording' | 'processing' | 'transcribed' | 'categorized';
  const language = useAppLanguage();
  const phrases = useMemo(() => [
    { transcript: "J'ai vendu 50,000 francs de tissus à un client ce matin", parsed: { type: 'income' as const, amount: 50000, description: 'Vente de tissus', category: 'Ventes', method: 'Espèces' } },
    { transcript: "J'ai dépensé 15,000 francs pour le transport de marchandises", parsed: { type: 'expense' as const, amount: 15000, description: 'Transport de marchandises', category: 'Transport', method: 'Espèces' } },
    { transcript: 'Reçu 125,000 francs sur MTN Mobile Money pour vente en gros', parsed: { type: 'income' as const, amount: 125000, description: 'Vente en gros', category: 'Ventes', method: 'MTN MoMo' } },
  ], []);
  void phrases;
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const { showToast } = useToast();
  const recordingRef = useRef<Audio.Recording | null>(null);
  const reset = useCallback(() => {
    setPhase('idle');
    setTranscript('');
    setParsedData(null);
    setRecordingTime(0);
    if (intervalRef.current) clearInterval(intervalRef.current);
  }, []);
  useEffect(() => {
    if (!isOpen) reset();
  }, [isOpen, reset]);
  const startRecording = async () => {
    try {
      const permission = await Audio.requestPermissionsAsync();
      if (!permission.granted) {
        showToast({ type: 'error', title: 'Micro requis', message: 'Autorisez le micro pour utiliser la saisie vocale.' });
        return;
      }
      if (!companyId) {
        showToast({ type: 'error', title: 'Cloud requis', message: 'Connectez-vous pour transcrire et enregistrer une transaction vocale.' });
        return;
      }
      await Audio.setAudioModeAsync({ allowsRecordingIOS: true, playsInSilentModeIOS: true });
      const recording = new Audio.Recording();
      await recording.prepareToRecordAsync(Audio.RecordingOptionsPresets.HIGH_QUALITY);
      await recording.startAsync();
      recordingRef.current = recording;
      setPhase('recording');
      setTranscript('');
      setParsedData(null);
      setRecordingTime(0);
      intervalRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
    } catch (error) {
      showToast({ type: 'error', title: 'Enregistrement impossible', message: error instanceof Error ? error.message : 'Reessayez.' });
    }
  };
  const stopRecording = async () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('processing');
    try {
      const recording = recordingRef.current;
      recordingRef.current = null;
      if (!recording) throw new Error('Aucun enregistrement actif.');
      await recording.stopAndUnloadAsync();
      const uri = recording.getURI();
      if (!uri || !companyId) throw new Error('Audio introuvable.');
      const audioBase64 = await FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
      const result = await formalioBackend.transcribeVoiceTransaction(companyId, {
        audioBase64,
        mimeType: Platform.OS === 'web' ? 'audio/webm' : 'audio/m4a',
        fileName: Platform.OS === 'web' ? 'formalio-voice.webm' : 'formalio-voice.m4a',
        language,
      });
      if (!result) throw new Error('Transcription indisponible.');
      setTranscript(result.transcript);
      setPhase('transcribed');
      setTimeout(() => {
        setParsedData(result.parsed);
        setPhase('categorized');
      }, 500);
    } catch (error) {
      setPhase('idle');
      showToast({ type: 'error', title: 'Transcription impossible', message: error instanceof Error ? error.message : 'Configurez le fournisseur speech-to-text.' });
    }
  };
  const formatTime = (seconds: number) => `${Math.floor(seconds / 60)}:${(seconds % 60).toString().padStart(2, '0')}`;
  return (
    <ModalShell visible={isOpen} onClose={onClose} align="center">
      <View>
        <Row style={styles.voiceHeader}>
          <Row style={{ gap: 7 }}><Icon icon={Sparkles} size={16} color={c.formalio600} /><Txt weight="semibold" style={{ fontSize: 14 }}>Mosika Voice AI</Txt></Row>
          <Tap onPress={onClose} style={styles.smallRound}><Icon icon={X} size={16} color={c.surface500} /></Tap>
        </Row>
        <View style={styles.voiceBody}>
          <AnimatedMascot state={phase === 'recording' ? 'listening' : phase === 'processing' ? 'thinking' : phase === 'categorized' ? 'success' : 'idle'} size={100} />
          <View style={{ minHeight: 62, alignItems: 'center', marginTop: 14 }}>
            <Txt weight="semibold" style={{ color: phase === 'recording' || phase === 'categorized' ? c.formalio700 : c.surface900, fontSize: 18 }}>{phase === 'idle' ? 'Appuyez pour parler' : phase === 'recording' ? 'Écoute en cours...' : phase === 'processing' ? 'Mosika analyse...' : phase === 'transcribed' ? 'Transcription' : 'Transaction reconnue !'}</Txt>
            <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 5 }}>{phase === 'idle' ? 'Décrivez votre transaction en français' : phase === 'recording' ? formatTime(recordingTime) : phase === 'processing' ? 'Transcription en cours' : phase === 'transcribed' ? 'Identification de la catégorie...' : 'Vérifiez et confirmez'}</Txt>
          </View>
          <View style={styles.waveformBox}>
            {phase === 'recording' ? <Waveform active /> : null}
            {phase === 'processing' ? <Row style={{ gap: 8 }}><ActivityIndicator color={c.formalio600} /><WaveDots /></Row> : null}
            {(phase === 'transcribed' || phase === 'categorized') && transcript ? <View style={styles.transcriptBox}><Row style={{ gap: 4, marginBottom: 4 }}><Icon icon={Sparkles} size={12} color={c.surface400} /><Txt style={{ color: c.surface400, fontSize: 11 }}>Transcription</Txt></Row><Txt style={{ color: c.surface900, fontSize: 13, fontStyle: 'italic' }}>"{transcript}"{phase === 'transcribed' ? ' |' : ''}</Txt></View> : null}
            {phase === 'idle' ? <Waveform /> : null}
          </View>
          {phase === 'categorized' && parsedData ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.parsedCard}>
              <Row style={{ gap: 5, marginBottom: 10 }}><Icon icon={Sparkles} size={13} color={c.formalio700} /><Txt weight="semibold" style={{ color: c.formalio700, fontSize: 12 }}>Catégorisé automatiquement</Txt></Row>
              <InfoLine label="Type" value={parsedData.type === 'income' ? '↑ Revenu' : '↓ Dépense'} valueColor={parsedData.type === 'income' ? c.formalio700 : c.danger600} />
              <InfoLine label="Montant" value={`${parsedData.amount.toLocaleString('fr-FR')} FCFA`} bold />
              <InfoLine label="Description" value={parsedData.description} />
              <InfoLine label="Catégorie" value={parsedData.category} valueColor={c.formalio700} />
              <InfoLine label="Méthode" value={parsedData.method} />
            </Animated.View>
          ) : null}
          <Row style={{ gap: 8, width: '100%' }}>
            {phase === 'idle' ? <PrimaryButton label="Commencer" icon={Mic} onPress={startRecording} style={{ flex: 1 }} /> : null}
            {phase === 'recording' ? <PrimaryButton label={`Arrêter (${formatTime(recordingTime)})`} tone="danger" onPress={stopRecording} style={{ flex: 1 }} /> : null}
            {phase === 'categorized' ? (
              <>
                <Tap onPress={reset} style={styles.refreshButton}><Icon icon={RefreshCw} size={17} color={c.surface700} /></Tap>
                <PrimaryButton label="Confirmer" icon={Check} onPress={() => { if (parsedData) onComplete(parsedData); reset(); onClose(); }} style={{ flex: 1 }} />
              </>
            ) : null}
          </Row>
        </View>
      </View>
    </ModalShell>
  );
}

function Waveform({ active = false }: { active?: boolean }) {
  const heights = [8, 10, 14, 20, 32, 44, 36, 22, 16, 30, 46, 34, 18, 12, 8, 14, 26, 40, 28, 18, 12, 8, 10, 14];
  return (
    <Row style={{ justifyContent: 'center', gap: 4 }}>
      {heights.map((h, i) => (
        <Animated.View key={i} style={{ width: 6, height: active ? h : 8, borderRadius: 6, backgroundColor: active ? c.formalio500 : c.surface200 }} />
      ))}
    </Row>
  );
}

function WaveDots() {
  return <Row style={{ gap: 4 }}>{[0, 1, 2].map((i) => <View key={i} style={[styles.tinyDot, { backgroundColor: c.formalio600 }]} />)}</Row>;
}

function InfoLine({ label, value, valueColor = c.surface900, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
  const provider = getMobileMoneyProvider(value);
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 7, gap: 10 }}>
      <Txt style={{ color: c.surface500, fontSize: 12 }}>{label}</Txt>
      {provider ? (
        <PaymentMethodInline method={value} color={valueColor} />
      ) : (
        <Txt weight={bold ? 'bold' : 'medium'} numberOfLines={1} style={{ color: valueColor, fontSize: bold ? 15 : 12, flexShrink: 1 }}>{value}</Txt>
      )}
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

type ScannerImageAsset = {
  uri: string;
  base64?: string | null;
  mimeType?: string | null;
  fileName?: string | null;
  fileSize?: number | null;
  source?: 'camera' | 'upload' | 'drop';
};

const OCR_MAX_IMAGE_BYTES = 6 * 1024 * 1024;
const OCR_SUPPORTED_MIME_TYPES = ['image/jpeg', 'image/png', 'image/webp'];

function cleanBase64(value: string) {
  return value.includes(',') ? value.slice(value.indexOf(',') + 1) : value;
}

function estimateBase64Bytes(base64: string) {
  const cleaned = cleanBase64(base64).replace(/\s/g, '');
  const padding = cleaned.endsWith('==') ? 2 : cleaned.endsWith('=') ? 1 : 0;
  return Math.max(0, Math.floor((cleaned.length * 3) / 4) - padding);
}

function inferImageMimeType(uri?: string | null, fallback = 'image/jpeg') {
  const lower = (uri ?? '').split('?')[0].toLowerCase();
  if (lower.endsWith('.png')) return 'image/png';
  if (lower.endsWith('.webp')) return 'image/webp';
  if (lower.endsWith('.jpg') || lower.endsWith('.jpeg')) return 'image/jpeg';
  return fallback;
}

function normalizeOcrMimeType(mimeType?: string | null, uri?: string | null) {
  const normalized = (mimeType || inferImageMimeType(uri)).toLowerCase();
  if (normalized === 'image/jpg') return 'image/jpeg';
  return normalized;
}

function validateOcrImage(mimeType: string, byteLength: number) {
  if (!OCR_SUPPORTED_MIME_TYPES.includes(mimeType)) {
    throw new Error('Format non pris en charge. Importez une image JPG, PNG ou WebP.');
  }
  if (byteLength > OCR_MAX_IMAGE_BYTES) {
    throw new Error('Image trop lourde. Importez une image plus légère, idéalement sous 6 Mo.');
  }
}

function arrayBufferToBase64(buffer: ArrayBuffer) {
  const web = globalThis as typeof globalThis & { btoa?: (value: string) => string };
  if (!web.btoa) throw new Error('Encodage image indisponible dans ce navigateur.');
  const bytes = new Uint8Array(buffer);
  const chunkSize = 0x8000;
  let binary = '';
  for (let index = 0; index < bytes.length; index += chunkSize) {
    const chunk = bytes.subarray(index, index + chunkSize);
    binary += String.fromCharCode(...chunk);
  }
  return web.btoa(binary);
}

async function readImageUriAsBase64(uri: string) {
  if (Platform.OS === 'web') {
    const response = await fetch(uri);
    if (!response.ok) throw new Error('Impossible de lire cette image dans le navigateur.');
    const blob = await response.blob();
    validateOcrImage(normalizeOcrMimeType(blob.type, uri), blob.size);
    return arrayBufferToBase64(await blob.arrayBuffer());
  }
  return FileSystem.readAsStringAsync(uri, { encoding: FileSystem.EncodingType.Base64 });
}

async function scannerImageToOcrPayload(asset: ScannerImageAsset) {
  const mimeType = normalizeOcrMimeType(asset.mimeType, asset.fileName ?? asset.uri);
  let imageBase64 = asset.base64 ? cleanBase64(asset.base64) : '';
  if (!imageBase64) imageBase64 = await readImageUriAsBase64(asset.uri);
  validateOcrImage(mimeType, asset.fileSize ?? estimateBase64Bytes(imageBase64));
  return {
    imageBase64,
    mimeType,
    imagePath: asset.uri,
    fileName: asset.fileName ?? 'formalio-document.jpg',
    sourcePlatform: Platform.OS,
    source: asset.source ?? 'camera',
  };
}

type WebFileLike = {
  name?: string;
  type?: string;
  size?: number;
  arrayBuffer?: () => Promise<ArrayBuffer>;
};

async function webFileToScannerAsset(file: WebFileLike): Promise<ScannerImageAsset> {
  if (!file?.arrayBuffer) throw new Error('Fichier image illisible.');
  const mimeType = normalizeOcrMimeType(file.type, file.name);
  validateOcrImage(mimeType, file.size ?? 0);
  const web = globalThis as typeof globalThis & { URL?: typeof URL };
  const uri = typeof web.URL?.createObjectURL === 'function' ? web.URL.createObjectURL(file as Blob) : `web-upload://${file.name ?? 'document'}`;
  return {
    uri,
    base64: arrayBufferToBase64(await file.arrayBuffer()),
    mimeType,
    fileName: file.name ?? 'formalio-document.jpg',
    fileSize: file.size,
    source: 'upload',
  };
}

function pickWebScannerImage() {
  const web = globalThis as typeof globalThis & { document?: Document };
  if (!web.document) throw new Error('Sélecteur de fichiers indisponible dans ce navigateur.');
  return new Promise<ScannerImageAsset | null>((resolve, reject) => {
    const input = web.document?.createElement('input');
    if (!input) {
      reject(new Error('Sélecteur de fichiers indisponible dans ce navigateur.'));
      return;
    }
    input.type = 'file';
    input.accept = OCR_SUPPORTED_MIME_TYPES.join(',');
    input.onchange = () => {
      const file = input.files?.[0];
      if (!file) {
        resolve(null);
        return;
      }
      webFileToScannerAsset(file).then(resolve).catch(reject);
    };
    input.click();
  });
}

function getFriendlyOcrError(error: unknown) {
  const message = error instanceof Error ? error.message : '';
  const lower = message.toLowerCase();
  if (lower.includes('session') || lower.includes('cloud')) return 'Reconnectez-vous pour analyser ce document avec le moteur OCR cloud.';
  if (lower.includes('format non pris') || lower.includes('image trop lourde') || lower.includes('fichier image illisible')) return message;
  if (lower.includes('provider') || lower.includes('openai') || lower.includes('api_key') || lower.includes('configured')) {
    return 'Le moteur OCR cloud n’est pas encore configuré. Vous pouvez importer une autre image ou saisir la transaction manuellement.';
  }
  if (Platform.OS === 'web') {
    return 'Impossible d’analyser cette image dans le navigateur. Essayez une image JPG/PNG plus légère ou utilisez la saisie manuelle.';
  }
  return 'Impossible d’analyser ce document pour le moment. Réessayez ou utilisez la saisie manuelle.';
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

type ScannerPhase = 'permission' | 'scanning' | 'processing' | 'detected' | 'error';

function ScannerModal({ isOpen, onClose, onSave, companyId }: { isOpen: boolean; onClose: () => void; onSave: (ticket: ScannedTicketData) => void; companyId: string | null }) {
  const [permission, requestPermission] = useCameraPermissions();
  const { showToast } = useToast();
  const cameraRef = useRef<CameraView>(null);
  const [phase, setPhase] = useState<ScannerPhase>('permission');
  const [progress, setProgress] = useState(0);
  const [flashOn, setFlashOn] = useState(false);
  const [captureUri, setCaptureUri] = useState<string | undefined>();
  const [detected, setDetected] = useState<ScannedTicketData | null>(null);
  const mockTickets = useMemo<ScannedTicketData[]>(() => [
    {
      type: 'expense',
      amount: 28500,
      description: 'Achat stock wax - ticket scanné',
      category: 'Achats',
      method: 'Espèces',
      ticketNumber: 'TK-4829-AC',
      date: '2026-05-19',
      merchant: 'Marché Central Douala',
      referenceNumber: 'REF-84Q7-2201',
      details: '12 articles textile, remise fournisseur détectée, TVA non indiquée.',
    },
    {
      type: 'income',
      amount: 76000,
      description: 'Vente comptoir - reçu scanné',
      category: 'Ventes',
      method: 'Orange Money',
      ticketNumber: 'RC-9051-OM',
      date: '2026-05-19',
      merchant: 'Boutique Élégance',
      referenceNumber: 'OM-226-771-902',
      details: 'Paiement mobile confirmé, client récurrent, marge estimée élevée.',
    },
  ], []);
  void mockTickets;

  const resetScanner = useCallback(() => {
    setProgress(0);
    setFlashOn(false);
    setCaptureUri(undefined);
    setDetected(null);
    setPhase('permission');
  }, []);

  const finishDetection = useCallback(async (asset?: ScannerImageAsset) => {
    setPhase('processing');
    try {
      if (!asset?.uri || !companyId) throw new Error('Image ou session cloud indisponible.');
      const payload = await scannerImageToOcrPayload(asset);
      const result = await formalioBackend.scanDocument(companyId, payload);
      if (!result?.extracted) throw new Error('OCR indisponible.');
      const extracted = result.extracted;
      const nextTicket: ScannedTicketData = {
        type: extracted.type,
        amount: extracted.amount,
        description: extracted.transactionDetails || `Document scanné - ${extracted.merchant}`,
        category: extracted.category,
        method: extracted.method,
        ticketNumber: extracted.ticketNumber,
        date: extracted.date,
        merchant: extracted.merchant,
        referenceNumber: extracted.referenceNumber,
        details: `${extracted.transactionDetails || 'Données extraites du document.'} Confiance OCR: ${extracted.confidence}%.`,
        imageUri: asset.uri,
      };
      setDetected(nextTicket);
      setCaptureUri(asset.uri);
      setPhase('detected');
    } catch (error) {
      console.warn('[Formalio OCR]', error);
      setPhase('error');
      showToast({ type: 'error', title: 'OCR indisponible', message: getFriendlyOcrError(error) });
    }
  }, [companyId, showToast]);

  const pickScannerImage = useCallback(async () => {
    try {
      setPhase('processing');
      const asset = Platform.OS === 'web'
        ? await pickWebScannerImage()
        : await (async () => {
            const permissionResult = await ImagePicker.requestMediaLibraryPermissionsAsync();
            if (!permissionResult.granted) throw new Error('Autorisez l’accès aux fichiers pour importer une image.');
            const result = await ImagePicker.launchImageLibraryAsync({
              mediaTypes: ImagePicker.MediaTypeOptions.Images,
              quality: 0.76,
              base64: true,
            });
            if (result.canceled || !result.assets[0]?.uri) return null;
            const picked = result.assets[0] as ScannerImageAsset;
            return { ...picked, source: 'upload' as const };
          })();
      if (!asset) {
        setPhase(permission?.granted ? 'scanning' : 'permission');
        return;
      }
      await finishDetection(asset);
    } catch (error) {
      console.warn('[Formalio OCR upload]', error);
      setPhase('error');
      showToast({ type: 'error', title: 'Import OCR impossible', message: getFriendlyOcrError(error) });
    }
  }, [finishDetection, permission?.granted, showToast]);

  const handleWebDrop = useCallback((event: unknown) => {
    if (Platform.OS !== 'web') return;
    const dropEvent = event as { preventDefault?: () => void; dataTransfer?: { files?: ArrayLike<WebFileLike> } };
    dropEvent.preventDefault?.();
    const file = dropEvent.dataTransfer?.files?.[0];
    if (!file) return;
    void webFileToScannerAsset(file)
      .then((asset) => finishDetection({ ...asset, source: 'drop' }))
      .catch((error) => {
        console.warn('[Formalio OCR drop]', error);
        setPhase('error');
        showToast({ type: 'error', title: 'Import OCR impossible', message: getFriendlyOcrError(error) });
      });
  }, [finishDetection, showToast]);

  const webDropProps = Platform.OS === 'web'
    ? ({
        onDragOver: (event: { preventDefault?: () => void }) => event.preventDefault?.(),
        onDrop: handleWebDrop,
      } as Record<string, unknown>)
    : {};

  const startScanner = useCallback(async () => {
    setDetected(null);
    setCaptureUri(undefined);
    setProgress(0);
    const currentPermission = permission?.granted ? permission : await requestPermission();
    if (!currentPermission.granted) {
      setPhase('permission');
      return;
    }
    setPhase('scanning');
  }, [permission, requestPermission]);

  useEffect(() => {
    if (isOpen) void startScanner();
    else resetScanner();
  }, [isOpen, resetScanner, startScanner]);

  useEffect(() => {
    if (!isOpen || phase !== 'scanning') return;
    setProgress(0);
    const interval = setInterval(() => setProgress((value) => Math.min(100, value + 7 + Math.random() * 9)), 180);
    const timer = setTimeout(() => {
      void (async () => {
        const photo = await cameraRef.current?.takePictureAsync({ quality: 0.72, shutterSound: false, base64: Platform.OS === 'web' }) as ScannerImageAsset | undefined;
        await finishDetection(photo ?? (captureUri ? { uri: captureUri, mimeType: 'image/jpeg', source: 'camera' } : undefined));
      })();
    }, 2850);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [captureUri, finishDetection, isOpen, phase]);

  const captureTicket = async () => {
    try {
      setPhase('processing');
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.72, shutterSound: false, base64: Platform.OS === 'web' }) as ScannerImageAsset | undefined;
      await finishDetection(photo ? { ...photo, source: 'camera' } : undefined);
    } catch {
      setPhase('error');
    }
  };

  const confirmTicket = () => {
    if (!detected) return;
    onSave(detected);
  };

  return (
    <ModalShell visible={isOpen} onClose={onClose}>
      <View style={styles.ocrModal}>
        <LinearGradient colors={[c.formalio900, c.formalio800]} style={styles.ocrHeader}>
          <Row style={{ justifyContent: 'space-between', gap: 12 }}>
            <Row style={{ gap: 10, flex: 1 }}>
              <View style={styles.glassIconSmall}><Icon icon={ScanLine} size={20} color={c.white} /></View>
              <View style={{ flex: 1 }}>
                <Txt weight="black" style={{ color: c.white, fontSize: 16 }}>Ticket Scanner AI</Txt>
                <Txt style={{ color: c.formalio200, fontSize: 11, marginTop: 3 }}>Camera OCR · structured transaction extraction</Txt>
              </View>
            </Row>
            <Tap onPress={onClose} style={styles.closeButton}><Icon icon={X} size={17} color={c.white} /></Tap>
          </Row>
        </LinearGradient>

        <ScrollView showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, gap: 14 }}>
          {Platform.OS === 'web' ? (
            <Pressable onPress={pickScannerImage} {...webDropProps} style={styles.ocrDropZone}>
              <Icon icon={Upload} size={18} color={c.info700} />
              <View style={{ flex: 1, minWidth: 0 }}>
                <Txt weight="bold" style={{ color: c.info700, fontSize: 12 }}>Importer ou glisser une image</Txt>
                <Txt style={{ color: c.info700, fontSize: 10, marginTop: 2 }}>JPG, PNG ou WebP · traitement OCR cloud sécurisé</Txt>
              </View>
            </Pressable>
          ) : null}

          <View style={styles.ocrCameraBox}>
            {permission?.granted && phase !== 'detected' ? (
              <CameraView ref={cameraRef} style={StyleSheet.absoluteFillObject} facing="back" autofocus="on" enableTorch={flashOn} />
            ) : null}
            {phase === 'detected' && captureUri ? <Image source={{ uri: captureUri }} resizeMode="cover" style={StyleSheet.absoluteFillObject} /> : null}
            <LinearGradient colors={['rgba(2,6,23,.16)', 'rgba(2,6,23,.72)']} style={StyleSheet.absoluteFillObject} />
            <View style={styles.ocrFrame}>
              <View style={[styles.ocrCorner, styles.ocrCornerTopLeft]} />
              <View style={[styles.ocrCorner, styles.ocrCornerTopRight]} />
              <View style={[styles.ocrCorner, styles.ocrCornerBottomLeft]} />
              <View style={[styles.ocrCorner, styles.ocrCornerBottomRight]} />
            </View>
            {phase === 'scanning' ? <Animated.View entering={FadeIn.duration(180)} style={styles.ocrScanLine} /> : null}
            <View style={styles.ocrCameraOverlay}>
              {phase === 'permission' ? (
                <View style={styles.ocrPermissionCard}>
                  <Icon icon={Camera} size={30} color={c.formalio700} />
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Autorisation caméra requise</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 4 }}>Ouvrez la caméra ou importez une image du document.</Txt>
                  <PrimaryButton label="Activer la caméra" icon={Camera} onPress={startScanner} style={{ minHeight: 40, borderRadius: 12, marginTop: 10 }} />
                  <PrimaryButton label="Importer une image" tone="surface" icon={Upload} onPress={pickScannerImage} style={{ minHeight: 40, borderRadius: 12, marginTop: 8 }} />
                </View>
              ) : null}
              {phase === 'scanning' ? (
                <View style={{ alignItems: 'center' }}>
                  <Pill tone="blue">Scanning...</Pill>
                  <Txt weight="bold" style={{ color: c.white, fontSize: 15, marginTop: 10 }}>Alignez le ticket dans le cadre</Txt>
                  <Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 11, marginTop: 4 }}>Détection du marchand, montant, date et référence</Txt>
                </View>
              ) : null}
              {phase === 'processing' ? (
                <View style={styles.ocrProcessingCard}>
                  <ActivityIndicator color={c.formalio600} />
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Extraction des données...</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>Analyse OCR du document</Txt>
                </View>
              ) : null}
              {phase === 'detected' ? (
                <View style={styles.ocrSuccessBadge}>
                  <Icon icon={CheckCircle2} size={22} color={c.white} />
                  <Txt weight="black" style={{ color: c.white, fontSize: 12 }}>Détecté</Txt>
                </View>
              ) : null}
              {phase === 'error' ? (
                <View style={styles.ocrPermissionCard}>
                  <Icon icon={AlertTriangle} size={28} color={c.danger600} />
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Analyse impossible</Txt>
                  <PrimaryButton label="Relancer le scan" icon={RefreshCw} onPress={startScanner} style={{ minHeight: 40, borderRadius: 12, marginTop: 10 }} />
                  <PrimaryButton label="Importer une image" tone="surface" icon={Upload} onPress={pickScannerImage} style={{ minHeight: 40, borderRadius: 12, marginTop: 8 }} />
                </View>
              ) : null}
            </View>
          </View>

          <Card style={styles.ocrSignalCard}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Row style={{ gap: 7 }}><Icon icon={Sparkles} size={15} color={c.info700} /><Txt weight="black" style={{ color: c.info700, fontSize: 12 }}>OCR Confidence</Txt></Row>
              <Txt weight="black" style={{ color: c.info700, fontSize: 12 }}>{phase === 'detected' ? '98%' : `${Math.round(progress)}%`}</Txt>
            </Row>
            <ValueBar value={phase === 'detected' ? 98 : progress} color={phase === 'detected' ? c.formalio500 : c.info500} />
          </Card>

          {detected ? (
            <Animated.View entering={FadeIn.duration(200)} style={styles.ocrResultCard}>
              <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 10 }}>
                <View>
                  <Txt weight="black" style={{ fontSize: 14 }}>{detected.merchant}</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>{detected.ticketNumber}</Txt>
                </View>
                <Txt weight="black" style={{ color: detected.type === 'income' ? c.formalio700 : c.danger600, fontSize: 16 }}>{detected.amount.toLocaleString('fr-FR')} FCFA</Txt>
              </Row>
              <Grid columns={2} gap={8}>
                <ScannerDataCell label="Date" value={detected.date} />
                <ScannerDataCell label="Reference" value={detected.referenceNumber} />
                <ScannerDataCell label="Category" value={detected.category} />
                <ScannerDataCell label="Method" value={detected.method} />
              </Grid>
              <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 10 }}>{detected.details}</Txt>
            </Animated.View>
          ) : null}

          <Row style={{ gap: 8 }}>
            <Tap onPress={() => setFlashOn((value) => !value)} style={[styles.ocrToolButton, flashOn && { borderColor: c.gold500, backgroundColor: c.gold50 }]}>
              <Icon icon={Zap} size={16} color={flashOn ? c.gold700 : c.surface600} />
            </Tap>
            <Tap onPress={startScanner} style={styles.ocrToolButton}><Icon icon={RefreshCw} size={16} color={c.surface600} /></Tap>
            <Tap onPress={pickScannerImage} style={styles.ocrToolButton}><Icon icon={Upload} size={16} color={c.surface600} /></Tap>
            <PrimaryButton label={phase === 'detected' ? 'Confirmer le remplissage' : 'Capturer le ticket'} icon={phase === 'detected' ? Check : Camera} onPress={phase === 'detected' ? confirmTicket : captureTicket} style={{ flex: 1, minHeight: 44, borderRadius: 13 }} />
          </Row>
          <Tap onPress={onClose} style={styles.ocrManualFallback}>
            <Icon icon={FileText} size={14} color={c.surface500} />
            <Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>Saisie manuelle</Txt>
          </Tap>
        </ScrollView>
      </View>
    </ModalShell>
  );
}

function ScannerDataCell({ label, value }: { label: string; value: string }) {
  const provider = getMobileMoneyProvider(value);
  return (
    <View style={styles.ocrDataCell}>
      <Txt style={{ color: c.surface400, fontSize: 10 }}>{label}</Txt>
      {provider ? (
        <View style={{ marginTop: 2 }}>
          <PaymentMethodInline method={value} color={c.surface800} />
        </View>
      ) : (
        <Txt weight="bold" numberOfLines={1} style={{ color: c.surface800, fontSize: 11, marginTop: 2 }}>{value}</Txt>
      )}
    </View>
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

const styles = StyleSheet.create({
  screenRoot: { flex: 1, backgroundColor: c.surface50 },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, backgroundColor: c.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.surface200, shadowColor: c.surface900, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  headerBack: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerTitle: { flex: 1, fontSize: 18 },
  headerActions: { gap: 8, flexShrink: 0 },
  headerUtilityActions: { gap: 8 },
  bottomNav: { position: 'absolute', left: 10, right: 10, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, borderRadius: 28, flexDirection: 'row', justifyContent: 'space-between', gap: 2, paddingTop: 9, paddingHorizontal: 6, shadowColor: c.surface950, shadowOpacity: 0.14, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 14 },
  bottomNavItem: { flex: 1, minWidth: 0, minHeight: 52, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, paddingVertical: 6, borderRadius: 18 },
  bottomNavItemActive: { backgroundColor: c.formalio50 },
  bottomNavAddItem: { transform: [{ translateY: -18 }], minHeight: 52 },
  bottomNavLabel: { fontSize: 9.5, lineHeight: 12, marginTop: 3, textAlign: 'center' },
  addTab: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: c.formalio700, shadowColor: c.formalio900, shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  card: { backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, padding: 14, shadowColor: c.surface900, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  primaryButton: { minHeight: 54, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1, paddingHorizontal: 14, overflow: 'hidden', position: 'relative', shadowColor: c.formalio900, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  primaryButtonFill: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, borderWidth: 1 },
  primaryButtonFillDisabled: { opacity: 1 },
  primaryButtonContent: { justifyContent: 'center', gap: 8, minWidth: 0, zIndex: 1, paddingVertical: 6 },
  primaryButtonDisabled: { shadowOpacity: 0, elevation: 0 },
  authFull: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  decorativeOrb: { position: 'absolute', width: 260, height: 260, borderRadius: 180 },
  softOrb: { position: 'absolute', width: 150, height: 150, borderRadius: 100 },
  authShell: { flex: 1 },
  welcomeScreen: { flexGrow: 1, justifyContent: 'space-between' },
  welcomeCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  welcomeTitle: { marginTop: 26, textAlign: 'center', fontSize: 24, lineHeight: 30 },
  welcomeCopy: { marginTop: 12, maxWidth: 310, textAlign: 'center', color: c.surface500, fontSize: 14, lineHeight: 21 },
  chipWrap: { marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chipWrapLeft: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  welcomeActions: { paddingHorizontal: 24, paddingTop: 14, gap: 12, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.surface100, shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 18, shadowOffset: { width: 0, height: -8 }, elevation: 8 },
  authPrimaryButton: { width: '100%', minHeight: 56, shadowOpacity: 0.16, shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 6 },
  authSecondaryButton: { width: '100%', minHeight: 54, borderColor: c.formalio200, backgroundColor: c.white, shadowColor: c.surface900, shadowOpacity: 0.05, shadowRadius: 12, elevation: 2 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: c.surface200 },
  dotActive: { width: 32, backgroundColor: c.formalio700 },
  formScreen: { flexGrow: 1, padding: 24, paddingBottom: 32 },
  formScreenCompact: { paddingTop: 18, paddingBottom: 24 },
  authFormStack: { marginTop: 24, gap: 15 },
  authBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface50, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  authTitle: { fontSize: 24, lineHeight: 31, marginTop: 20 },
  authSubtitle: { color: c.surface500, fontSize: 14, marginTop: 5, lineHeight: 20 },
  segment: { width: '100%', backgroundColor: c.surface100, borderRadius: 14, borderWidth: 1, borderColor: c.surface100, padding: 5, overflow: 'hidden' },
  segmentTrack: { flexDirection: 'row', alignItems: 'stretch', gap: 5 },
  segmentTrackFill: { width: '100%' },
  segmentTrackCompact: { gap: 3 },
  segmentTrackAndroidTight: { gap: 4 },
  segmentScrollContent: { flexDirection: 'row', gap: 5 },
  segmentTap: { flex: 1, minWidth: 0 },
  segmentTapScrollable: { flex: 0, minWidth: 104 },
  segmentItem: { width: '100%', borderRadius: 11, minHeight: 44, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 8, position: 'relative', overflow: 'hidden' },
  segmentItemCompact: { gap: 4, paddingHorizontal: 6 },
  segmentAndroidCell: { flexGrow: 1, flexShrink: 1, flexBasis: 0, minWidth: 0, minHeight: 42, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 2, position: 'relative', overflow: 'hidden' },
  segmentAndroidCellSelected: { backgroundColor: c.white, shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentLabel: { fontSize: 10.5, lineHeight: 14, textAlign: 'center', flexShrink: 1 },
  segmentLabelCompact: { fontSize: 10, lineHeight: 13 },
  segmentLabelAndroidTight: { width: '100%', fontSize: 9.4, lineHeight: 12, letterSpacing: 0 },
  segmentSelected: { backgroundColor: c.white, shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentGlow: { position: 'absolute', left: 12, right: 12, bottom: 0, height: 2, borderRadius: 2, backgroundColor: c.formalio400 },
  segmentAndroidGlow: { position: 'absolute', left: 8, right: 8, bottom: 0, height: 2, borderRadius: 2, backgroundColor: c.formalio400 },
  segmentGlowCompact: { left: 8, right: 8 },
  inputBox: { minHeight: 58, borderRadius: 18, backgroundColor: c.surface50, borderWidth: 2, borderColor: c.surface100, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  inputBoxFocused: { borderColor: c.formalio300, backgroundColor: c.white, shadowColor: c.formalio900, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  calculatedInputBox: { borderColor: c.info100, backgroundColor: c.info50 },
  textInput: { flex: 1, minHeight: 30, color: c.surface900, fontFamily: font.medium, fontSize: 15, lineHeight: 21, paddingVertical: 2, paddingHorizontal: 0, includeFontPadding: false },
  fieldLabel: { color: c.surface700, fontSize: 12, marginBottom: 6 },
  vDivider: { width: 1, height: 20, backgroundColor: c.surface300 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.surface200 },
  strengthBar: { flex: 1, height: 6, borderRadius: 6 },
  biometricLoginCard: { borderRadius: 20, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 13, gap: 12, shadowColor: c.formalio900, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 5 }, elevation: 2 },
  biometricLoginIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center', backgroundColor: c.white, borderWidth: 1, borderColor: c.formalio100 },
  biometricLoginButton: { minHeight: 46, borderColor: c.formalio200, backgroundColor: c.white },
  biometricCircle: { width: 128, height: 128, borderRadius: 64, backgroundColor: c.formalio50, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  successScreen: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  welcomeBackCard: { width: '100%', marginTop: 24, padding: 18, borderColor: c.formalio200, shadowColor: c.formalio900, shadowOpacity: 0.08, shadowRadius: 14, elevation: 3 },
  welcomeBackRow: { justifyContent: 'space-between', gap: 12, minHeight: 38, paddingVertical: 6, borderTopWidth: 1, borderTopColor: c.surface100 },
  checkBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.formalio100, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  otpBox: { width: 48, height: 58, borderRadius: 17, backgroundColor: c.surface50, borderWidth: 1, borderColor: c.surface200, textAlign: 'center', fontFamily: font.bold, fontSize: 21, color: c.surface900, paddingVertical: 8 },
  bubble: { position: 'absolute', backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, shadowColor: c.surface900, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  halo: { position: 'absolute' },
  toastHost: { position: 'absolute', left: 0, right: 0, zIndex: 300, alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  toast: { width: '100%', maxWidth: 390, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', shadowColor: c.surface950, shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  valueTrack: { height: 8, borderRadius: 99, overflow: 'hidden' },
  valueFill: { height: '100%', borderRadius: 99 },
  headerSpacer: { width: 40 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.formalio100, borderWidth: 2, borderColor: c.white, alignItems: 'center', justifyContent: 'center', overflow: 'hidden', shadowColor: c.surface900, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: c.danger500 },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: c.amber50 },
  modeToggle: { minWidth: 74, height: 40, borderRadius: 14, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 9 },
  modeToggleOffline: { borderColor: c.amber200, backgroundColor: c.amber50 },
  balanceCard: { borderRadius: 26, padding: 20, marginBottom: 16, overflow: 'hidden', shadowColor: c.surface900, shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,.1)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 },
  balanceDetail: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9 },
  dashboardQuickRow: { flexDirection: 'row', alignItems: 'stretch', width: '100%', marginBottom: 2 },
  dashboardQuickCell: { flex: 1, minWidth: 0 },
  dashboardQuickCellGap: { marginRight: 6 },
  quickAction: { minHeight: 106, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, borderRadius: 18, paddingHorizontal: 8, paddingVertical: 12, alignItems: 'center', justifyContent: 'center', shadowColor: c.surface900, shadowOpacity: 0.08, shadowRadius: 14, shadowOffset: { width: 0, height: 5 }, elevation: 3 },
  quickActionCompact: { minHeight: 90, borderRadius: 16, paddingHorizontal: 4, paddingVertical: 9 },
  quickActionUltraCompact: { minHeight: 84, borderRadius: 15, paddingHorizontal: 3, paddingVertical: 8 },
  quickIcon: { width: 40, height: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  quickIconCompact: { width: 32, height: 32, borderRadius: 11, marginBottom: 6 },
  quickValue: { fontSize: 15, lineHeight: 18 },
  quickValueCompact: { fontSize: 12, lineHeight: 15, textAlign: 'center' },
  quickLabel: { color: c.surface500, fontSize: 10, lineHeight: 13, marginTop: 3 },
  quickLabelCompact: { fontSize: 8.5, lineHeight: 11, textAlign: 'center' },
  actionCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, padding: 14, shadowColor: c.surface900, shadowOpacity: 0.035, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  actionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  aiAccounting: { borderRadius: 18, padding: 16, marginBottom: 16, overflow: 'hidden', shadowColor: c.surface900, shadowOpacity: 0.12, shadowRadius: 16, elevation: 5 },
  aiIconBox: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  newBadge: { backgroundColor: c.gold500, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  mosikaTip: { flexDirection: 'row', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 14 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, paddingHorizontal: 8 },
  transactionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  stockValueCard: { borderColor: c.info100, backgroundColor: c.info50, padding: 16 },
  stockValueLink: { alignSelf: 'flex-start', marginTop: 12, minHeight: 36, borderRadius: 999, backgroundColor: c.white, borderWidth: 1, borderColor: c.info100, paddingHorizontal: 12, paddingVertical: 8, flexDirection: 'row', alignItems: 'center', gap: 4 },
  stockHeaderCard: { borderColor: c.formalio100, backgroundColor: c.white, padding: 15 },
  stockEmbeddedHeader: { borderColor: c.formalio100, backgroundColor: c.formalio50, padding: 15 },
  stockAddButton: { minHeight: 42, minWidth: 104, borderRadius: 14, paddingHorizontal: 12, flexShrink: 0 },
  stockEmptyState: { alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, paddingHorizontal: 22, paddingVertical: 34 },
  stockEmptyButton: { marginTop: 14, minHeight: 40, borderRadius: 13, backgroundColor: c.formalio700, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14 },
  stockItemCard: { gap: 12, padding: 12 },
  stockItemCardMuted: { backgroundColor: c.surface50 },
  stockItemIcon: { width: 38, height: 38, borderRadius: 13, backgroundColor: c.formalio50, alignItems: 'center', justifyContent: 'center' },
  stockIconButton: { width: 34, height: 34, borderRadius: 11, backgroundColor: c.info50, borderWidth: 1, borderColor: c.info100, alignItems: 'center', justifyContent: 'center' },
  stockDeleteButton: { backgroundColor: c.danger50, borderColor: c.danger100 },
  stockMetaCell: { minHeight: 64, borderRadius: 13, borderWidth: 1, borderColor: c.surface100, backgroundColor: c.surface50, padding: 9, justifyContent: 'center' },
  stockMetaLabel: { color: c.surface400, fontSize: 9.5, marginBottom: 3 },
  stockMetaValue: { color: c.surface800, fontSize: 10.5, lineHeight: 14 },
  stockSalePanel: { gap: 8, borderRadius: 18, borderWidth: 1, borderColor: c.formalio100, backgroundColor: c.formalio50, padding: 12 },
  stockSaleList: { gap: 8 },
  stockSaleOption: { minHeight: 58, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, padding: 11, justifyContent: 'center' },
  stockSaleOptionSelected: { borderColor: c.formalio400, backgroundColor: c.white },
  stockSaleOptionDisabled: { minHeight: 50, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface100, padding: 11, justifyContent: 'center' },
  autoCalcHint: { alignItems: 'flex-start', gap: 7, borderRadius: 14, borderWidth: 1, borderColor: c.info100, backgroundColor: c.info50, paddingHorizontal: 11, paddingVertical: 9 },
  lockedFieldBadge: { gap: 4, flexShrink: 1, borderRadius: 999, backgroundColor: c.white, borderWidth: 1, borderColor: c.info100, paddingHorizontal: 8, paddingVertical: 5 },
  paymentMethodInline: { flexDirection: 'row', alignItems: 'center', gap: 5, minWidth: 0, flexShrink: 1 },
  paymentMethodMiniIcon: { borderWidth: 1, borderColor: c.surface100, shadowColor: c.surface900, shadowOpacity: 0.04, shadowRadius: 4, elevation: 1 },
  paymentBrandPill: { paddingLeft: 6, paddingRight: 9, paddingVertical: 5 },
  filterIconActive: { borderColor: c.formalio200, backgroundColor: c.formalio50 },
  filterActiveDot: { position: 'absolute', top: 7, right: 7, width: 7, height: 7, borderRadius: 4, backgroundColor: c.formalio600 },
  filterPanel: { gap: 13, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, padding: 13, marginBottom: 14 },
  filterChip: { minHeight: 34, borderRadius: 999, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, paddingHorizontal: 12, alignItems: 'center', justifyContent: 'center' },
  filterChipActive: { borderColor: c.formalio300, backgroundColor: c.formalio50 },
  noResultsState: { alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, paddingHorizontal: 24, paddingVertical: 42 },
  clearFiltersButton: { marginTop: 14, borderRadius: 999, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, paddingHorizontal: 14, paddingVertical: 9 },
  loanCard: { flexDirection: 'row', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: c.gold200, backgroundColor: c.gold50, padding: 14, marginBottom: 4 },
  loanIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center', backgroundColor: c.gold100 },
  loanButton: { alignSelf: 'flex-start', backgroundColor: c.gold500, borderRadius: 9, paddingHorizontal: 12, paddingVertical: 7, marginTop: 9 },
  aiFabDock: { position: 'absolute', right: 18, bottom: 104, zIndex: 90 },
  aiFab: { width: 58, height: 58, borderRadius: 29, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center', shadowColor: c.surface950, shadowOpacity: 0.24, shadowRadius: 22, shadowOffset: { width: 0, height: 11 }, elevation: 12 },
  aiFabInner: { width: 50, height: 50, borderRadius: 25, alignItems: 'center', justifyContent: 'center' },
  aiFabBadge: { position: 'absolute', right: -2, top: -4, backgroundColor: c.gold500, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  transactionPreview: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, padding: 13 },
  transactionPreviewIcon: { width: 40, height: 40, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  ocrAutofillCard: { borderRadius: 18, borderWidth: 1, borderColor: c.info200, backgroundColor: c.info50, padding: 13 },
  ocrAutofillCell: { borderRadius: 12, borderWidth: 1, borderColor: c.info100, backgroundColor: c.white, padding: 10 },
  ocrRetryButton: { flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, paddingHorizontal: 10, paddingVertical: 7 },
  addTransactionActions: { gap: 12, marginTop: 8, paddingBottom: 36 },
  formActionButton: { minHeight: 52, borderRadius: 16 },
  choiceCard: { minWidth: 0, minHeight: 74, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6, shadowColor: c.surface900, shadowOpacity: 0.035, shadowRadius: 8, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  choiceIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  mobileMoneyChoiceIcon: { borderWidth: 1, borderColor: c.surface200, shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 6, elevation: 1 },
  choiceSelected: { borderColor: c.formalio300, backgroundColor: c.formalio50 },
  choiceSelectedExpense: { borderColor: c.danger200, backgroundColor: c.danger50 },
  selectChip: { minHeight: 36, borderRadius: 10, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, paddingHorizontal: 12, paddingVertical: 8, alignItems: 'center', justifyContent: 'center' },
  selectChipActive: { borderColor: c.formalio300, backgroundColor: c.formalio50 },
  selectChipExpenseActive: { borderColor: c.danger200, backgroundColor: c.danger50 },
  treasuryHero: { borderRadius: 26, padding: 16, overflow: 'hidden' },
  glassIcon: { width: 48, height: 48, borderRadius: 16, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  glassIconSmall: { width: 40, height: 40, borderRadius: 13, backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  metricCard: { borderRadius: 18, borderWidth: 1, padding: 14 },
  insightBox: { borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 12 },
  scoreHero: { borderRadius: 26, padding: 16, overflow: 'hidden' },
  scoreRingCenter: { position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, alignItems: 'center', justifyContent: 'center' },
  scoreChip: { backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 16, padding: 9, marginTop: 14 },
  metricIcon: { width: 32, height: 32, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  adviceCard: { flexDirection: 'row', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 14 },
  loanEligible: { flexDirection: 'row', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: c.gold200, backgroundColor: c.gold50, padding: 14 },
  smallRound: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.surface100, alignItems: 'center', justifyContent: 'center' },
  durationButton: { minHeight: 36, borderRadius: 12, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, alignItems: 'center', justifyContent: 'center' },
  durationButtonActive: { backgroundColor: c.formalio700, borderColor: c.formalio700, shadowColor: c.formalio900, shadowOpacity: 0.12, shadowRadius: 8, elevation: 2 },
  loanDrawer: { maxHeight: '92%', backgroundColor: c.white, borderTopLeftRadius: 26, borderTopRightRadius: 26, overflow: 'hidden' },
  loanDrawerHeader: { paddingHorizontal: 18, paddingTop: 10, paddingBottom: 18 },
  drawerHandle: { alignSelf: 'center', width: 38, height: 4, borderRadius: 4, backgroundColor: 'rgba(255,255,255,.32)', marginBottom: 14 },
  loanDrawerContent: { padding: 16, gap: 14, paddingBottom: 22 },
  loanEligibilityCard: { borderRadius: 20, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 14, shadowColor: c.formalio900, shadowOpacity: 0.05, shadowRadius: 10, elevation: 1 },
  loanPurposeSelect: { minHeight: 44, borderRadius: 13, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, paddingHorizontal: 12, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  loanPurposeMenu: { marginTop: 8, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, overflow: 'hidden' },
  loanPurposeItem: { minHeight: 42, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: 12, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.surface100 },
  loanCalcCard: { minHeight: 112, borderRadius: 18, borderWidth: 1, padding: 12, overflow: 'hidden' },
  loanCalcIcon: { width: 31, height: 31, borderRadius: 11, alignItems: 'center', justifyContent: 'center', shadowColor: c.surface900, shadowOpacity: 0.05, shadowRadius: 8, elevation: 1 },
  validationRow: { alignItems: 'flex-start', gap: 8, marginTop: 7 },
  validationDot: { width: 8, height: 8, borderRadius: 4, marginTop: 4 },
  termsRow: { flexDirection: 'row', alignItems: 'flex-start', gap: 10, borderRadius: 16, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, padding: 12 },
  checkbox: { width: 22, height: 22, borderRadius: 7, borderWidth: 1, borderColor: c.surface300, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center' },
  checkboxActive: { borderColor: c.formalio700, backgroundColor: c.formalio700 },
  loanStickyFooter: { borderTopWidth: 1, borderTopColor: c.surface200, backgroundColor: c.white, padding: 14, shadowColor: c.surface950, shadowOpacity: 0.08, shadowRadius: 16, shadowOffset: { width: 0, height: -8 }, elevation: 8 },
  loanSuccessCard: { padding: 22, alignItems: 'center' },
  successSummary: { width: '100%', borderRadius: 16, backgroundColor: c.surface50, padding: 12, marginTop: 16, marginBottom: 16 },
  infoCallout: { flexDirection: 'row', alignItems: 'flex-start', gap: 8, borderRadius: 16, borderWidth: 1, borderColor: c.info200, backgroundColor: c.info50, padding: 12 },
  exportButton: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: c.formalio700, borderRadius: 9, paddingHorizontal: 11, paddingVertical: 7 },
  reportHero: { borderRadius: 18, padding: 16, marginBottom: 16 },
  reportTap: { width: '100%' },
  reportRow: { width: '100%', minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 10, backgroundColor: c.white, borderRadius: 16, borderWidth: 1, borderColor: c.surface200, paddingHorizontal: 12, paddingVertical: 12, shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  reportRowBody: { flex: 1, minWidth: 0 },
  reportRowAction: { flexShrink: 0, gap: 6 },
  reportBadge: { flexShrink: 0 },
  loanEmptyState: { flexDirection: 'row', alignItems: 'flex-start', gap: 11, borderRadius: 18, borderWidth: 1, borderColor: c.gold200, backgroundColor: c.gold50, padding: 14 },
  loanTrackingCard: { borderRadius: 18, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, padding: 14, shadowColor: c.surface900, shadowOpacity: 0.04, shadowRadius: 10, elevation: 1 },
  loanStatusBadge: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  loanDetailHero: { borderRadius: 24, padding: 16, overflow: 'hidden' },
  loanTimelineRow: { gap: 10, alignItems: 'flex-start', borderTopWidth: 1, borderTopColor: c.surface100, paddingVertical: 10 },
  loanTimelineNode: { width: 30, height: 30, borderRadius: 15, alignItems: 'center', justifyContent: 'center' },
  reportLine: { justifyContent: 'space-between', paddingVertical: 10 },
  reportStamp: { flexDirection: 'row', alignItems: 'center', gap: 6, borderRadius: 12, backgroundColor: c.formalio50, padding: 10, marginTop: 12 },
  reportInsightCallout: { flexDirection: 'row', gap: 10, borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 13 },
  reportDetailHero: { borderRadius: 24, padding: 16, overflow: 'hidden' },
  reportScoreRing: { width: 58, height: 58, borderRadius: 29, borderWidth: 1, borderColor: 'rgba(255,255,255,.22)', backgroundColor: 'rgba(255,255,255,.1)', alignItems: 'center', justifyContent: 'center' },
  reportMetricCard: { minHeight: 112, padding: 12 },
  reportMetricAccent: { width: 20, height: 3, borderRadius: 3 },
  reportDocumentCard: { padding: 18, marginBottom: 14 },
  reportExportPanel: { padding: 16, marginBottom: 12, borderColor: c.formalio200 },
  exportBadge: { width: 40, height: 40, borderRadius: 13, backgroundColor: c.formalio50, alignItems: 'center', justifyContent: 'center' },
  exportFormatMini: { minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7, paddingHorizontal: 8 },
  moneyLogo: { width: 48, height: 48, borderRadius: 14, alignItems: 'center', justifyContent: 'center' },
  syncRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', backgroundColor: c.surface50, borderRadius: 11, padding: 10 },
  notificationCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, padding: 14 },
  notificationIcon: { width: 36, height: 36, borderRadius: 11, alignItems: 'center', justifyContent: 'center' },
  unreadDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.formalio500, marginTop: 6 },
  aiHeaderCard: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 12, marginBottom: 16 },
  insightCard: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 18, borderWidth: 1, padding: 14 },
  taxAlert: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: c.amber200, backgroundColor: c.amber50, padding: 14, marginBottom: 16 },
  taxButton: { alignSelf: 'flex-start', borderRadius: 9, backgroundColor: c.amber500, paddingHorizontal: 12, paddingVertical: 7, marginTop: 9 },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  profileHero: { paddingHorizontal: 18, paddingTop: 54, paddingBottom: 26, minHeight: 178, overflow: 'hidden', justifyContent: 'flex-end' },
  profileTopActions: { position: 'absolute', top: 18, right: 16, zIndex: 3 },
  profileAvatar: { width: 72, height: 72, borderRadius: 36, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  profileCheck: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: c.formalio500, borderWidth: 2, borderColor: c.formalio800, alignItems: 'center', justifyContent: 'center' },
  profileCompletionCard: { marginBottom: 12, borderColor: c.formalio200 },
  profileEditorCard: { marginBottom: 12, padding: 16, borderColor: c.surface200, shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  profileMiniButton: { minHeight: 40, borderRadius: 13, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 14, backgroundColor: c.surface100, borderWidth: 1, borderColor: c.surface200 },
  profileMiniButtonPrimary: { backgroundColor: c.formalio700, borderColor: c.formalio700, shadowColor: c.formalio900, shadowOpacity: 0.14, shadowRadius: 10, elevation: 3 },
  avatarSelector: { borderRadius: 16, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, padding: 12 },
  avatarGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  avatarChoice: { width: 78, minHeight: 96, borderRadius: 16, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center', gap: 5, paddingVertical: 8 },
  avatarChoiceSelected: { borderColor: c.formalio500, backgroundColor: c.formalio50, transform: [{ scale: 1.02 }] },
  coverThemeGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 10 },
  coverThemeChoice: { flexGrow: 1, minWidth: 132, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, padding: 9, gap: 7 },
  coverThemeChoiceSelected: { borderColor: c.formalio500, backgroundColor: c.formalio50 },
  coverThemeSwatch: { height: 34, borderRadius: 10 },
  profileInfoRow: { gap: 10, minHeight: 50, paddingVertical: 7, borderTopWidth: 1, borderTopColor: c.surface100 },
  profileMenu: { backgroundColor: c.white, borderRadius: 20, borderWidth: 1, borderColor: c.surface200, overflow: 'hidden', shadowColor: c.surface900, shadowOpacity: 0.07, shadowRadius: 14, elevation: 3 },
  profileMenuTap: { width: '100%' },
  profileMenuItem: { width: '100%', flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 11, minHeight: 58, paddingHorizontal: 14, paddingVertical: 12 },
  profileMenuIcon: { width: 32, height: 32, borderRadius: 11, backgroundColor: c.surface50, alignItems: 'center', justifyContent: 'center', flexShrink: 0 },
  profileMenuLabel: { flex: 1, minWidth: 0, color: c.surface700, fontSize: 13, lineHeight: 17 },
  profileMenuBadge: { flexShrink: 0 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 16 },
  settingsList: { backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, overflow: 'hidden', marginBottom: 16 },
  settingsItem: { gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  languageChoice: { minHeight: 46, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, alignItems: 'center', justifyContent: 'center' },
  languageChoiceActive: { borderColor: c.formalio500, backgroundColor: c.formalio50 },
  switchTrack: { width: 44, height: 24, borderRadius: 12, backgroundColor: c.surface300, padding: 4 },
  switchThumb: { width: 16, height: 16, borderRadius: 8, backgroundColor: c.white },
  securityCallout: { flexDirection: 'row', alignItems: 'flex-start', gap: 12, borderRadius: 14, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 14 },
  subscriptionHero: { borderRadius: 18, padding: 20, alignItems: 'center', marginBottom: 16 },
  renewalPill: { flexDirection: 'row', alignItems: 'center', gap: 5, backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 999, paddingHorizontal: 12, paddingVertical: 6, marginTop: 12 },
  helpRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, borderRadius: 14, padding: 14 },
  referralCard: { alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: c.gold200, padding: 20, marginBottom: 16 },
  copyCode: { backgroundColor: c.gold500, borderRadius: 9, paddingHorizontal: 16, paddingVertical: 9, marginTop: 12 },
  kycCard: { marginBottom: 12, padding: 15, borderColor: c.formalio200 },
  kycStatusPill: { alignSelf: 'flex-start', flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, paddingHorizontal: 9, paddingVertical: 5 },
  kycStepper: { gap: 7, paddingVertical: 12 },
  kycStepDot: { width: 28, height: 28, borderRadius: 14, backgroundColor: c.surface100, alignItems: 'center', justifyContent: 'center', borderWidth: 1, borderColor: c.surface200 },
  kycStepDotActive: { backgroundColor: c.formalio700, borderColor: c.formalio700 },
  kycStepBody: { borderRadius: 18, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, padding: 13, marginBottom: 12 },
  kycChoice: { minHeight: 48, borderRadius: 13, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, alignItems: 'center', justifyContent: 'center', padding: 8 },
  kycChoiceActive: { borderColor: c.formalio300, backgroundColor: c.formalio50 },
  kycUploadTile: { minHeight: 136, borderRadius: 16, borderWidth: 1, borderColor: c.surface200, overflow: 'hidden', justifyContent: 'center' },
  kycUploadInner: { minHeight: 136, alignItems: 'center', justifyContent: 'center', padding: 12 },
  kycUploadButton: { flexDirection: 'row', alignItems: 'center', gap: 4, borderRadius: 999, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, paddingHorizontal: 9, paddingVertical: 6 },
  kycReviewBox: { borderRadius: 14, backgroundColor: c.surface50, padding: 12 },
  kycStatusHero: { borderRadius: 18, padding: 16 },
  kycStatusRow: { minHeight: 44, flexDirection: 'row', alignItems: 'center', gap: 9, borderRadius: 13, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, paddingHorizontal: 12 },
  pnlHero: { borderRadius: 26, padding: 16, overflow: 'hidden' },
  glassMetric: { backgroundColor: 'rgba(255,255,255,.1)', borderRadius: 12, padding: 10, marginTop: 14 },
  aiInsightsBanner: { flexDirection: 'row', alignItems: 'center', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: c.info200, backgroundColor: c.info50, padding: 12 },
  aiBannerIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
  accQuick: { flexDirection: 'row', alignItems: 'center', gap: 10, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, padding: 12 },
  aiMiniButton: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: c.formalio700, borderRadius: 9, paddingHorizontal: 10, paddingVertical: 7 },
  salesHero: { borderRadius: 26, padding: 16 },
  liveDot: { width: 8, height: 8, borderRadius: 4, backgroundColor: c.formalio500 },
  tinyDot: { width: 7, height: 7, borderRadius: 4, backgroundColor: c.formalio500 },
  anomalyRow: { gap: 8, borderTopWidth: 1, borderTopColor: c.surface100, paddingVertical: 9 },
  aiAccountantHero: { borderRadius: 26, padding: 16, overflow: 'hidden' },
  optimizationBox: { borderRadius: 18, borderWidth: 1, borderColor: c.gold200, backgroundColor: c.gold50, padding: 12 },
  aiReportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, padding: 12 },
  modalBackdrop: { flex: 1, justifyContent: 'flex-end', padding: 16, backgroundColor: 'rgba(15,23,42,.72)' },
  modalCard: { width: '100%', maxWidth: 430, alignSelf: 'center', borderRadius: 26, backgroundColor: c.white, overflow: 'hidden' },
  assistantModal: { maxHeight: '90%', backgroundColor: c.white },
  assistantHeader: { padding: 16, backgroundColor: c.white, borderBottomWidth: 1, borderBottomColor: c.surface200 },
  assistantHeaderIcon: { width: 36, height: 36, borderRadius: 12, backgroundColor: c.formalio50, alignItems: 'center', justifyContent: 'center' },
  closeButton: { width: 32, height: 32, borderRadius: 16, backgroundColor: c.surface100, alignItems: 'center', justifyContent: 'center' },
  messageRow: { flexDirection: 'row' },
  messageBubble: { maxWidth: '86%', borderRadius: 18, padding: 13 },
  userBubble: { backgroundColor: c.formalio700, borderBottomRightRadius: 5 },
  aiBubble: { backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, borderBottomLeftRadius: 5 },
  suggestions: { flexDirection: 'row', flexWrap: 'wrap', gap: 8, marginTop: 10 },
  suggestionChip: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: c.formalio50, borderRadius: 999, paddingHorizontal: 10, paddingVertical: 6 },
  assistantScroll: { maxHeight: 492, backgroundColor: c.surface50 },
  assistantActionBar: { backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.surface200, paddingHorizontal: 12, paddingTop: 8 },
  assistantActionPill: { flexDirection: 'row', alignItems: 'center', gap: 6, backgroundColor: c.surface50, borderWidth: 1, borderColor: c.surface200, borderRadius: 999, paddingHorizontal: 12, paddingVertical: 7 },
  assistantActionPillActive: { backgroundColor: c.formalio50, borderColor: c.formalio200 },
  voiceNotePanel: { borderTopWidth: 1, borderTopColor: c.surface200, backgroundColor: c.white, paddingHorizontal: 14, paddingVertical: 12 },
  recordingMicWrap: { width: 42, height: 42, alignItems: 'center', justifyContent: 'center' },
  voicePulseRing: { position: 'absolute', width: 42, height: 42, borderRadius: 21, backgroundColor: c.formalio700 },
  recordingMic: { width: 34, height: 34, borderRadius: 17, backgroundColor: c.formalio700, alignItems: 'center', justifyContent: 'center' },
  voiceControlButton: { flex: 1, minHeight: 38, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 6, paddingHorizontal: 10 },
  voiceStopButton: { backgroundColor: c.danger500, borderColor: c.danger500 },
  voiceSendButton: { backgroundColor: c.formalio700, borderColor: c.formalio700 },
  assistantInputArea: { flexDirection: 'row', alignItems: 'center', gap: 8, backgroundColor: c.white, borderTopWidth: 1, borderTopColor: c.surface200, padding: 12 },
  assistantMicButton: { width: 42, height: 42, borderRadius: 21, backgroundColor: c.formalio50, borderWidth: 1, borderColor: c.formalio200, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  assistantMicButtonRecording: { backgroundColor: c.danger500, borderColor: c.danger500 },
  assistantMic: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface100, alignItems: 'center', justifyContent: 'center' },
  assistantInput: { flex: 1, minHeight: 42, borderRadius: 21, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, paddingHorizontal: 14, justifyContent: 'center' },
  sendButton: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.formalio700, alignItems: 'center', justifyContent: 'center' },
  voiceHeader: { justifyContent: 'space-between', padding: 16, borderBottomWidth: 1, borderBottomColor: c.surface200 },
  voiceBody: { padding: 22, alignItems: 'center' },
  waveformBox: { width: '100%', height: 86, alignItems: 'center', justifyContent: 'center', marginBottom: 12 },
  transcriptBox: { width: '100%', backgroundColor: c.surface50, borderRadius: 14, padding: 12 },
  parsedCard: { width: '100%', borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 14, marginBottom: 14 },
  refreshButton: { width: 50, minHeight: 46, borderRadius: 16, backgroundColor: c.surface100, alignItems: 'center', justifyContent: 'center' },
  downloadHeader: { padding: 18 },
  docPreview: { borderRadius: 18, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, padding: 14, marginBottom: 16 },
  docPaper: { backgroundColor: c.white, borderRadius: 9, padding: 14, shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 8, elevation: 1 },
  skeleton: { height: 8, borderRadius: 8, backgroundColor: c.surface200 },
  formatButton: { alignItems: 'center', borderWidth: 2, borderColor: c.surface200, borderRadius: 18, backgroundColor: c.white, padding: 14, marginBottom: 16 },
  formatIcon: { width: 50, height: 50, borderRadius: 14, alignItems: 'center', justifyContent: 'center', marginBottom: 8 },
  secondaryAction: { alignItems: 'center', gap: 5, backgroundColor: c.surface50, borderRadius: 13, padding: 12 },
  downloadProgress: { width: '100%', borderRadius: 18, backgroundColor: c.surface50, padding: 14, marginTop: 22 },
  completeFile: { width: '100%', flexDirection: 'row', gap: 12, alignItems: 'center', borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 14, marginBottom: 16 },
  ocrModal: { maxHeight: '92%', backgroundColor: c.white },
  ocrHeader: { padding: 16 },
  ocrDropZone: { minHeight: 58, borderRadius: 16, borderWidth: 1, borderStyle: 'dashed', borderColor: c.info100, backgroundColor: c.info50, flexDirection: 'row', alignItems: 'center', gap: 10, paddingHorizontal: 14, paddingVertical: 10 },
  ocrCameraBox: { height: 284, borderRadius: 22, backgroundColor: c.surface900, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  ocrFrame: { position: 'absolute', left: 34, right: 34, top: 42, bottom: 42, borderRadius: 18 },
  ocrCorner: { position: 'absolute', width: 34, height: 34, borderColor: c.formalio300 },
  ocrCornerTopLeft: { left: 0, top: 0, borderLeftWidth: 3, borderTopWidth: 3, borderTopLeftRadius: 18 },
  ocrCornerTopRight: { right: 0, top: 0, borderRightWidth: 3, borderTopWidth: 3, borderTopRightRadius: 18 },
  ocrCornerBottomLeft: { left: 0, bottom: 0, borderLeftWidth: 3, borderBottomWidth: 3, borderBottomLeftRadius: 18 },
  ocrCornerBottomRight: { right: 0, bottom: 0, borderRightWidth: 3, borderBottomWidth: 3, borderBottomRightRadius: 18 },
  ocrScanLine: { position: 'absolute', left: 42, right: 42, top: 116, height: 3, borderRadius: 3, backgroundColor: c.formalio400, shadowColor: c.formalio400, shadowOpacity: 1, shadowRadius: 14 },
  ocrCameraOverlay: { ...StyleSheet.absoluteFillObject, alignItems: 'center', justifyContent: 'center', padding: 18 },
  ocrPermissionCard: { width: '86%', borderRadius: 18, backgroundColor: c.white, padding: 16, alignItems: 'center' },
  ocrProcessingCard: { borderRadius: 18, backgroundColor: c.white, padding: 16, alignItems: 'center', minWidth: 210 },
  ocrSuccessBadge: { flexDirection: 'row', alignItems: 'center', gap: 7, borderRadius: 999, backgroundColor: c.formalio600, paddingHorizontal: 13, paddingVertical: 8 },
  ocrSignalCard: { padding: 12 },
  ocrResultCard: { borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 14 },
  ocrDataCell: { borderRadius: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.formalio100, padding: 10 },
  ocrToolButton: { width: 44, height: 44, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center' },
  ocrManualFallback: { minHeight: 42, borderRadius: 13, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.surface50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 7 },
  scannerBox: { height: 224, marginTop: 16, borderRadius: 18, backgroundColor: c.surface900, overflow: 'hidden', alignItems: 'center', justifyContent: 'center' },
  scannerFrame: { position: 'absolute', left: 24, right: 24, top: 24, bottom: 24, borderRadius: 13, borderWidth: 2, borderColor: c.formalio300, borderStyle: 'dashed' },
  scanLine: { position: 'absolute', left: 24, right: 24, top: 80, height: 2, backgroundColor: c.formalio400, shadowColor: c.formalio400, shadowOpacity: 1, shadowRadius: 12 },
  detectedBox: { borderRadius: 18, backgroundColor: c.formalio50, padding: 14, marginTop: 16 },
  detectedCell: { alignItems: 'center', backgroundColor: c.white, borderRadius: 12, padding: 9, marginTop: 8 },
  confettiLayer: { ...StyleSheet.absoluteFillObject, zIndex: 250 },
});
