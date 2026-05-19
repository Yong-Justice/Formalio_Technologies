import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Dimensions,
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
  aiInsights,
  cashFlowData,
  creditScoreHistory,
  notifications as initialNotifications,
  pricingPlans,
  transactions as initialTransactions,
  type Transaction,
} from './demoData';
import { formalioBackend } from '@/services/cloud/formalioBackend';

const { width: viewportWidth } = Dimensions.get('window');
const contentMaxWidth = Math.min(viewportWidth, 430);

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
  profileImageUri?: string;
  bannerImageUri?: string;
  kycStatus: KycStatus;
};

type KycStatus = 'pending' | 'under-review' | 'approved' | 'rejected';

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
  storeName: 'Boutique Elegance',
  storeDescription: 'Mode, tissus wax et accessoires premium pour clientes urbaines.',
  ownerFullName: 'Marie Nkono',
  phone: '+237 6 77 45 20 11',
  email: 'marie@boutique-elegance.cm',
  category: 'Commerce',
  address: 'Akwa, Douala, Cameroun',
  kycStatus: 'pending',
};

const mascotImages: Record<MascotState, number> = {
  idle: require('../../assets/prototype/mascot-onboarding.png'),
  wave: require('../../assets/prototype/mascot-onboarding.png'),
  thinking: require('../../assets/prototype/mascot-thinking.png'),
  celebrate: require('../../assets/prototype/mascot-celebrate.png'),
  secure: require('../../assets/prototype/mascot-secure.png'),
  listening: require('../../assets/prototype/mascot-hero.png'),
  sleeping: require('../../assets/prototype/mascot-onboarding.png'),
  loading: require('../../assets/prototype/mascot-thinking.png'),
  success: require('../../assets/prototype/mascot-celebrate.png'),
  error: require('../../assets/prototype/mascot-secure.png'),
  pointing: require('../../assets/prototype/mascot-hero.png'),
};

const officialLogo = require('../../assets/images/official-logo.png');

function Txt({
  children,
  style,
  weight = 'regular',
  numberOfLines,
}: {
  children: React.ReactNode;
  style?: StyleProp<TextStyle>;
  weight?: keyof typeof font;
  numberOfLines?: number;
}) {
  return (
    <Text maxFontSizeMultiplier={1.08} numberOfLines={numberOfLines} style={[{ fontFamily: font[weight], color: c.surface900 }, style]}>
      {children}
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
      style={({ pressed }) => [
        style,
        disabled && { opacity: 0.55 },
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
  return (
    <Tap disabled={disabled} onPress={onPress} style={[styles.primaryButton, { backgroundColor: colors.bg, borderColor: colors.border }, style]}>
      <Row style={{ justifyContent: 'center', gap: 8 }}>
        {icon ? <Icon icon={icon} size={17} color={colors.text} /> : null}
        <Txt weight="bold" style={{ color: colors.text, fontSize: 14 }}>
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
  const width = contentMaxWidth - 64;
  const chartHeight = height - 24;
  const max = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k] ?? 0))), 1);
  const slot = width / data.length;
  const barWidth = Math.min(14, slot / (keys.length + 1));
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
          {labels ? (
            <TextSvg x={i * slot + slot / 2} y={height - 4} textAnchor="middle" fill={c.surface400} fontSize="9">
              {d.name ?? d.label}
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
  const width = contentMaxWidth - 64;
  const chartHeight = height - 24;
  const max = Math.max(...data.flatMap((d) => keys.map((k) => Number(d[k] ?? 0))), 1);
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
      {data.map((d, i) => (
        <TextSvg key={d.name ?? d.label ?? i} x={data.length === 1 ? width / 2 : (i / (data.length - 1)) * width} y={height - 4} textAnchor="middle" fill={c.surface400} fontSize="9">
          {d.name ?? d.label}
        </TextSvg>
      ))}
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

function Segment<T extends string>({ value, options, onChange, style }: { value: T; options: { key: T; label: string; icon?: LucideIcon }[]; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
  return (
    <View style={[styles.segment, style]}>
      {options.map((option) => {
        const selected = value === option.key;
        return (
          <Tap key={option.key} onPress={() => onChange(option.key)} style={[styles.segmentItem, selected && styles.segmentSelected]}>
            {option.icon ? <Icon icon={option.icon} size={14} color={selected ? c.formalio700 : c.surface500} /> : null}
            <Txt weight="bold" style={{ color: selected ? c.formalio700 : c.surface500, fontSize: 11 }}>
              {option.label}
            </Txt>
            {selected ? <Animated.View entering={FadeIn.duration(140)} style={styles.segmentGlow} /> : null}
          </Tap>
        );
      })}
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
}) {
  const [focused, setFocused] = useState(false);
  return (
    <View>
      {label ? (
        <Txt weight="semibold" style={styles.fieldLabel}>
          {label}
        </Txt>
      ) : null}
      <Animated.View style={[styles.inputBox, focused && styles.inputBoxFocused, large && { paddingVertical: 15 }, multiline && { alignItems: 'flex-start' }, error && { borderColor: c.danger200, backgroundColor: c.danger50 }]}>
        {icon ? <Icon icon={icon} size={17} color={c.surface400} /> : null}
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor={c.surface400}
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
  const scrollY = useSharedValue(0);
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y;
    },
  });
  const bottomPadding = showNav ? 112 : Math.max(24, insets.bottom + 16);
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
          contentContainerStyle={[noPadding ? { paddingBottom: bottomPadding } : { padding: 16, paddingBottom: bottomPadding }, { alignSelf: 'center', width: '100%', maxWidth: contentMaxWidth }]}
        >
          {children}
        </Animated.ScrollView>
      </Animated.View>
      {showNav ? (
        <Animated.View entering={SlideInDown.springify().damping(24).stiffness(180)} style={[styles.bottomNav, { paddingBottom: Math.max(8, insets.bottom) }]}>
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
                style={[styles.bottomNavItem, isAdd && { transform: [{ translateY: -18 }] }]}
              >
                {isAdd ? (
                  <View style={styles.addTab}>
                    <Icon icon={Plus} size={24} color={c.white} strokeWidth={2.6} />
                  </View>
                ) : (
                  <>
                    <Icon icon={tab.icon} size={20} color={selected ? c.formalio700 : c.surface400} />
                    <Txt weight="medium" style={{ fontSize: 10, color: selected ? c.formalio700 : c.surface400, marginTop: 3 }}>
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

function AuthFlows({ onComplete }: { onComplete: (isNewUser: boolean) => void }) {
  const { showToast } = useToast();
  const [screen, setScreen] = useState<AuthScreen>('splash');
  const [credential, setCredential] = useState('');
  const [phone, setPhone] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [otp, setOtp] = useState(['', '', '', '', '', '']);
  const [loading, setLoading] = useState(false);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricAvailable, setBiometricAvailable] = useState(false);
  const [biometricLabel, setBiometricLabel] = useState('Biométrie');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [onboardingIndex, setOnboardingIndex] = useState(0);

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
    return phoneOnlyCharacters && !val.includes('@') ? formatPhone(val) : val;
  };
  const validatePhone = (val: string) => val.replace(/\D/g, '').length === 9;
  const validateEmail = (val: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val);
  const validatePassword = (val: string) => val.length >= 8;
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
  const normalizeCredential = (val: string) => {
    const kind = getCredentialKind(val);
    return {
      kind,
      value: kind === 'phone' ? val.replace(/\D/g, '') : val.trim().toLowerCase(),
    };
  };
  const navigate = (next: AuthScreen) => {
    setErrors({});
    setScreen(next);
  };
  const simulateLoading = (next: AuthScreen | (() => void), delay = 1200) => {
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      if (typeof next === 'function') next();
      else setScreen(next);
    }, delay);
  };
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
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
        <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ flexGrow: 1, width: '100%', maxWidth: contentMaxWidth, alignSelf: 'center' }}>
          {children}
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );

  if (screen === 'welcome') {
    const slide = onboardingSlides[onboardingIndex];
    return shell(
      <View style={styles.welcomeScreen}>
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
            <AnimatedMascot state={slide.mascot} size={170} />
            <Txt weight="bold" style={styles.welcomeTitle}>
              {slide.title}
            </Txt>
            <Txt style={styles.welcomeCopy}>{slide.copy}</Txt>
            <View style={styles.chipWrap}>
              {slide.chips.map((chip) => (
                <Pill key={chip}>{chip}</Pill>
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
        <View style={{ paddingHorizontal: 24, paddingBottom: 28, gap: 12 }}>
          {onboardingIndex < onboardingSlides.length - 1 ? (
            <PrimaryButton label="Continuer" onPress={() => setOnboardingIndex(onboardingIndex + 1)} />
          ) : (
            <>
              <PrimaryButton label="Créer un compte" onPress={() => navigate('signup')} />
              <PrimaryButton label="Se connecter" tone="outline" onPress={() => navigate('login')} />
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
      <View style={styles.formScreen}>
        <Back />
        <Logo size={44} />
        <Txt weight="bold" style={styles.authTitle}>
          Bon retour ! 👋
        </Txt>
        <Txt style={styles.authSubtitle}>Connectez-vous à votre compte</Txt>
        <View style={{ marginTop: 24, gap: 15 }}>
          <Field
            label="Email ou téléphone"
            value={credential}
            onChangeText={(value) => {
              setCredential(formatCredentialInput(value));
              if (errors.credential) setErrors({});
            }}
            keyboardType="email-address"
            placeholder="marie@boutique.cm ou 6XX XXX XXX"
            icon={getCredentialKind(credential) === 'email' ? Mail : Phone}
            error={errors.credential}
            right={validateCredential(credential) ? <Icon icon={Check} size={17} color={c.formalio600} /> : null}
          />
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="••••••••"
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
            onPress={() => {
              const normalized = normalizeCredential(credential);
              if (!validateCredential(credential)) return setErrors({ credential: 'Entrez un email valide ou un numéro de téléphone à 9 chiffres.' });
              if (!validatePassword(password)) return setErrors({ password: 'Minimum 8 caractères' });
              setPhone(normalized.kind === 'phone' ? formatPhone(normalized.value) : phone);
              setEmail(normalized.kind === 'email' ? normalized.value : email);
              setLoading(true);
              formalioBackend
                .signInWithEmailOrPhone(normalized.value, password)
                .then(() => {
                  setPhone(normalized.kind === 'phone' ? formatPhone(normalized.value) : phone);
                  setEmail(normalized.kind === 'email' ? normalized.value : email);
                  setScreen('welcome-back');
                })
                .catch((error) => {
                  if (formalioBackend.isConfigured) {
                    setErrors({ credential: error instanceof Error ? error.message : 'Connexion impossible.' });
                  } else {
                    setPhone(normalized.kind === 'phone' ? formatPhone(normalized.value) : phone);
                    setEmail(normalized.kind === 'email' ? normalized.value : email);
                    setScreen('welcome-back');
                  }
                })
                .finally(() => setLoading(false));
            }}
          />
          <Divider label="OU" />
          <PrimaryButton label="Connexion par code SMS" tone="outline" icon={Phone} onPress={() => navigate('phone')} />
          <PrimaryButton label={biometricLoading ? 'Vérification...' : `Connexion ${biometricLabel}`} tone="outline" icon={biometricLoading ? RefreshCw : Fingerprint} disabled={biometricLoading} onPress={() => runBiometricAuth('login')} />
          {!biometricAvailable ? <Txt style={{ color: c.surface400, fontSize: 11, lineHeight: 16, textAlign: 'center' }}>La biométrie apparaîtra dès qu'elle sera enregistrée sur l'appareil.</Txt> : null}
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
          <View>
            <Txt weight="semibold" style={styles.fieldLabel}>Numéro de téléphone</Txt>
            <View style={styles.inputBox}>
              <Txt weight="medium" style={{ fontSize: 13, color: c.surface700 }}>🇨🇲 +237</Txt>
              <View style={styles.vDivider} />
              <TextInput value={phone} onChangeText={(v) => setPhone(formatPhone(v))} keyboardType="phone-pad" placeholder="6XX XXX XXX" placeholderTextColor={c.surface400} style={styles.textInput} />
            </View>
            {errors.phone ? <ErrorLine text={errors.phone} /> : null}
          </View>
          <Field label="Email professionnel" value={email} onChangeText={setEmail} placeholder="marie@boutique.cm" icon={Mail} keyboardType="email-address" />
          {errors.email ? <ErrorLine text={errors.email} /> : null}
          <Field
            label="Mot de passe"
            value={password}
            onChangeText={setPassword}
            placeholder="Minimum 8 caractères"
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
          <Field label="Confirmer le mot de passe" value={confirmPassword} onChangeText={setConfirmPassword} placeholder="••••••••" icon={Lock} secureTextEntry />
          <PrimaryButton
            label={loading ? 'Création...' : 'Créer mon compte'}
            icon={loading ? RefreshCw : ChevronRight}
            disabled={loading}
            onPress={() => {
              const nextErrors: Record<string, string> = {};
              if (!name.trim()) nextErrors.name = 'Nom requis';
              if (!validatePhone(phone)) nextErrors.phone = 'Numéro invalide';
              if (!validateEmail(email)) nextErrors.email = 'Email invalide';
              if (!validatePassword(password)) nextErrors.password = 'Minimum 8 caractères';
              if (password !== confirmPassword) nextErrors.confirm = 'Les mots de passe ne correspondent pas';
              setErrors(nextErrors);
              if (Object.keys(nextErrors).length === 0) {
                setLoading(true);
                formalioBackend
                  .signUp({ email, password, fullName: name, phone })
                  .then((result) => {
                    if (formalioBackend.isConfigured && !result?.session) {
                      showToast({
                        type: 'info',
                        title: 'Email de verification envoye',
                        message: 'Confirmez votre email, puis connectez-vous pour activer Formalio.',
                      });
                      setScreen('login');
                      return;
                    }
                    setScreen('biometric-setup');
                  })
                  .catch((error) => {
                    if (formalioBackend.isConfigured) setErrors({ email: error instanceof Error ? error.message : 'CrÃ©ation impossible.' });
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

  if (screen === 'forgot-password' || screen === 'forgot-otp' || screen === 'reset-password') {
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

  if (screen === 'phone') {
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
            <TextInput value={phone} onChangeText={(v) => setPhone(formatPhone(v))} keyboardType="phone-pad" placeholder="6XX XXX XXX" placeholderTextColor={c.surface400} style={styles.textInput} />
          </View>
          <PrimaryButton label={loading ? 'Envoi...' : 'Recevoir le code'} icon={ChevronRight} disabled={loading} onPress={() => simulateLoading('otp', 1000)} />
        </View>
      </View>
    );
  }

  if (screen === 'otp') {
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
    return shell(
      <LinearGradient colors={[c.formalio50, c.white]} style={styles.successScreen}>
        <AnimatedMascot state="celebrate" size={160} />
        <Txt weight="bold" style={[styles.authTitle, { textAlign: 'center', marginTop: 24 }]}>Content de vous revoir, Marie ! 🎉</Txt>
        <Txt style={[styles.authSubtitle, { textAlign: 'center', marginTop: 12 }]}>Voici un résumé de votre activité depuis votre dernière connexion</Txt>
        <Card style={{ width: '100%', marginTop: 24, padding: 20 }}>
          <Txt style={{ color: c.surface500, fontSize: 12, marginBottom: 12 }}>Depuis hier</Txt>
          {[
            ['Nouvelles transactions', '+12', c.formalio700],
            ['Score Mosika', '760 (+5)', c.formalio700],
            ['Notifications', '3 nouvelles', c.gold600],
          ].map(([label, value, color]) => (
            <Row key={label} style={{ justifyContent: 'space-between', paddingVertical: 6 }}>
              <Txt style={{ color: c.surface600, fontSize: 13 }}>{label}</Txt>
              <Txt weight="bold" style={{ color, fontSize: 13 }}>{value}</Txt>
            </Row>
          ))}
        </Card>
        <PrimaryButton label="Accéder au tableau de bord" icon={ChevronRight} onPress={() => onComplete(false)} style={{ width: '100%', marginTop: 30 }} />
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

function MosikaScore({ score = 760, showDetails = true }: { score?: number; showDetails?: boolean }) {
  const level = score >= 780 ? { label: 'Excellent', risk: 'Très faible', color: c.formalio500 } : score >= 700 ? { label: 'Très bon', risk: 'Faible', color: '#22c55e' } : score >= 600 ? { label: 'Solide', risk: 'Modéré', color: c.gold500 } : { label: 'À améliorer', risk: 'Élevé', color: c.danger500 };
  const circumference = 264;
  const metrics = [
    { label: 'Santé financière', value: '88%', icon: Shield, bg: c.formalio50, color: c.formalio700 },
    { label: 'Risque', value: '18%', icon: Zap, bg: c.gold50, color: c.gold600 },
    { label: 'Confiance', value: '4.7/5', icon: Award, bg: c.info50, color: c.info600 },
    { label: 'Croissance', value: '23%', icon: TrendingUp, bg: c.formalio50, color: c.formalio700 },
  ];
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
              <Txt weight="black" style={{ fontSize: 52, color: c.white, lineHeight: 56 }}>{score}</Txt>
              <View style={{ paddingBottom: 7 }}>
                <Txt weight="bold" style={{ color: level.color, fontSize: 14 }}>{level.label}</Txt>
                <Txt style={{ color: 'rgba(255,255,255,.55)', fontSize: 11 }}>Risque {level.risk}</Txt>
              </View>
            </Row>
            <Txt style={{ marginTop: 8, maxWidth: 190, color: 'rgba(255,255,255,.65)', fontSize: 12, lineHeight: 17 }}>
              Profil prêt pour crédit PME avec données MoMo et rapports OHADA.
            </Txt>
          </View>
          <View style={{ width: 112, height: 112 }}>
            <Svg width={112} height={112} viewBox="0 0 100 100">
              <Circle cx="50" cy="50" r="42" fill="none" stroke="rgba(255,255,255,.12)" strokeWidth="9" />
              <Circle cx="50" cy="50" r="42" fill="none" stroke={level.color} strokeWidth="9" strokeLinecap="round" strokeDasharray={`${circumference}`} strokeDashoffset={circumference - (score / 1000) * circumference} rotation="-90" origin="50,50" />
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
            ['Trust', '4.7/5'],
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
            {metrics.map((metric) => (
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
            <AreaChart data={creditScoreHistory.map((d) => ({ label: d.month, score: d.score }))} keys={['score']} colors={[c.formalio800]} height={116} />
          </Card>
          <Card style={{ padding: 14 }}>
            <Txt weight="bold" style={{ fontSize: 14, marginBottom: 12 }}>SME Performance Metrics</Txt>
            {[
              ['Transactions régulières', 92],
              ['Revenus stables', 84],
              ['Conformité OHADA', 88],
              ['Mobile Money', 76],
            ].map(([label, value]) => (
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
              <Txt style={{ color: c.surface600, fontSize: 12, marginTop: 4, lineHeight: 17 }}>Synchronisez Orange Money et générez votre rapport TVA pour gagner jusqu'à 25 points supplémentaires.</Txt>
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
          setBusinessName(businessName || 'Marie Nkono');
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
  const [downloadReportInfo, setDownloadReportInfo] = useState({ title: '', period: '' });
  const [transactions, setTransactions] = useState<Transaction[]>(initialTransactions);
  const [notifications, setNotifications] = useState(initialNotifications);
  const [showConfetti, setShowConfetti] = useState(false);
  const [cloudCompanyId, setCloudCompanyId] = useState<string | null>(null);
  const [cloudLoading, setCloudLoading] = useState(false);

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

  const hydrateCloudData = useCallback(async (showReadyToast = false) => {
    if (!formalioBackend.isConfigured) return false;
    setCloudLoading(true);
    try {
      const data = await formalioBackend.bootstrap();
      if (!data) return false;
      setCloudCompanyId(data.companyId);
      setProfile(data.profile as BusinessProfile);
      if (data.transactions.length > 0) setTransactions(data.transactions);
      setNotifications(data.notifications.length > 0 ? data.notifications : initialNotifications);
      setLoanRequests(data.loanRequests as LoanRequestRecord[]);
      setOfflineMode(false);
      if (showReadyToast) showToast({ type: 'success', title: 'Cloud sync active', message: 'DonnÃ©es Formalio chargÃ©es depuis Supabase.' });
      return true;
    } catch (error) {
      showToast({ type: 'error', title: 'Cloud sync indisponible', message: error instanceof Error ? error.message : 'Impossible de charger Supabase.' });
      return false;
    } finally {
      setCloudLoading(false);
    }
  }, [showToast]);

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
    if (!businessName && !businessType) return;
    setProfile((current) => ({
      ...current,
      storeName: businessName && current.storeName === defaultBusinessProfile.storeName ? businessName : current.storeName,
      category: businessType && current.category === defaultBusinessProfile.category ? businessType : current.category,
    }));
  }, [businessName, businessType]);

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
          showToast({ type: 'error', title: 'Cloud sync transaction', message: error instanceof Error ? error.message : 'Transaction gardÃ©e localement.' });
          return null;
        })
      : null;
    setTransactions([cloudTransaction ?? fallbackTransaction, ...transactions]);
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
    setTransactions([cloudTransaction ?? scannedTransaction, ...transactions]);
    setScannerOpen(false);
    showToast({ type: 'success', title: 'Ticket scanné', message: '28,500 FCFA ajouté dans Achats' });
  };

  const openDownload = (title: string, period: string) => {
    setDownloadReportInfo({ title, period });
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
        showToast({ type: 'error', title: 'Suivi cloud prÃªt', message: error instanceof Error ? error.message : 'Demande gardÃ©e localement.' });
      });
    }
  }, [cloudCompanyId, showToast]);

  if (screen === 'auth') {
    return (
      <AuthFlows
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
    return <BusinessSetupScreen businessName={businessName} setBusinessName={setBusinessName} businessType={businessType} setBusinessType={setBusinessType} navigate={navigate} shellProps={shellProps} />;
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.surface50 }}>
      {screen === 'dashboard' ? (
        <DashboardScreen shellProps={shellProps} businessName={profile.ownerFullName || businessName} showBalance={showBalance} setShowBalance={setShowBalance} notifications={notifications} offlineMode={offlineMode} setOfflineMode={setOfflineMode} transactions={transactions} navigate={navigate} openAi={() => setAiAssistantOpen(true)} />
      ) : null}
      {screen === 'transactions' ? <TransactionsScreen shellProps={shellProps} transactions={transactions} /> : null}
      {screen === 'add-transaction' ? <AddTransactionScreen shellProps={shellProps} cloudCompanyId={cloudCompanyId} transactions={transactions} setTransactions={setTransactions} navigate={navigate} openVoice={() => setVoiceRecorderOpen(true)} openScanner={() => setScannerOpen(true)} setShowConfetti={setShowConfetti} scannedDraft={pendingScan} onScanConsumed={handleScanDraftConsumed} /> : null}
      {screen === 'cashflow' ? <CashflowScreen shellProps={shellProps} /> : null}
      {screen === 'credit-score' ? <CreditScoreScreen shellProps={shellProps} onLoanSubmitted={handleLoanSubmitted} /> : null}
      {screen === 'reports' ? <ReportsScreen shellProps={shellProps} openDownload={openDownload} loanRequests={loanRequests} /> : null}
      {screen === 'mobile-money' ? <MobileMoneyScreen shellProps={shellProps} /> : null}
      {screen === 'notifications' ? <NotificationsScreen shellProps={shellProps} notifications={notifications} setNotifications={setNotifications} /> : null}
      {screen === 'ai-insights' ? <AiInsightsScreen shellProps={shellProps} transactionCount={transactions.length} /> : null}
      {screen === 'tax' ? <TaxScreen shellProps={shellProps} navigate={navigate} /> : null}
      {screen === 'profile' ? (
        <ProfileScreen
          shellProps={shellProps}
          profile={profile}
          setProfile={setProfile}
          navigate={navigate}
          logout={() => {
            void formalioBackend.signOut();
            setScreen('auth');
          }}
          onSaveProfile={(nextProfile) => cloudCompanyId ? formalioBackend.upsertProfile(cloudCompanyId, nextProfile) : Promise.resolve()}
          onKycStatusChange={(status) => cloudCompanyId ? formalioBackend.updateKycStatus(cloudCompanyId, status) : Promise.resolve()}
        />
      ) : null}
      {screen === 'settings' ? <SettingsScreen shellProps={shellProps} /> : null}
      {screen === 'security' ? <SecurityScreen shellProps={shellProps} /> : null}
      {screen === 'subscription' ? <SubscriptionScreen shellProps={shellProps} /> : null}
      {screen === 'help' ? <HelpScreen shellProps={shellProps} openAi={() => setAiAssistantOpen(true)} /> : null}
      {screen === 'referral' ? <ReferralScreen shellProps={shellProps} /> : null}
      {screen === 'offline' ? <OfflineScreen shellProps={shellProps} /> : null}
      {screen === 'accounting' ? <AccountingScreen shellProps={shellProps} transactions={transactions} navigate={navigate} openDownload={openDownload} /> : null}
      <AIAssistant isOpen={aiAssistantOpen} onClose={() => setAiAssistantOpen(false)} loanRequests={loanRequests} transactions={transactions} companyId={cloudCompanyId} />
      <VoiceRecorder isOpen={voiceRecorderOpen} onClose={() => setVoiceRecorderOpen(false)} onComplete={handleVoiceTransaction} />
      <DownloadModal isOpen={downloadModalOpen} onClose={() => setDownloadModalOpen(false)} reportTitle={downloadReportInfo.title} reportPeriod={downloadReportInfo.period} />
      <ScannerModal isOpen={scannerOpen} onClose={() => setScannerOpen(false)} onSave={handleScannedReceipt} />
      <ConfettiBurst trigger={showConfetti} />
      {cloudLoading ? (
        <View style={{ position: 'absolute', left: 16, right: 16, top: 82, zIndex: 120, borderRadius: 14, backgroundColor: c.formalio900, padding: 12, shadowColor: c.surface950, shadowOpacity: 0.16, shadowRadius: 12, elevation: 8 }}>
          <Row style={{ gap: 8 }}>
            <ActivityIndicator color={c.formalio300} size="small" />
            <Txt weight="bold" style={{ color: c.white, fontSize: 12 }}>Synchronisation cloud Formalio...</Txt>
          </Row>
        </View>
      ) : null}
    </View>
  );
}

function DashboardScreen({
  shellProps,
  businessName,
  showBalance,
  setShowBalance,
  notifications,
  offlineMode,
  setOfflineMode,
  transactions,
  navigate,
  openAi,
}: {
  shellProps: ShellProps;
  businessName: string;
  showBalance: boolean;
  setShowBalance: (v: boolean) => void;
  notifications: typeof initialNotifications;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  transactions: Transaction[];
  navigate: (s: Screen) => void;
  openAi: () => void;
}) {
  return (
    <ScreenWrapper {...shellProps} noPadding floatingAction={(scrollY) => <FloatingAIFab scrollY={scrollY} onPress={openAi} />}>
      <View style={{ padding: 16, paddingBottom: 4 }}>
        <Row style={{ justifyContent: 'space-between', marginBottom: 16 }}>
          <Row style={{ gap: 12 }}>
            <Tap onPress={() => navigate('profile')} style={styles.avatar}>
              <Txt weight="bold" style={{ color: c.formalio700, fontSize: 14 }}>{(businessName || 'Marie Nkono').split(' ').map((s) => s[0]).join('').slice(0, 2)}</Txt>
            </Tap>
            <View>
              <Txt style={{ color: c.surface400, fontSize: 12 }}>Bonjour 👋</Txt>
              <Txt weight="semibold" style={{ fontSize: 14 }}>{businessName || 'Marie Nkono'}</Txt>
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
          <Txt weight="bold" style={{ color: c.white, fontSize: 30, marginBottom: 13 }}>{showBalance ? '1,245,000 FCFA' : '••••••••'}</Txt>
          <Row style={{ gap: 12 }}>
            <View style={styles.balancePill}>
              <Icon icon={TrendingUp} size={14} color={c.formalio300} />
              <Txt weight="medium" style={{ color: c.formalio300, fontSize: 12 }}>+12.5%</Txt>
            </View>
            <Tap onPress={() => navigate('cashflow')} style={styles.balanceDetail}>
              <Txt style={{ color: c.white, fontSize: 12 }}>Détails</Txt>
              <Icon icon={ChevronRight} size={13} color={c.white} />
            </Tap>
          </Row>
        </LinearGradient>
        <Grid columns={4} gap={8}>
          {[
            { label: 'Revenus', icon: TrendingUp, bg: c.formalio50, color: c.formalio700, value: '850K', screen: 'cashflow' as Screen },
            { label: 'Dépenses', icon: TrendingDown, bg: c.danger50, color: c.danger600, value: '420K', screen: 'cashflow' as Screen },
            { label: 'Score', icon: Award, bg: c.gold50, color: c.gold600, value: '760', screen: 'credit-score' as Screen },
            { label: 'Rapports', icon: FileText, bg: c.info50, color: c.info600, value: '12', screen: 'reports' as Screen },
          ].map((item, index) => (
            <Animated.View key={item.label} entering={FadeIn.delay(index * 55).duration(220)} style={{ flex: 1 }}>
              <Tap onPress={() => navigate(item.screen)} style={styles.quickAction}>
                <View style={[styles.quickIcon, { backgroundColor: item.bg }]}>
                  <Icon icon={item.icon} size={17} color={item.color} />
                </View>
                <Txt weight="black" style={styles.quickValue}>{item.value}</Txt>
                <Txt numberOfLines={1} style={styles.quickLabel}>{item.label}</Txt>
              </Tap>
            </Animated.View>
          ))}
        </Grid>
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
            <Txt style={{ color: c.surface700, fontSize: 13, lineHeight: 19 }}>Vos ventes ont augmenté de 23% ! C'est le moment idéal pour augmenter votre stock principal.</Txt>
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
          {transactions.slice(0, 4).map((t) => <TransactionRow key={t.id} transaction={t} compact />)}
        </Card>
        <View style={styles.loanCard}>
          <View style={styles.loanIcon}><Icon icon={Award} size={21} color={c.gold600} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight="semibold" style={{ fontSize: 14 }}>Prêt pré-approuvé !</Txt>
            <Txt style={{ color: c.surface600, fontSize: 12, lineHeight: 17, marginTop: 4 }}>Avec votre Score Mosika de 760, vous êtes éligible pour 2M FCFA à 7.5% / an.</Txt>
            <Tap onPress={() => navigate('credit-score')} style={styles.loanButton}>
              <Txt weight="medium" style={{ color: c.white, fontSize: 12 }}>Voir l'offre</Txt>
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
          <Txt numberOfLines={1} style={{ color: c.surface400, fontSize: 11, marginTop: 2 }}>{compact ? `${transaction.category} · ${transaction.method}` : `${transaction.date} · ${getTransactionTime(transaction)} · ${transaction.method}`}</Txt>
        </View>
      </Row>
      <Txt weight="bold" style={{ color: income ? c.formalio600 : c.danger500, fontSize: 13 }}>{income ? '+' : '-'}{transaction.amount.toLocaleString('fr-FR')}</Txt>
    </View>
  );
}

function TransactionsScreen({ shellProps, transactions }: { shellProps: ShellProps; transactions: Transaction[] }) {
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
            placeholder="Rechercher..."
            placeholderTextColor={c.surface400}
            returnKeyType="search"
            autoCapitalize="none"
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
          <Txt weight="semibold" style={{ marginTop: 12, color: c.surface700 }}>{hasSearch || hasAdvancedFilters || filter !== 'all' ? 'No results found' : 'Aucune transaction'}</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 4, textAlign: 'center' }}>{hasSearch || hasAdvancedFilters || filter !== 'all' ? 'Essayez un autre mot-clé, une autre date ou une catégorie différente.' : 'Ajoutez votre première transaction'}</Txt>
          {hasSearch || hasAdvancedFilters || filter !== 'all' ? (
            <Tap onPress={clearFilters} style={styles.clearFiltersButton}>
              <Txt weight="bold" style={{ color: c.formalio700, fontSize: 12 }}>Clear search and filters</Txt>
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
  const isExpense = type === 'expense';
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
    if (scanPreview?.type === type) return;
    setCategory('');
  }, [scanPreview, type]);
  useEffect(() => {
    if (!scannedDraft) return;
    setType(scannedDraft.type);
    setAmount(String(scannedDraft.amount));
    setDesc(scannedDraft.description);
    setCategory(scannedDraft.category);
    setMethod(scannedDraft.method);
    setScanPreview(scannedDraft);
    onScanConsumed();
  }, [onScanConsumed, scannedDraft]);
  const handleSave = async () => {
    if (!amount || !desc) return showToast({ type: 'error', title: 'Champs manquants', message: 'Montant et description requis' });
    const fallbackTransaction: Transaction = {
      id: transactions.length + 1,
      date: new Date().toISOString().split('T')[0],
      description: desc,
      category: category || 'Autres',
      type,
      amount: Number(amount),
      method,
      status: 'completed',
    };
    const cloudTransaction = cloudCompanyId
      ? await formalioBackend.createTransaction(cloudCompanyId, {
          description: desc,
          category: category || 'Autres',
          type,
          amount: Number(amount),
          method,
        }).catch((error) => {
          showToast({ type: 'error', title: 'Cloud sync transaction', message: error instanceof Error ? error.message : 'Transaction gardÃ©e localement.' });
          return null;
        })
      : null;
    setTransactions([cloudTransaction ?? fallbackTransaction, ...transactions]);
    setShowConfetti(true);
    setTimeout(() => setShowConfetti(false), 2500);
    showToast({ type: 'success', title: 'Transaction enregistrée !', message: `${isExpense ? '-' : '+'}${Number(amount).toLocaleString('fr-FR')} FCFA` });
    navigate('dashboard');
  };
  return (
    <ScreenWrapper {...shellProps} title="Nouvelle Transaction">
      <View style={{ gap: 16 }}>
        <Segment value={type} onChange={setType} options={[{ key: 'income', label: '+ Revenu' }, { key: 'expense', label: '- Dépense' }]} />
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
              <Tap onPress={openScanner} style={styles.ocrRetryButton}><Icon icon={RefreshCw} size={13} color={c.info700} /><Txt weight="bold" style={{ color: c.info700, fontSize: 10 }}>Retry scan</Txt></Tap>
              <Tap onPress={() => setScanPreview(null)} style={styles.ocrRetryButton}><Icon icon={FileText} size={13} color={c.surface600} /><Txt weight="bold" style={{ color: c.surface600, fontSize: 10 }}>Manual fallback</Txt></Tap>
            </Row>
          </Animated.View>
        ) : null}
        <Field label="Montant (FCFA)" value={amount} onChangeText={setAmount} placeholder="0" keyboardType="numeric" large />
        <Field label="Description" value={desc} onChangeText={setDesc} placeholder="Ex: Vente de tissus" />
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
        <View>
          <Txt weight="medium" style={styles.fieldLabel}>Mode de paiement</Txt>
          <Grid columns={3} gap={8}>
            {paymentMethods.map((m) => (
              <Tap key={m.label} onPress={() => setMethod(m.label)} style={[styles.choiceCard, method === m.label && (isExpense ? styles.choiceSelectedExpense : styles.choiceSelected)]}>
                <View style={[styles.choiceIcon, { backgroundColor: method === m.label ? flowSoft : c.surface50 }]}>
                  <Icon icon={m.icon} size={16} color={method === m.label ? flowAccent : c.surface500} />
                </View>
                <Txt weight="medium" style={{ color: method === m.label ? flowAccent : c.surface600, fontSize: 11, textAlign: 'center' }}>{m.label}</Txt>
              </Tap>
            ))}
          </Grid>
        </View>
        <PrimaryButton label="Saisie vocale Mosika AI" icon={Mic} onPress={openVoice} />
        <PrimaryButton label="Scanner ticket, document ou reçu" tone="outline" icon={ScanLine} onPress={openScanner} />
        <PrimaryButton label={isExpense ? 'Enregistrer la dépense' : 'Enregistrer le revenu'} tone={isExpense ? 'danger' : 'green'} icon={Check} onPress={handleSave} />
      </View>
    </ScreenWrapper>
  );
}

function CashflowScreen({ shellProps }: { shellProps: ShellProps }) {
  const [filterMode, setFilterMode] = useState<'all' | 'income' | 'expense'>('all');
  const chartData = cashFlowData.map((d) => ({ ...d, incomeOnly: d.income, expenseOnly: d.expense, profit: d.income - d.expense }));
  const totalIncome7d = chartData.reduce((s, d) => s + d.income, 0);
  const totalExpense7d = chartData.reduce((s, d) => s + d.expense, 0);
  const net7d = totalIncome7d - totalExpense7d;
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
          <Txt style={{ color: c.formalio200, fontSize: 11, marginTop: 8 }}>Cash flow net positif · rentabilité: {Math.round((net7d / totalIncome7d) * 100)}%</Txt>
        </LinearGradient>
        <Segment value={filterMode} onChange={setFilterMode} options={[{ key: 'all', label: 'Global', icon: BarChart3 }, { key: 'income', label: 'Revenue', icon: TrendingUp }, { key: 'expense', label: 'Dépense', icon: Receipt }]} />
        <Grid columns={2} gap={8}>
          {filterMode !== 'expense' ? <MetricCard label={`Revenus ${filterMode === 'all' ? '(7j)' : 'filtrés'}`} value={`${(totalIncome7d / 1000).toFixed(0)}K FCFA`} tone="green" delta="+8.2%" /> : <View />}
          {filterMode !== 'income' ? <MetricCard label={`Dépenses ${filterMode === 'all' ? '(7j)' : 'filtrées'}`} value={`${(totalExpense7d / 1000).toFixed(0)}K FCFA`} tone="red" delta="-3.1%" /> : <View />}
          {filterMode === 'all' ? <MetricCard label="Profitabilité" value={`${Math.round((net7d / totalIncome7d) * 100)}%`} tone="blue" delta="Très bon niveau" /> : <View />}
          {filterMode === 'all' ? <MetricCard label="Prévision trésorerie" value="1.45M FCFA" tone="gold" delta="IA forecast +12%" /> : <View />}
        </Grid>
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
              ['Net margin', `${Math.round((net7d / totalIncome7d) * 100)}%`, c.info700],
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
            {(filterMode === 'income'
              ? ['Les revenus du mercredi sont vos meilleurs (+68% vs moyenne).', 'Prévision fin de semaine: 910K FCFA.', 'Opportunité: augmentez le stock lundi soir.']
              : filterMode === 'expense'
                ? ['Le transport représente la plus forte anomalie cette semaine.', 'Économie possible: 22K FCFA si optimisé.', 'Trois dépenses récurrentes peuvent être regroupées.']
                : ['Trésorerie nette positive et stable.', "Votre profitabilité s'améliore de +12%.", 'Aucune tension de liquidité détectée pour 10 jours.']
            ).map((txt) => (
              <Txt key={txt} style={{ color: c.formalio900, fontSize: 11, lineHeight: 16 }}>• {txt}</Txt>
            ))}
          </View>
        </Grid>
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

function CreditScoreScreen({ shellProps, onLoanSubmitted }: { shellProps: ShellProps; onLoanSubmitted: (summary: LoanRequestSummary) => void }) {
  const [loanOpen, setLoanOpen] = useState(false);
  const [loanSuccess, setLoanSuccess] = useState<LoanRequestSummary | null>(null);
  const score = 760;
  const rate = 7.5;
  const maxEligibleAmount = 2500000;
  const approvalProbability = 91;
  return (
    <ScreenWrapper {...shellProps} title="Score Mosika">
      <View style={{ gap: 12 }}>
        <MosikaScore score={score} showDetails />
        <View style={styles.loanEligible}>
          <View style={[styles.actionIcon, { backgroundColor: c.gold100 }]}><Icon icon={CreditCard} size={21} color={c.gold600} /></View>
          <View style={{ flex: 1 }}>
            <Txt weight="black" style={{ fontSize: 14 }}>Éligible pour un prêt SME</Txt>
            <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 17, marginTop: 5 }}>Avec votre score Mosika de <Txt weight="bold" style={{ fontSize: 11 }}>{score}</Txt>, vous pouvez demander jusqu'à <Txt weight="bold" style={{ fontSize: 11 }}>{formatFCFA(maxEligibleAmount)}</Txt>.</Txt>
            <View style={styles.chipWrapLeft}>
              <Pill tone="blue">Taux estimé: {rate}% / an</Pill>
              <Pill tone="gold">Maximum: 2.5M</Pill>
            </View>
            <PrimaryButton label="Request Loan" style={{ marginTop: 10, borderRadius: 12 }} onPress={() => setLoanOpen(true)} />
          </View>
        </View>
      </View>
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
  const amountPressure = selectedAmount / maxEligibleAmount;
  const approvalProbability = Math.max(62, Math.min(96, Math.round(baseApprovalProbability - amountPressure * 4 - (duration > 18 ? 2 : 0) + (purpose ? 1 : 0))));
  const borrowingStrengthIndex = Math.max(68, Math.min(98, Math.round((score / 850) * 54 + approvalProbability * 0.44 - amountPressure * 3)));
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
                <Txt weight="black" style={{ color: c.formalio800, fontSize: 18, marginTop: 2 }}>Pre-approved</Txt>
              </View>
              <Pill tone="gold">Score {score}</Pill>
            </Row>
            <ValueBar value={Math.round((score / 850) * 100)} color={c.formalio500} />
            <Row style={{ justifyContent: 'space-between', marginTop: 8 }}>
              <Txt style={{ color: c.surface500, fontSize: 11 }}>Mosika score quality</Txt>
              <Txt weight="black" style={{ color: c.formalio700, fontSize: 12 }}>Excellent</Txt>
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
            label={submitting ? 'Submitting request...' : 'Submit loan request'}
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

function ReportsScreen({ shellProps, openDownload, loanRequests }: { shellProps: ShellProps; openDownload: (title: string, period: string) => void; loanRequests: LoanRequestRecord[] }) {
  const [selectedReport, setSelectedReport] = useState<ReportType | null>(null);
  const [selectedLoan, setSelectedLoan] = useState<LoanRequestRecord | null>(null);
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
        <ReportIntelligenceDeck type={selectedReport} />
        <SYSCOHADAReport type={selectedReport} period="Janvier 2025" />
        <ReportExportPanel title={titleMap[selectedReport]} period="Janvier 2025" onExport={openDownload} />
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
      <ReportPortfolioSummary />
      <Txt weight="bold" style={{ fontSize: 14, marginBottom: 10 }}>Documents intelligents</Txt>
      <View style={{ gap: 12 }}>
        {[
          { title: 'Bilan Comptable', type: 'bilan' as const, date: 'Janvier 2025', status: 'ready', icon: FileSpreadsheet, tone: 'blue', desc: 'Actif, passif et capitaux propres' },
          { title: 'Compte de Résultat', type: 'compte-resultat' as const, date: 'Janvier 2025', status: 'ready', icon: Calculator, tone: 'green', desc: 'Revenus, charges et marge nette' },
          { title: 'Flux de Trésorerie', type: 'tresorerie' as const, date: 'Janvier 2025', status: 'ready', icon: Wallet, tone: 'green', desc: 'Cash opérationnel et variation nette' },
          { title: 'Déclaration TVA', type: 'tva' as const, date: 'T1 2025', status: 'pending', icon: Receipt, tone: 'amber', desc: 'TVA collectée, déductible et solde' },
        ].map((report) => (
          <Tap key={report.title} onPress={() => setSelectedReport(report.type)} style={styles.reportRow}>
            <ToneIcon icon={report.icon} tone={report.tone as any} />
            <View style={{ flex: 1 }}>
              <Txt weight="medium" style={{ fontSize: 13 }}>{report.title}</Txt>
              <Txt numberOfLines={1} style={{ color: c.surface500, fontSize: 11, marginTop: 2 }}>{report.desc}</Txt>
              <Txt style={{ color: c.surface400, fontSize: 10, marginTop: 4 }}>{report.date}</Txt>
            </View>
            {report.status === 'ready' ? <Pill>Prêt</Pill> : <Pill tone="gold">En attente</Pill>}
            <Icon icon={ChevronRight} size={16} color={c.surface400} />
          </Tap>
        ))}
      </View>
    </ScreenWrapper>
  );
}

const loanStatusStages: { key: LoanStatusStage; label: string; icon: LucideIcon }[] = [
  { key: 'submitted', label: 'Submitted', icon: Send },
  { key: 'under-review', label: 'Under Review', icon: Eye },
  { key: 'risk-assessment', label: 'Risk Assessment', icon: Shield },
  { key: 'pending-documents', label: 'Pending Documents', icon: FileText },
  { key: 'approved', label: 'Approved', icon: CheckCircle2 },
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
        <Txt weight="bold" style={{ color: meta.color, fontSize: 10 }}>Review {request.expectedReviewDuration}</Txt>
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
            <Txt style={{ color: c.formalio200, fontSize: 11, marginTop: 4 }}>{request.id} · Submitted {new Date(request.requestedAt).toLocaleDateString('fr-FR')}</Txt>
          </View>
          <LoanStatusBadge status={request.status} />
        </Row>
        <View style={{ marginTop: 14 }}><ValueBar value={loanProgressForStatus(request.status)} color={getLoanStatusMeta(request.status).color} track="rgba(255,255,255,.16)" /></View>
      </LinearGradient>
      <Grid columns={2} gap={10}>
        <ReportMetricCard label="Approval signal" value={`${request.approvalProbability}%`} detail="AI probability" icon={Sparkles} tone="blue" />
        <ReportMetricCard label="Strength index" value={`${request.borrowingStrengthIndex}%`} detail="cash behavior" icon={Award} tone="green" />
        <ReportMetricCard label="Total repayment" value={`${Math.round(request.totalRepayment / 1000)}K`} detail="FCFA estimate" icon={Wallet} tone="green" />
        <ReportMetricCard label="Review time" value={request.expectedReviewDuration} detail="estimated" icon={RefreshCw} tone="amber" />
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
    submitted: { label: 'Submitted', color: c.info700, bg: c.info50 },
    'under-review': { label: 'Under Review', color: c.info700, bg: c.info50 },
    'risk-assessment': { label: 'Risk Check', color: c.gold700, bg: c.gold50 },
    'pending-documents': { label: 'Docs Needed', color: c.gold700, bg: c.gold50 },
    approved: { label: 'Approved', color: c.formalio700, bg: c.formalio50 },
    rejected: { label: 'Rejected', color: c.danger600, bg: c.danger50 },
    disbursed: { label: 'Disbursed', color: c.formalio700, bg: c.formalio50 },
  } satisfies Record<LoanStatusStage, { label: string; color: string; bg: string }>;
  return map[status];
}

function loanProgressForStatus(status: LoanStatusStage) {
  const index = loanStatusStages.findIndex((stage) => stage.key === status);
  return Math.max(8, Math.round(((index + 1) / loanStatusStages.length) * 100));
}

function ReportPortfolioSummary() {
  return (
    <View style={{ gap: 12, marginBottom: 16 }}>
      <Grid columns={2} gap={10}>
        <ReportMetricCard label="Rapports prêts" value="3/4" detail="TVA en validation" icon={FileText} tone="green" />
        <ReportMetricCard label="Conformité" value="92%" detail="SYSCOHADA 2017" icon={Shield} tone="blue" />
        <ReportMetricCard label="Cash net" value="720K" detail="+14% ce mois" icon={Wallet} tone="green" />
        <ReportMetricCard label="TVA nette" value="158K" detail="à payer" icon={Receipt} tone="amber" />
      </Grid>
      <View style={styles.reportInsightCallout}>
        <Icon icon={BrainCircuit} size={17} color={c.formalio700} />
        <View style={{ flex: 1 }}>
          <Txt weight="bold" style={{ color: c.formalio800, fontSize: 12 }}>Synthèse comptable Mosika</Txt>
          <Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 3 }}>Les documents sont enrichis avec ratios, contrôles de cohérence et alertes avant export.</Txt>
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

function ReportIntelligenceDeck({ type }: { type: ReportType }) {
  const report = reportAnalytics[type];
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

function ReportExportPanel({ title, period, onExport }: { title: string; period: string; onExport: (title: string, period: string) => void }) {
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
      <PrimaryButton label="Préparer l'export" icon={Download} onPress={() => onExport(title, period)} style={{ marginTop: 12, minHeight: 46, borderRadius: 14 }} />
    </Card>
  );
}

function SYSCOHADAReport({ type, period }: { type: ReportType; period: string }) {
  const title = {
    bilan: 'Bilan Comptable',
    'compte-resultat': 'Compte de Résultat',
    tresorerie: 'Flux de Trésorerie',
    tva: 'Déclaration TVA',
  }[type];
  const rows = type === 'bilan'
    ? [['Actifs courants', '4,250,000'], ['Passifs courants', '1,320,000'], ['Capitaux propres', '2,930,000']]
    : type === 'compte-resultat'
      ? [["Chiffre d'affaires", '1,245,000'], ['Charges opérationnelles', '420,000'], ['Résultat net', '825,000']]
      : type === 'tresorerie'
        ? [['Flux opérationnel', '845,000'], ['Investissements', '-125,000'], ['Cash net', '720,000']]
        : [['TVA collectée', '239,662'], ['TVA déductible', '80,850'], ['Net à payer', '158,812']];
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
        const outgoing = value.startsWith('-') || label.includes('Charges') || label.includes('payer') || label.includes('Passifs');
        const emphasisColor = outgoing ? c.danger600 : i === rows.length - 1 ? c.formalio700 : c.surface900;
        return (
          <Row key={label} style={[styles.reportLine, i === rows.length - 1 && { borderTopWidth: 1, borderTopColor: c.surface200, paddingTop: 12 }]}>
            <Txt weight={i === rows.length - 1 ? 'bold' : 'medium'} style={{ color: c.surface700, fontSize: 13 }}>{label}</Txt>
            <Txt weight="black" style={{ color: emphasisColor, fontSize: 14 }}>{value} FCFA</Txt>
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
        ].map((account) => (
          <Card key={account.name}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 12 }}>
              <Row style={{ gap: 12 }}>
                <LinearGradient colors={account.colors as [string, string]} style={styles.moneyLogo}>
                  <Txt weight="bold" style={{ color: c.white, fontSize: 18 }}>{account.name[0]}</Txt>
                </LinearGradient>
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
        ))}
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

function AiInsightsScreen({ shellProps, transactionCount }: { shellProps: ShellProps; transactionCount: number }) {
  return (
    <ScreenWrapper {...shellProps} title="Insights IA">
      <View style={styles.aiHeaderCard}>
        <AnimatedMascot state="thinking" size={48} />
        <View>
          <Txt weight="semibold" style={{ fontSize: 14 }}>Mosika Intelligence</Txt>
          <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 2 }}>Basé sur vos {transactionCount * 30} transactions</Txt>
        </View>
      </View>
      <View style={{ gap: 12 }}>
        {aiInsights.map((insight) => {
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

function TaxScreen({ shellProps, navigate }: { shellProps: ShellProps; navigate: (s: Screen) => void }) {
  return (
    <ScreenWrapper {...shellProps} title="Fiscalité">
      <View style={styles.taxAlert}>
        <Icon icon={AlertTriangle} size={24} color={c.amber600} />
        <View style={{ flex: 1 }}>
          <Txt weight="semibold" style={{ color: c.amber700, fontSize: 14 }}>Déclaration TVA due</Txt>
          <Txt style={{ color: c.amber700, fontSize: 12, marginTop: 4 }}>Date limite: 20 Janvier 2025 (dans 5 jours)</Txt>
          <Tap onPress={() => navigate('reports')} style={styles.taxButton}>
            <Txt weight="medium" style={{ color: c.white, fontSize: 12 }}>Préparer la déclaration</Txt>
          </Tap>
        </View>
      </View>
      <Card>
        <Txt weight="semibold" style={{ fontSize: 14, marginBottom: 12 }}>Calendrier Fiscal</Txt>
        {[
          { date: '20 Jan', label: 'Déclaration TVA T4', status: 'upcoming' },
          { date: '15 Fév', label: 'Acompte IS', status: 'future' },
          { date: '31 Mar', label: 'Bilan Annuel', status: 'future' },
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
  onSaveProfile,
  onKycStatusChange,
}: {
  shellProps: ShellProps;
  profile: BusinessProfile;
  setProfile: React.Dispatch<React.SetStateAction<BusinessProfile>>;
  navigate: (s: Screen) => void;
  logout: () => void;
  onSaveProfile?: (profile: BusinessProfile) => Promise<void>;
  onKycStatusChange?: (status: KycStatus) => Promise<void>;
}) {
  const { showToast } = useToast();
  const [editing, setEditing] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState<BusinessProfile>(profile);
  const visibleProfile = editing ? form : profile;
  const profileErrors = useMemo(() => validateBusinessProfile(form), [form]);
  const completion = calculateProfileCompletion(visibleProfile);
  const initials = (visibleProfile.ownerFullName || visibleProfile.storeName || 'FM').split(' ').map((s) => s[0]).join('').slice(0, 2).toUpperCase();
  const categories = ['Commerce', 'Restauration', 'Services', 'Transport', 'Agriculture', 'Artisanat'];

  useEffect(() => {
    if (!editing) setForm(profile);
  }, [editing, profile]);

  const updateForm = <K extends keyof BusinessProfile>(key: K, value: BusinessProfile[K]) => {
    setForm((current) => ({ ...current, [key]: value }));
  };

  const pickProfileAsset = async (field: 'profileImageUri' | 'bannerImageUri') => {
    const permission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!permission.granted) {
      showToast({ type: 'error', title: 'Permission requise', message: 'Autorisez la galerie pour ajouter une image.' });
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: field === 'profileImageUri' ? [1, 1] : [16, 7],
      quality: 0.82,
    });
    if (!result.canceled && result.assets[0]?.uri) updateForm(field, result.assets[0].uri);
  };

  const saveProfile = () => {
    const errors = validateBusinessProfile(form);
    if (Object.keys(errors).length > 0) {
      showToast({ type: 'error', title: 'Profil incomplet', message: 'Corrigez les champs indiqués avant de sauvegarder.' });
      return;
    }
    setSaving(true);
    void (async () => {
      try {
        await onSaveProfile?.(form);
      } catch (error) {
        showToast({ type: 'error', title: 'Sauvegarde cloud impossible', message: error instanceof Error ? error.message : 'Reessayez plus tard.' });
      }
      setProfile(form);
      setSaving(false);
      setEditing(false);
      showToast({ type: 'success', title: 'Profil mis à jour', message: `Complétion: ${calculateProfileCompletion(form)}%` });
    })();
  };

  const cancelProfileEdit = () => {
    setForm(profile);
    setEditing(false);
  };

  return (
    <ScreenWrapper {...shellProps} noPadding>
      <View style={styles.profileHero}>
        {visibleProfile.bannerImageUri ? <Image source={{ uri: visibleProfile.bannerImageUri }} resizeMode="cover" style={StyleSheet.absoluteFillObject} /> : null}
        <LinearGradient colors={['rgba(5,35,32,.88)', 'rgba(15,79,74,.88)']} style={StyleSheet.absoluteFillObject} />
        <View style={styles.profileTopActions}>
          <HeaderUtilityActions offlineMode={shellProps.offlineMode} setOfflineMode={shellProps.setOfflineMode} notifications={shellProps.notifications} navigate={shellProps.navigate} />
        </View>
        {editing ? (
          <Tap onPress={() => pickProfileAsset('bannerImageUri')} style={[styles.profileCoverAction, { left: 16, right: undefined }]}>
            <Icon icon={Camera} size={14} color={c.white} />
            <Txt weight="bold" style={{ color: c.white, fontSize: 10 }}>Cover</Txt>
          </Tap>
        ) : null}
        <Row style={{ gap: 16 }}>
          <Tap disabled={!editing} onPress={() => pickProfileAsset('profileImageUri')} style={styles.profileAvatar}>
            {visibleProfile.profileImageUri ? (
              <Image source={{ uri: visibleProfile.profileImageUri }} resizeMode="cover" style={styles.profileAvatarImage} />
            ) : (
              <Txt weight="bold" style={{ color: c.white, fontSize: 22 }}>{initials}</Txt>
            )}
            <View style={styles.profileCheck}><Icon icon={editing ? Camera : Check} size={12} color={c.white} /></View>
          </Tap>
          <View style={{ flex: 1, minWidth: 0 }}>
            <Txt weight="bold" numberOfLines={1} style={{ color: c.white, fontSize: 18 }}>{visibleProfile.ownerFullName}</Txt>
            <Txt numberOfLines={1} style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, marginTop: 3 }}>{visibleProfile.storeName}</Txt>
            <Row style={{ gap: 6, marginTop: 7, flexWrap: 'wrap' }}>
              <Icon icon={Award} size={15} color={c.gold400} />
              <Txt weight="medium" style={{ color: c.gold200, fontSize: 12 }}>Score Mosika: 760</Txt>
              <KycStatusPill status={visibleProfile.kycStatus} compact />
            </Row>
          </View>
        </Row>
      </View>
      <View style={{ paddingHorizontal: 16, marginTop: -12, paddingBottom: 22 }}>
        <Card style={styles.profileCompletionCard}>
          <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
            <Txt weight="bold" style={{ fontSize: 12 }}>Profile Completion</Txt>
            <Txt weight="black" style={{ color: c.formalio700, fontSize: 13 }}>{completion}%</Txt>
          </Row>
          <ValueBar value={completion} color={completion >= 80 ? c.formalio500 : c.gold500} />
          <Txt style={{ color: c.surface500, fontSize: 10, marginTop: 7 }}>Complete profile and KYC details to unlock stronger financing offers.</Txt>
        </Card>

        <Card style={styles.profileEditorCard}>
          <Row style={{ justifyContent: 'space-between', gap: 10, marginBottom: 14 }}>
            <View style={{ flex: 1 }}>
              <Txt weight="black" style={{ fontSize: 15 }}>Business profile</Txt>
              <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>{editing ? 'Editing live validation fields' : 'Store, owner and contact details'}</Txt>
            </View>
            {editing ? (
              <Row style={{ gap: 8 }}>
                <Tap onPress={cancelProfileEdit} disabled={saving} style={styles.profileMiniButton}><Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>Cancel</Txt></Tap>
                <Tap onPress={saveProfile} disabled={saving} style={[styles.profileMiniButton, styles.profileMiniButtonPrimary]}>
                  {saving ? <ActivityIndicator color={c.white} size="small" /> : <Txt weight="bold" style={{ color: c.white, fontSize: 11 }}>Save</Txt>}
                </Tap>
              </Row>
            ) : (
              <Tap onPress={() => setEditing(true)} style={[styles.profileMiniButton, styles.profileMiniButtonPrimary]}>
                <Txt weight="bold" style={{ color: c.white, fontSize: 11 }}>Edit Profile</Txt>
              </Tap>
            )}
          </Row>

          {editing ? (
            <Animated.View entering={FadeIn.duration(180)} style={{ gap: 12 }}>
              <Field label="Store name" value={form.storeName} onChangeText={(v) => updateForm('storeName', v)} placeholder="Store name" icon={Package} error={profileErrors.storeName} />
              <Field label="Store description" value={form.storeDescription} onChangeText={(v) => updateForm('storeDescription', v)} placeholder="Describe your store" multiline error={profileErrors.storeDescription} />
              <Field label="Owner full name" value={form.ownerFullName} onChangeText={(v) => updateForm('ownerFullName', v)} placeholder="Owner name" icon={User} error={profileErrors.ownerFullName} />
              <Grid columns={2} gap={10}>
                <Field label="Phone number" value={form.phone} onChangeText={(v) => updateForm('phone', v)} placeholder="+237..." icon={Phone} keyboardType="phone-pad" error={profileErrors.phone} />
                <Field label="Email address" value={form.email} onChangeText={(v) => updateForm('email', v)} placeholder="name@email.com" icon={Mail} keyboardType="email-address" error={profileErrors.email} />
              </Grid>
              <View>
                <Txt weight="semibold" style={styles.fieldLabel}>Business category</Txt>
                <View style={styles.chipWrapLeft}>
                  {categories.map((category) => (
                    <Tap key={category} onPress={() => updateForm('category', category)} style={[styles.selectChip, form.category === category && styles.selectChipActive]}>
                      <Txt weight="medium" style={{ color: form.category === category ? c.formalio700 : c.surface600, fontSize: 12 }}>{category}</Txt>
                    </Tap>
                  ))}
                </View>
              </View>
              <Field label="Location / address" value={form.address} onChangeText={(v) => updateForm('address', v)} placeholder="City, district, country" icon={MapPin} error={profileErrors.address} />
              <Grid columns={2} gap={10}>
                <ProfileUploadPreview label="Profile picture" uri={form.profileImageUri} onPress={() => pickProfileAsset('profileImageUri')} />
                <ProfileUploadPreview label="Store cover image" uri={form.bannerImageUri} onPress={() => pickProfileAsset('bannerImageUri')} />
              </Grid>
            </Animated.View>
          ) : (
            <Animated.View entering={FadeIn.duration(180)}>
              <ProfileInfoRow icon={Package} label="Store" value={profile.storeName} />
              <ProfileInfoRow icon={User} label="Owner" value={profile.ownerFullName} />
              <ProfileInfoRow icon={Phone} label="Phone" value={profile.phone} />
              <ProfileInfoRow icon={Mail} label="Email" value={profile.email} />
              <ProfileInfoRow icon={MapPin} label="Location" value={profile.address} />
              <ProfileInfoRow icon={Sparkles} label="Category" value={profile.category} />
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
            { icon: CreditCard, label: 'Abonnement', badge: 'Croissance', action: () => navigate('subscription') },
            { icon: Smartphone, label: 'Mobile Money', action: () => navigate('mobile-money') },
            { icon: Gift, label: 'Parrainage', badge: '+1K', action: () => navigate('referral') },
            { icon: HelpCircle, label: 'Aide & Support', action: () => navigate('help') },
          ].map((item, i) => (
            <Tap key={item.label} onPress={item.action} style={[styles.profileMenuItem, i > 0 && { borderTopWidth: 1, borderTopColor: c.surface100 }]}>
              <Icon icon={item.icon} size={20} color={c.surface500} />
              <Txt style={{ flex: 1, color: c.surface700, fontSize: 14 }}>{item.label}</Txt>
              {item.badge ? <Pill>{item.badge}</Pill> : null}
              <Icon icon={ChevronRight} size={16} color={c.surface400} />
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
          <Txt weight="medium" style={{ color: c.danger500, fontSize: 14 }}>Déconnexion</Txt>
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

function calculateProfileCompletion(profile: BusinessProfile) {
  const fields = [profile.storeName, profile.storeDescription, profile.ownerFullName, profile.phone, profile.email, profile.category, profile.address, profile.profileImageUri, profile.bannerImageUri];
  return Math.round((fields.filter(Boolean).length / fields.length) * 100);
}

function ProfileUploadPreview({ label, uri, onPress }: { label: string; uri?: string; onPress: () => void }) {
  return (
    <Tap onPress={onPress} style={styles.profileUploadTile}>
      {uri ? <Image source={{ uri }} resizeMode="cover" style={StyleSheet.absoluteFillObject} /> : null}
      <View style={[StyleSheet.absoluteFillObject, { backgroundColor: uri ? 'rgba(2,6,23,.32)' : c.surface50 }]} />
      <View style={styles.profileUploadContent}>
        <Icon icon={Camera} size={18} color={uri ? c.white : c.formalio700} />
        <Txt weight="bold" style={{ color: uri ? c.white : c.surface700, fontSize: 11 }}>{label}</Txt>
      </View>
    </Tap>
  );
}

function ProfileInfoRow({ icon, label, value }: { icon: LucideIcon; label: string; value: string }) {
  return (
    <Row style={styles.profileInfoRow}>
      <View style={[styles.metricIcon, { backgroundColor: c.surface50 }]}><Icon icon={icon} size={15} color={c.surface500} /></View>
      <Txt style={{ color: c.surface500, fontSize: 11, width: 76 }}>{label}</Txt>
      <Txt weight="semibold" numberOfLines={1} style={{ color: c.surface800, fontSize: 12, flex: 1 }}>{value}</Txt>
    </Row>
  );
}

function KycVerificationPanel({ profile, onStatusChange }: { profile: BusinessProfile; onStatusChange: (status: KycStatus) => void }) {
  const { showToast } = useToast();
  const steps = ['Identity', 'Personal', 'ID card', 'Selfie', 'Business', 'Address', 'Review', 'Status'];
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
            <Txt weight="black" style={{ fontSize: 15 }}>KYC Verification</Txt>
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
          <KycStepShell icon={Shield} title="Identity Verification" copy="Confirm the official document type that will anchor this account.">
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
          <KycStepShell icon={Camera} title="Selfie Verification" copy="A live selfie preview will be matched with the identity document.">
            <KycUploadTile label="Selfie capture" uri={draft.selfieUri} tall onCamera={() => pickKycImage('selfieUri', 'camera')} onFile={() => pickKycImage('selfieUri', 'file')} />
          </KycStepShell>
        ) : null}
        {step === 4 ? (
          <KycStepShell icon={Package} title="Business Verification" copy="Add registration references for future compliance checks.">
            <Field label="Business name" value={draft.businessName} onChangeText={(v) => updateDraft('businessName', v)} icon={Package} />
            <Field label="Registration number" value={draft.registrationNumber} onChangeText={(v) => updateDraft('registrationNumber', v)} icon={FileText} />
            <Field label="Tax identifier" value={draft.taxId} onChangeText={(v) => updateDraft('taxId', v)} icon={Calculator} />
          </KycStepShell>
        ) : null}
        {step === 5 ? (
          <KycStepShell icon={MapPin} title="Address Verification" copy="Confirm business location and attach a utility bill or proof of address.">
            <Field label="Business address" value={draft.address} onChangeText={(v) => updateDraft('address', v)} icon={MapPin} />
            <KycUploadTile label="Address proof" uri={draft.addressProofUri} onCamera={() => pickKycImage('addressProofUri', 'camera')} onFile={() => pickKycImage('addressProofUri', 'file')} />
          </KycStepShell>
        ) : null}
        {step === 6 ? (
          <KycStepShell icon={CheckCircle2} title="Review & Submit" copy="Review the mocked dossier before submitting it for verification.">
            <View style={styles.kycReviewBox}>
              <InfoLine label="Identity" value={`${draft.idType} · ${draft.idNumber}`} />
              <InfoLine label="Applicant" value={draft.fullName} />
              <InfoLine label="Business" value={draft.businessName} />
              <InfoLine label="Documents" value={`${[draft.idFrontUri, draft.idBackUri, draft.selfieUri, draft.addressProofUri].filter(Boolean).length}/4 uploaded`} valueColor={c.formalio700} />
            </View>
            <PrimaryButton label={submitting ? 'Submitting...' : 'Submit verification'} icon={submitting ? RefreshCw : Check} disabled={submitting} onPress={submitKyc} style={{ minHeight: 44, borderRadius: 13 }} />
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
    pending: { label: 'Pending', title: 'Verification pending', copy: 'Start or continue the KYC flow to submit your profile.', color: c.gold700, bg: c.gold50 },
    'under-review': { label: 'Under Review', title: 'Under review', copy: 'Formalio compliance is reviewing the mocked dossier.', color: c.info700, bg: c.info50 },
    approved: { label: 'Approved', title: 'Verified account', copy: 'Identity and business information are marked as approved.', color: c.formalio700, bg: c.formalio50 },
    rejected: { label: 'Rejected', title: 'Action required', copy: 'A reviewer requested updated documents or clearer photos.', color: c.danger600, bg: c.danger50 },
  } satisfies Record<KycStatus, { label: string; title: string; copy: string; color: string; bg: string }>;
  return map[status];
}

function SettingsScreen({ shellProps }: { shellProps: ShellProps }) {
  const { showToast } = useToast();
  const [toggles, setToggles] = useState({ darkMode: false, notifications: true, offlineSync: true });
  return (
    <ScreenWrapper {...shellProps} title="Paramètres">
      <View style={styles.settingsList}>
        {[
          { icon: Globe, label: 'Langue', value: 'Français' },
          { icon: Moon, label: 'Mode Sombre', toggle: 'darkMode' as const },
          { icon: Bell, label: 'Notifications', toggle: 'notifications' as const },
          { icon: WifiOff, label: 'Sync hors ligne', toggle: 'offlineSync' as const },
        ].map((item, i) => {
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

function SecurityScreen({ shellProps }: { shellProps: ShellProps }) {
  return (
    <ScreenWrapper {...shellProps} title="Sécurité">
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <AnimatedMascot state="secure" size={100} />
        <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 12 }}>Vos données sont chiffrées et sécurisées</Txt>
      </View>
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

function SubscriptionScreen({ shellProps }: { shellProps: ShellProps }) {
  return (
    <ScreenWrapper {...shellProps} title="Abonnement">
      <LinearGradient colors={[c.formalio800, c.formalio900]} style={styles.subscriptionHero}>
        <Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 14 }}>Plan Actuel</Txt>
        <Txt weight="bold" style={{ color: c.white, fontSize: 26, marginTop: 4 }}>Croissance</Txt>
        <Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 14, marginTop: 4 }}>4,900 FCFA/mois</Txt>
        <View style={styles.renewalPill}>
          <Icon icon={CheckCircle2} size={13} color={c.white} />
          <Txt style={{ color: c.white, fontSize: 12 }}>Renouvellement: 15 Fév 2025</Txt>
        </View>
      </LinearGradient>
      <Txt weight="semibold" style={{ fontSize: 14, marginBottom: 12 }}>Changer de plan</Txt>
      <View style={{ gap: 12 }}>
        {pricingPlans.map((plan) => (
          <Card key={plan.name} style={{ borderColor: plan.popular ? c.formalio300 : c.surface200 }}>
            <Row style={{ justifyContent: 'space-between', marginBottom: 8 }}>
              <Txt weight="semibold" style={{ fontSize: 15 }}>{plan.name}</Txt>
              {plan.popular ? <Pill>Actuel</Pill> : null}
            </Row>
            <Txt weight="bold" style={{ fontSize: 18 }}>{plan.price} <Txt style={{ color: c.surface500, fontSize: 13 }}>{plan.period}</Txt></Txt>
            <Txt style={{ color: c.surface500, fontSize: 12, marginTop: 6 }}>{plan.description}</Txt>
          </Card>
        ))}
      </View>
    </ScreenWrapper>
  );
}

function HelpScreen({ shellProps, openAi }: { shellProps: ShellProps; openAi: () => void }) {
  return (
    <ScreenWrapper {...shellProps} title="Aide & Support">
      <View style={{ alignItems: 'center', marginBottom: 24 }}>
        <AnimatedMascot state="wave" size={100} />
        <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 12 }}>Comment pouvons-nous vous aider ?</Txt>
      </View>
      <View style={{ gap: 12 }}>
        {[
          { icon: MessageCircle, label: 'Chat avec Mosika', desc: 'Assistant IA 24/7', action: openAi },
          { icon: Phone, label: 'Appeler le Support', desc: '+237 6XX XXX XXX' },
          { icon: HelpCircle, label: "Centre d'aide", desc: 'FAQs et tutoriels' },
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

function AccountingScreen({ shellProps, transactions, navigate, openDownload }: { shellProps: ShellProps; transactions: Transaction[]; navigate: (s: Screen) => void; openDownload: (title: string, period: string) => void }) {
  const { showToast } = useToast();
  type AccTab = 'overview' | 'sales' | 'expenses' | 'ai' | 'reports';
  type Period = 'daily' | 'weekly' | 'monthly' | 'annual';
  const [accTab, setAccTab] = useState<AccTab>('overview');
  const [period, setPeriod] = useState<Period>('weekly');
  const [aiThinking, setAiThinking] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<string | null>(null);
  const [generatingReport, setGeneratingReport] = useState<string | null>(null);
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((s, t) => s + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((s, t) => s + t.amount, 0);
  const netProfit = totalIncome - totalExpense;
  const margin = totalIncome > 0 ? Math.round((netProfit / totalIncome) * 100) : 0;
  const taxEstimate = Math.round(totalIncome * 0.1925);
  const dailyData = [
    { label: 'Lun', sales: 125000, expense: 45000 },
    { label: 'Mar', sales: 89000, expense: 32000 },
    { label: 'Mer', sales: 210000, expense: 75000 },
    { label: 'Jeu', sales: 67000, expense: 15000 },
    { label: 'Ven', sales: 145000, expense: 35000 },
    { label: 'Sam', sales: 98000, expense: 22000 },
    { label: 'Dim', sales: 56000, expense: 8000 },
  ];
  const monthlyAcc = [
    { label: 'Aoû', sales: 850000, expense: 420000 },
    { label: 'Sep', sales: 920000, expense: 480000 },
    { label: 'Oct', sales: 780000, expense: 390000 },
    { label: 'Nov', sales: 1050000, expense: 520000 },
    { label: 'Déc', sales: 980000, expense: 460000 },
    { label: 'Jan', sales: 1120000, expense: 510000 },
  ];
  const periodData = period === 'daily' || period === 'weekly' ? dailyData : monthlyAcc;
  const categoryBreakdown = [
    { name: 'Ventes marchandises', value: 65, color: c.formalio800 },
    { name: 'Services', value: 18, color: '#22c55e' },
    { name: 'Locations', value: 11, color: c.gold500 },
    { name: 'Autres', value: 6, color: c.info500 },
  ];
  const expenseBreakdown = [
    { name: 'Achats stock', value: 42, color: c.danger600 },
    { name: 'Loyer', value: 22, color: c.orange500 },
    { name: 'Transport', value: 15, color: c.gold500 },
    { name: 'Salaires', value: 12, color: c.purple500 },
    { name: 'Autres', value: 9, color: c.surface500 },
  ];
  const runAIAnalysis = () => {
    setAiThinking(true);
    setAiAnalysis(null);
    setTimeout(() => {
      setAiThinking(false);
      setAiAnalysis(`📊 Analyse Mosika AI · ${new Date().toLocaleDateString('fr-FR')}\n\n• Vos ventes ont augmenté de 23% ce mois (vs mois précédent).\n• Catégorie la plus rentable : Ventes marchandises (65% du CA).\n• ⚠️ Anomalie détectée : pic de dépenses "Transport" le mercredi (+180%).\n• 💡 Optimisation : négociez avec votre fournisseur principal (économie estimée: 45,000 FCFA/mois).\n• 📈 Prévision : à ce rythme, vous atteindrez 1.4M FCFA de profit en mars.\n• 🏦 Vous êtes éligible pour un prêt de croissance de 2M FCFA (taux préférentiel: 7.5%).`);
    }, 1800);
  };
  const generateAIReport = (type: string) => {
    setGeneratingReport(type);
    showToast({ type: 'loading', title: 'Génération du rapport...', message: type, duration: 1800 });
    setTimeout(() => {
      setGeneratingReport(null);
      showToast({ type: 'success', title: 'Rapport généré', message: `${type} prêt au téléchargement` });
      openDownload(type, 'Janvier 2025');
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
              <Txt style={{ color: c.formalio200, fontSize: 12, marginTop: 5 }}>Marge nette: <Txt weight="bold" style={{ color: c.formalio200, fontSize: 12 }}>{margin}%</Txt> · 📈 Profitable</Txt>
              <Grid columns={2} gap={8}>
                <View style={styles.glassMetric}><Txt style={{ color: c.formalio200, fontSize: 10 }}>↗ Revenus</Txt><Txt weight="black" style={{ color: c.white, fontSize: 14 }}>{(totalIncome / 1000).toFixed(0)}K</Txt></View>
                <View style={styles.glassMetric}><Txt style={{ color: c.formalio200, fontSize: 10 }}>↘ Dépenses</Txt><Txt weight="black" style={{ color: c.white, fontSize: 14 }}>{(totalExpense / 1000).toFixed(0)}K</Txt></View>
              </Grid>
            </LinearGradient>
            <Grid columns={2} gap={8}>
              <AccKpi label="Ventes du jour" value="125K" sub="FCFA" icon={TrendingUp} delta={12} />
              <AccKpi label="Cash Flow" value="+845K" sub="positif" icon={Wallet} delta={8} />
              <AccKpi label="TVA estimée" value={`${(taxEstimate / 1000).toFixed(0)}K`} sub="à déclarer" icon={Receipt} tone="amber" />
              <AccKpi label="Stock valeur" value="2.4M" sub="42 articles" icon={Package} />
            </Grid>
            <Card>
              <PeriodPicker period={period} setPeriod={setPeriod} />
              <AreaChart data={periodData} keys={['sales', 'expense']} colors={[c.formalio800, c.danger600]} height={150} />
            </Card>
            <Tap onPress={() => setAccTab('ai')} style={styles.aiInsightsBanner}>
              <LinearGradient colors={[c.info500, c.formalio700]} style={styles.aiBannerIcon}><Icon icon={BrainCircuit} size={20} color={c.white} /></LinearGradient>
              <View style={{ flex: 1 }}>
                <Txt weight="bold" style={{ fontSize: 12 }}>Mosika AI a 3 insights</Txt>
                <Txt numberOfLines={1} style={{ color: c.surface600, fontSize: 11 }}>Ventes +23%, anomalie transport détectée, prêt éligible</Txt>
              </View>
              <Icon icon={ChevronRight} size={16} color={c.surface400} />
            </Tap>
            <Grid columns={2} gap={8}>
              <Tap onPress={() => setAccTab('reports')} style={styles.accQuick}><View style={[styles.metricIcon, { backgroundColor: c.formalio50 }]}><Icon icon={FileText} size={16} color={c.formalio700} /></View><View><Txt weight="bold" style={{ fontSize: 12 }}>Rapports IA</Txt><Txt style={{ color: c.surface500, fontSize: 10 }}>8 disponibles</Txt></View></Tap>
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
              <Row style={{ gap: 6, marginTop: 8 }}><Icon icon={ArrowUpRight} size={13} color={c.formalio300} /><Txt style={{ color: c.formalio300, fontSize: 12 }}>+23% vs période précédente</Txt></Row>
            </LinearGradient>
            <Card><Txt weight="bold" style={{ fontSize: 12, marginBottom: 8 }}>Tendance des ventes</Txt><BarChart data={periodData} keys={['sales']} colors={[c.formalio800]} height={166} /></Card>
            <Card>
              <Txt weight="bold" style={{ fontSize: 12, marginBottom: 10 }}>Répartition par catégorie</Txt>
              <View style={{ alignItems: 'center' }}><DonutChart data={categoryBreakdown} size={126} /></View>
              {categoryBreakdown.map((item) => <LegendRow key={item.name} {...item} />)}
            </Card>
            <View style={styles.adviceCard}><Icon icon={BrainCircuit} size={17} color={c.formalio700} /><View style={{ flex: 1 }}><Txt weight="bold" style={{ fontSize: 12 }}>Performance commerciale</Txt><Txt style={{ color: c.surface600, fontSize: 11, lineHeight: 16, marginTop: 3 }}>Vos meilleurs jours sont mardi et vendredi. Augmentez votre stock le lundi pour maximiser ces pics.</Txt></View></View>
          </>
        ) : null}
        {accTab === 'expenses' ? (
          <>
            <LinearGradient colors={[c.danger500, c.danger700]} style={styles.salesHero}>
              <Txt style={{ color: c.danger100, fontSize: 12 }}>Dépenses totales (mois)</Txt>
              <Txt weight="black" style={{ color: c.white, fontSize: 30, marginTop: 4 }}>{(totalExpense / 1000).toFixed(0)}K <Txt weight="bold" style={{ color: c.danger200, fontSize: 16 }}>FCFA</Txt></Txt>
              <Row style={{ gap: 6, marginTop: 8 }}><Icon icon={ArrowDownRight} size={13} color={c.danger100} /><Txt style={{ color: c.danger100, fontSize: 12 }}>-8% vs mois précédent · économie 42K</Txt></Row>
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
              {[
                { label: 'Transport mercredi', desc: '+180% vs moyenne', tone: c.danger500 },
                { label: 'Recharge téléphone', desc: '3 paiements identiques', tone: c.gold500 },
                { label: 'Achat stock', desc: 'Pattern stable', tone: c.formalio500 },
              ].map((item) => (
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
                { icon: TrendingUp, t: 'Prédiction de revenus', d: '92% précision', tone: 'green' },
                { icon: AlertTriangle, t: 'Détection anomalies', d: '3 alertes actives', tone: 'amber' },
                { icon: Sparkles, t: 'Recommandations IA', d: '5 actions suggérées', tone: 'blue' },
                { icon: Calculator, t: 'Auto-catégorisation', d: '98% transactions', tone: 'green' },
              ].map((item) => <CapabilityCard key={item.t} {...item} />)}
            </Grid>
            <View style={styles.optimizationBox}>
              <Row style={{ gap: 5, marginBottom: 8 }}><Icon icon={Zap} size={15} color={c.gold600} /><Txt weight="bold" style={{ color: c.gold700, fontSize: 12 }}>Suggestions d'optimisation</Txt></Row>
              {['Réduire dépenses transport de 15% (économie: 22K FCFA/mois)', 'Augmenter prix vente moyens de 8% (sans perte client)', 'Négocier paiements échelonnés avec fournisseur principal'].map((txt) => <Row key={txt} style={{ gap: 8, marginTop: 5, alignItems: 'flex-start' }}><Icon icon={Check} size={12} color={c.gold700} /><Txt style={{ color: c.gold700, fontSize: 11, lineHeight: 16, flex: 1 }}>{txt}</Txt></Row>)}
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
            <ReportPortfolioSummary />
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
        {delta !== undefined ? <Txt weight="bold" style={{ color: delta >= 0 ? c.formalio600 : c.danger600, fontSize: 10 }}>{delta >= 0 ? '↗' : '↘'} {Math.abs(delta)}%</Txt> : null}
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

function AIAssistant({ isOpen, onClose, transactions, loanRequests, companyId }: { isOpen: boolean; onClose: () => void; transactions: Transaction[]; loanRequests: LoanRequestRecord[]; companyId: string | null }) {
  type Message = { id: number; type: 'user' | 'ai'; content: string; timestamp: Date; suggestions?: string[]; action?: 'categorize' | 'insight' | 'alert' | 'report' };
  const totalIncome = transactions.filter((t) => t.type === 'income').reduce((sum, t) => sum + t.amount, 0);
  const totalExpense = transactions.filter((t) => t.type === 'expense').reduce((sum, t) => sum + t.amount, 0);
  const profit = totalIncome - totalExpense;
  const healthScore = Math.max(52, Math.min(96, Math.round(72 + (profit > 0 ? 12 : -8) + loanRequests.length * 2)));
  const dailyTransactions = transactions.slice(0, 5);
  const [messages, setMessages] = useState<Message[]>([
    { id: 1, type: 'ai', content: "Bonjour Marie. Je suis Mosika, votre copilote finance et comptabilité. J'ai votre activité récente en contexte : revenus, dépenses, cash flow, rapports et demandes de prêt.", timestamp: new Date(), suggestions: ['Show my expenses', 'How much profit did I make?', 'Analyze my business', 'Check loan eligibility'] },
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
    if (lower.includes('download') || lower.includes('rapport') || lower.includes('report') || lower.includes('export')) return { content: "Je peux préparer le rapport mensuel en PDF ou Excel. Votre dernier portefeuille de rapports contient bilan, résultat, trésorerie et TVA. Pour l'instant je simule l'export côté frontend, mais la structure est prête pour brancher le service documentaire.", suggestions: ['Download monthly report', 'Summarize reports', 'Retrieve tax report'], action: 'report' };
    if (lower.includes('invoice') || lower.includes('facture') || lower.includes('unpaid')) return { content: "Je ne vois pas encore de module factures connecté dans cette démo. Je peux tout de même créer une vue mock : 3 factures à suivre, 1 retard estimé et un rappel recommandé pour préserver le cash flow.", suggestions: ['Create invoice reminder', 'Show cash flow risk', 'Export receivables'], action: 'alert' };
    if (lower.includes('profit') || lower.includes('bénéf') || lower.includes('benef') || lower.includes('make')) return { content: `Votre profit net estimé est de ${formatFCFA(profit)}.\n\nRevenus analysés: ${formatFCFA(totalIncome)}\nDépenses analysées: ${formatFCFA(totalExpense)}\nMarge indicative: ${totalIncome ? Math.round((profit / totalIncome) * 100) : 0}%\n\nLecture Mosika: l'activité reste saine si vous gardez les achats stock sous contrôle et sécurisez les encaissements Mobile Money.`, suggestions: ['Analyze my business', 'Show my expenses', 'Download monthly report'], action: 'insight' };
    if (lower.includes('catégoris') || lower.includes('transaction') || lower.includes('today') || lower.includes('summarize')) return { content: `Résumé des transactions récentes:\n\n${dailyTransactions.map((t) => `• ${t.description}: ${t.type === 'income' ? '+' : '-'}${formatFCFA(t.amount)} (${t.category})`).join('\n')}\n\nJ'ai repéré une bonne diversité d'encaissements, avec une vigilance sur les achats stock et le transport.`, suggestions: ['Search transaction history', 'Show my expenses', 'Explain accounting metrics'], action: 'categorize' };
    if (lower.includes('insight') || lower.includes('conseil') || lower.includes('analyze') || lower.includes('business')) return { content: `Analyse business Mosika:\n\n• Santé financière: ${healthScore}%\n• Revenus en progression soutenue sur les ventes marchandises\n• Risque principal: concentration des dépenses d'achat stock\n• Opportunité: préparer un réassort ciblé avant les jours de forte vente\n\nMa recommandation: gardez 18 jours de charges fixes en réserve avant tout investissement important.`, suggestions: ['Check loan eligibility', 'Show cash flow risk', 'Download monthly report'], action: 'insight' };
    if (lower.includes('dépens') || lower.includes('depens') || lower.includes('expense')) return { content: `Dépenses analysées: ${formatFCFA(totalExpense)}.\n\nLes postes les plus sensibles sont achats stock, transport et charges fixes. Je conseille de créer une alerte si le transport dépasse 12% des dépenses hebdomadaires ou si deux achats stock se répètent dans la même journée.`, suggestions: ['Set expense alert', 'Show spending trend', 'Summarize today’s transactions'], action: 'alert' };
    if (lower.includes('tva') || lower.includes('déclar') || lower.includes('tax')) return { content: "Rappel fiscal: votre estimation TVA reste à surveiller avant la prochaine déclaration. Les rapports comptables sont structurés pour séparer TVA collectée, déductible et net à payer.\n\nJe peux aussi expliquer chaque métrique ou préparer un résumé pour votre comptable.", suggestions: ['Explain TVA', 'Retrieve reports', 'Download monthly report'], action: 'alert' };
    if (lower.includes('loan') || lower.includes('score') || lower.includes('crédit') || lower.includes('eligibility')) return { content: `Votre Score Mosika reste très bon: 760.\n\nÉligibilité simulée: jusqu'à ${formatFCFA(2500000)}\nProbabilité d'approbation: 91%\nDemandes actives: ${loanRequests.length}\n\nConseil: finalisez votre KYC et gardez un historique de transactions propre pour accélérer la revue partenaire.`, suggestions: ['Open loan tracker', 'Improve my score', 'Analyze repayment risk'], action: 'insight' };
    return { content: "Je peux chercher dans vos transactions, expliquer vos rapports, résumer la journée, estimer le profit, analyser les dépenses, suivre une demande de prêt ou préparer une recommandation financière. Que souhaitez-vous regarder en premier ?", suggestions: ['Show my expenses', 'Download monthly report', 'How much profit did I make?', 'Check loan eligibility'] };
  };
  const handleSend = () => {
    if (!inputValue.trim()) return;
    const value = inputValue;
    const userMessage: Message = { id: Date.now(), type: 'user', content: value, timestamp: new Date() };
    setMessages((prev) => [...prev, userMessage]);
    setInputValue('');
    setIsTyping(true);
    if (companyId && formalioBackend.isConfigured) {
      void formalioBackend.chat(companyId, value, conversationId)
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
          suggestions: ['Summarize today’s transactions', 'Show my expenses', 'Download monthly report'],
          action: 'insight',
        },
      ]);
      setIsTyping(false);
    }, 1100);
  };
  const latestMessageId = messages[messages.length - 1]?.id;
  const assistantCoreActions = [
    { icon: Download, label: 'Download', onPress: () => setInputValue('Download monthly report') },
    { icon: TrendingDown, label: 'Expenses', onPress: () => setInputValue('Show my expenses') },
    { icon: Calculator, label: 'Profit', onPress: () => setInputValue('How much profit did I make?') },
  ];
  const voiceComposerDisabled = voiceMode === 'preview' || voiceMode === 'playing';
  return (
    <ModalShell visible={isOpen} onClose={onClose}>
      <View style={styles.assistantModal}>
        <View style={styles.assistantHeader}>
          <Row style={{ justifyContent: 'space-between' }}>
            <Row style={{ gap: 10 }}><View style={styles.assistantHeaderIcon}><Icon icon={MessageCircle} size={18} color={c.formalio700} /></View><View><Txt weight="black" style={{ color: c.surface900, fontSize: 15 }}>Mosika</Txt><Txt style={{ color: c.surface500, fontSize: 12 }}>Finance assistant</Txt></View></Row>
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
          {isTyping ? <View style={[styles.messageBubble, styles.aiBubble, { alignSelf: 'flex-start' }]}><Row style={{ gap: 8 }}><ActivityIndicator color={c.formalio600} /><Txt style={{ color: c.surface500, fontSize: 13 }}>Mosika réfléchit...</Txt></Row></View> : null}
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
            <TextInput value={inputValue} onChangeText={setInputValue} placeholder="Posez une question à Mosika..." placeholderTextColor={c.surface400} style={styles.textInput} onSubmitEditing={handleSend} />
          </View>
          <Tap onPress={handleSend} disabled={!inputValue.trim()} style={styles.sendButton}>
            <Icon icon={Send} size={17} color={c.white} />
          </Tap>
        </View>
      </View>
    </ModalShell>
  );
}

function VoiceRecorder({ isOpen, onClose, onComplete }: { isOpen: boolean; onClose: () => void; onComplete: (transaction: ParsedTransaction) => void }) {
  type Phase = 'idle' | 'recording' | 'processing' | 'transcribed' | 'categorized';
  const phrases = useMemo(() => [
    { transcript: "J'ai vendu 50,000 francs de tissus à un client ce matin", parsed: { type: 'income' as const, amount: 50000, description: 'Vente de tissus', category: 'Ventes', method: 'Espèces' } },
    { transcript: "J'ai dépensé 15,000 francs pour le transport de marchandises", parsed: { type: 'expense' as const, amount: 15000, description: 'Transport de marchandises', category: 'Transport', method: 'Espèces' } },
    { transcript: 'Reçu 125,000 francs sur MTN Mobile Money pour vente en gros', parsed: { type: 'income' as const, amount: 125000, description: 'Vente en gros', category: 'Ventes', method: 'MTN MoMo' } },
  ], []);
  const [phase, setPhase] = useState<Phase>('idle');
  const [transcript, setTranscript] = useState('');
  const [parsedData, setParsedData] = useState<ParsedTransaction | null>(null);
  const [recordingTime, setRecordingTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phraseIndexRef = useRef(0);
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
  const startRecording = () => {
    setPhase('recording');
    setTranscript('');
    setRecordingTime(0);
    intervalRef.current = setInterval(() => setRecordingTime((t) => t + 1), 1000);
  };
  const stopRecording = () => {
    if (intervalRef.current) clearInterval(intervalRef.current);
    setPhase('processing');
    const phrase = phrases[phraseIndexRef.current % phrases.length];
    phraseIndexRef.current++;
    setTimeout(() => {
      setTranscript('');
      setPhase('transcribed');
      let i = 0;
      const typeInterval = setInterval(() => {
        if (i < phrase.transcript.length) {
          setTranscript(phrase.transcript.slice(0, i + 1));
          i++;
        } else {
          clearInterval(typeInterval);
          setTimeout(() => {
            setPhase('categorized');
            setParsedData(phrase.parsed);
          }, 800);
        }
      }, 30);
    }, 1500);
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
  return (
    <Row style={{ justifyContent: 'space-between', marginTop: 7, gap: 10 }}>
      <Txt style={{ color: c.surface500, fontSize: 12 }}>{label}</Txt>
      <Txt weight={bold ? 'bold' : 'medium'} numberOfLines={1} style={{ color: valueColor, fontSize: bold ? 15 : 12, flexShrink: 1 }}>{value}</Txt>
    </Row>
  );
}

function DownloadModal({ isOpen, onClose, reportTitle, reportPeriod }: { isOpen: boolean; onClose: () => void; reportTitle: string; reportPeriod: string }) {
  type Phase = 'preview' | 'preparing' | 'downloading' | 'complete';
  const [phase, setPhase] = useState<Phase>('preview');
  const [format, setFormat] = useState<'pdf' | 'excel'>('pdf');
  const [progress, setProgress] = useState(0);
  useEffect(() => {
    if (!isOpen) {
      setPhase('preview');
      setProgress(0);
    }
  }, [isOpen]);
  useEffect(() => {
    if (phase === 'preparing') {
      const t = setTimeout(() => setPhase('downloading'), 1200);
      return () => clearTimeout(t);
    }
    if (phase === 'downloading') {
      const interval = setInterval(() => {
        setProgress((p) => {
          if (p >= 100) {
            clearInterval(interval);
            setTimeout(() => setPhase('complete'), 300);
            return 100;
          }
          return p + 4 + Math.random() * 6;
        });
      }, 80);
      return () => clearInterval(interval);
    }
  }, [phase]);
  const startDownload = (fmt: 'pdf' | 'excel') => {
    setFormat(fmt);
    setProgress(0);
    setPhase('preparing');
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
                <Tap onPress={() => startDownload('pdf')} style={styles.formatButton}><View style={[styles.formatIcon, { backgroundColor: c.danger50 }]}><Icon icon={FileText} size={26} color={c.danger600} /></View><Txt weight="semibold" style={{ fontSize: 14 }}>PDF</Txt><Txt style={{ color: c.surface500, fontSize: 10, marginTop: 4 }}>Idéal pour imprimer</Txt></Tap>
                <Tap onPress={() => startDownload('excel')} style={styles.formatButton}><View style={[styles.formatIcon, { backgroundColor: c.formalio50 }]}><Icon icon={FileSpreadsheet} size={26} color={c.formalio600} /></View><Txt weight="semibold" style={{ fontSize: 14 }}>Excel</Txt><Txt style={{ color: c.surface500, fontSize: 10, marginTop: 4 }}>Pour analyse</Txt></Tap>
              </Grid>
              <Grid columns={3} gap={8}>
                {[{ icon: Eye, label: 'Aperçu' }, { icon: Share2, label: 'Partager' }, { icon: Mail, label: 'Email' }].map((action) => <Tap key={action.label} style={styles.secondaryAction}><Icon icon={action.icon} size={16} color={c.surface600} /><Txt weight="medium" style={{ color: c.surface600, fontSize: 10 }}>{action.label}</Txt></Tap>)}
              </Grid>
            </>
          ) : null}
          {phase === 'preparing' || phase === 'downloading' ? (
            <View style={{ alignItems: 'center', paddingVertical: 16 }}>
              <AnimatedMascot state="loading" size={100} />
              <Txt weight="semibold" style={{ fontSize: 18, marginTop: 16 }}>{phase === 'preparing' ? 'Préparation du fichier...' : 'Téléchargement...'}</Txt>
              <Txt style={{ color: c.surface500, fontSize: 14, marginTop: 4 }}>{format === 'pdf' ? 'PDF en cours de génération' : 'Excel en cours de génération'}</Txt>
              <View style={styles.downloadProgress}>
                <Row style={{ gap: 12, marginBottom: 12 }}>
                  <View style={[styles.transactionIcon, { backgroundColor: format === 'pdf' ? c.danger100 : c.formalio100 }]}><Icon icon={format === 'pdf' ? FileText : FileSpreadsheet} size={20} color={format === 'pdf' ? c.danger600 : c.formalio600} /></View>
                  <View style={{ flex: 1 }}><Txt weight="medium" numberOfLines={1} style={{ fontSize: 13 }}>{reportTitle.toLowerCase().replace(/\s+/g, '-')}.{format === 'pdf' ? 'pdf' : 'xlsx'}</Txt><Txt style={{ color: c.surface500, fontSize: 12 }}>{phase === 'preparing' ? 'Préparation...' : `${Math.round(progress)}% · ${(progress * 12).toFixed(0)} KB / 1.2 MB`}</Txt></View>
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
              <View style={styles.completeFile}><View style={[styles.transactionIcon, { backgroundColor: c.formalio100 }]}><Icon icon={Check} size={20} color={c.formalio700} /></View><View style={{ flex: 1 }}><Txt weight="medium" numberOfLines={1} style={{ fontSize: 13 }}>{reportTitle.toLowerCase().replace(/\s+/g, '-')}.{format === 'pdf' ? 'pdf' : 'xlsx'}</Txt><Txt style={{ color: c.formalio600, fontSize: 12 }}>1.24 MB · Téléchargement complet</Txt></View></View>
              <Row style={{ gap: 8, width: '100%' }}><PrimaryButton label="Nouveau format" tone="surface" onPress={() => setPhase('preview')} style={{ flex: 1, minHeight: 42 }} /><PrimaryButton label="Terminé" icon={Check} onPress={onClose} style={{ flex: 1, minHeight: 42 }} /></Row>
            </View>
          ) : null}
        </ScrollView>
      </View>
    </ModalShell>
  );
}

type ScannerPhase = 'permission' | 'scanning' | 'processing' | 'detected' | 'error';

function ScannerModal({ isOpen, onClose, onSave }: { isOpen: boolean; onClose: () => void; onSave: (ticket: ScannedTicketData) => void }) {
  const [permission, requestPermission] = useCameraPermissions();
  const cameraRef = useRef<CameraView>(null);
  const ticketIndexRef = useRef(0);
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
      merchant: 'Boutique Elegance',
      referenceNumber: 'OM-226-771-902',
      details: 'Paiement mobile confirmé, client récurrent, marge estimée élevée.',
    },
  ], []);

  const resetScanner = useCallback(() => {
    setProgress(0);
    setFlashOn(false);
    setCaptureUri(undefined);
    setDetected(null);
    setPhase('permission');
  }, []);

  const finishDetection = useCallback((uri?: string) => {
    setPhase('processing');
    setTimeout(() => {
      const baseTicket = mockTickets[ticketIndexRef.current % mockTickets.length];
      ticketIndexRef.current += 1;
      const nextTicket = { ...baseTicket, imageUri: uri };
      setDetected(nextTicket);
      setCaptureUri(uri);
      setPhase('detected');
    }, 850);
  }, [mockTickets]);

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
    const timer = setTimeout(() => finishDetection(captureUri), 2850);
    return () => {
      clearInterval(interval);
      clearTimeout(timer);
    };
  }, [captureUri, finishDetection, isOpen, phase]);

  const captureTicket = async () => {
    try {
      setPhase('processing');
      const photo = await cameraRef.current?.takePictureAsync({ quality: 0.72, shutterSound: false });
      finishDetection(photo?.uri);
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
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Camera permission needed</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, lineHeight: 16, textAlign: 'center', marginTop: 4 }}>Open the camera to scan the ticket in real time.</Txt>
                  <PrimaryButton label="Enable camera" icon={Camera} onPress={startScanner} style={{ minHeight: 40, borderRadius: 12, marginTop: 10 }} />
                </View>
              ) : null}
              {phase === 'scanning' ? (
                <View style={{ alignItems: 'center' }}>
                  <Pill tone="blue">Scanning...</Pill>
                  <Txt weight="bold" style={{ color: c.white, fontSize: 15, marginTop: 10 }}>Align ticket inside frame</Txt>
                  <Txt style={{ color: 'rgba(255,255,255,.72)', fontSize: 11, marginTop: 4 }}>Detecting merchant, amount, date and reference</Txt>
                </View>
              ) : null}
              {phase === 'processing' ? (
                <View style={styles.ocrProcessingCard}>
                  <ActivityIndicator color={c.formalio600} />
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Extracting ticket data...</Txt>
                  <Txt style={{ color: c.surface500, fontSize: 11, marginTop: 3 }}>OCR layout model running</Txt>
                </View>
              ) : null}
              {phase === 'detected' ? (
                <View style={styles.ocrSuccessBadge}>
                  <Icon icon={CheckCircle2} size={22} color={c.white} />
                  <Txt weight="black" style={{ color: c.white, fontSize: 12 }}>Detected</Txt>
                </View>
              ) : null}
              {phase === 'error' ? (
                <View style={styles.ocrPermissionCard}>
                  <Icon icon={AlertTriangle} size={28} color={c.danger600} />
                  <Txt weight="bold" style={{ fontSize: 13, marginTop: 8 }}>Capture failed</Txt>
                  <PrimaryButton label="Retry scan" icon={RefreshCw} onPress={startScanner} style={{ minHeight: 40, borderRadius: 12, marginTop: 10 }} />
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
            <PrimaryButton label={phase === 'detected' ? 'Confirm auto-fill' : 'Capture ticket'} icon={phase === 'detected' ? Check : Camera} onPress={phase === 'detected' ? confirmTicket : captureTicket} style={{ flex: 1, minHeight: 44, borderRadius: 13 }} />
          </Row>
          <Tap onPress={onClose} style={styles.ocrManualFallback}>
            <Icon icon={FileText} size={14} color={c.surface500} />
            <Txt weight="bold" style={{ color: c.surface600, fontSize: 11 }}>Manual entry fallback</Txt>
          </Tap>
        </ScrollView>
      </View>
    </ModalShell>
  );
}

function ScannerDataCell({ label, value }: { label: string; value: string }) {
  return (
    <View style={styles.ocrDataCell}>
      <Txt style={{ color: c.surface400, fontSize: 10 }}>{label}</Txt>
      <Txt weight="bold" numberOfLines={1} style={{ color: c.surface800, fontSize: 11, marginTop: 2 }}>{value}</Txt>
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
  screenRoot: { flex: 1, backgroundColor: c.surface50, overflow: 'hidden' },
  header: { height: 58, flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, backgroundColor: c.white, borderBottomWidth: StyleSheet.hairlineWidth, borderBottomColor: c.surface200, shadowColor: c.surface900, shadowOpacity: 0.04, shadowRadius: 10, elevation: 2 },
  headerBack: { width: 38, height: 38, alignItems: 'center', justifyContent: 'center', borderRadius: 12 },
  headerTitle: { flex: 1, fontSize: 18 },
  headerActions: { gap: 8, flexShrink: 0 },
  headerUtilityActions: { gap: 8 },
  bottomNav: { position: 'absolute', left: 12, right: 12, bottom: 8, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, borderRadius: 26, flexDirection: 'row', justifyContent: 'space-around', paddingTop: 8, shadowColor: c.surface950, shadowOpacity: 0.12, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 10 },
  bottomNavItem: { flex: 1, minHeight: 44, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 6, paddingVertical: 5 },
  addTab: { width: 54, height: 54, borderRadius: 27, alignItems: 'center', justifyContent: 'center', backgroundColor: c.formalio700, shadowColor: c.formalio900, shadowOpacity: 0.24, shadowRadius: 18, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  card: { backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, padding: 14, shadowColor: c.surface900, shadowOpacity: 0.04, shadowRadius: 8, shadowOffset: { width: 0, height: 2 }, elevation: 1 },
  row: { flexDirection: 'row', alignItems: 'center' },
  pill: { alignSelf: 'flex-start', borderRadius: 999, paddingHorizontal: 8, paddingVertical: 4 },
  primaryButton: { minHeight: 52, borderRadius: 18, alignItems: 'center', justifyContent: 'center', borderWidth: 1 },
  authFull: { flex: 1, alignItems: 'center', justifyContent: 'center', overflow: 'hidden' },
  decorativeOrb: { position: 'absolute', width: 260, height: 260, borderRadius: 180 },
  softOrb: { position: 'absolute', width: 150, height: 150, borderRadius: 100 },
  authShell: { flex: 1 },
  welcomeScreen: { minHeight: 680, flex: 1, justifyContent: 'space-between' },
  welcomeCenter: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 24 },
  welcomeTitle: { marginTop: 26, textAlign: 'center', fontSize: 24, lineHeight: 30 },
  welcomeCopy: { marginTop: 12, maxWidth: 310, textAlign: 'center', color: c.surface500, fontSize: 14, lineHeight: 21 },
  chipWrap: { marginTop: 22, flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', gap: 8 },
  chipWrapLeft: { marginTop: 8, flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dot: { width: 8, height: 8, borderRadius: 999, backgroundColor: c.surface200 },
  dotActive: { width: 32, backgroundColor: c.formalio700 },
  formScreen: { flexGrow: 1, padding: 24 },
  authBack: { width: 40, height: 40, borderRadius: 20, backgroundColor: c.surface50, alignItems: 'center', justifyContent: 'center', marginBottom: 18 },
  authTitle: { fontSize: 24, lineHeight: 31, marginTop: 20 },
  authSubtitle: { color: c.surface500, fontSize: 14, marginTop: 5, lineHeight: 20 },
  segment: { flexDirection: 'row', gap: 4, backgroundColor: c.surface100, borderRadius: 13, padding: 4 },
  segmentItem: { flex: 1, borderRadius: 10, minHeight: 36, alignItems: 'center', justifyContent: 'center', flexDirection: 'row', gap: 5, paddingHorizontal: 6, position: 'relative', overflow: 'hidden' },
  segmentSelected: { backgroundColor: c.white, shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 5, shadowOffset: { width: 0, height: 1 }, elevation: 1 },
  segmentGlow: { position: 'absolute', left: 10, right: 10, bottom: 4, height: 2, borderRadius: 2, backgroundColor: c.formalio400 },
  inputBox: { minHeight: 58, borderRadius: 18, backgroundColor: c.surface50, borderWidth: 2, borderColor: c.surface100, paddingHorizontal: 14, paddingVertical: 14, flexDirection: 'row', alignItems: 'center', gap: 9 },
  inputBoxFocused: { borderColor: c.formalio300, backgroundColor: c.white, shadowColor: c.formalio900, shadowOpacity: 0.08, shadowRadius: 12, shadowOffset: { width: 0, height: 4 }, elevation: 2 },
  textInput: { flex: 1, minHeight: 30, color: c.surface900, fontFamily: font.medium, fontSize: 15, lineHeight: 21, paddingVertical: 2, paddingHorizontal: 0 },
  fieldLabel: { color: c.surface700, fontSize: 12, marginBottom: 6 },
  vDivider: { width: 1, height: 20, backgroundColor: c.surface300 },
  dividerLine: { flex: 1, height: 1, backgroundColor: c.surface200 },
  strengthBar: { flex: 1, height: 6, borderRadius: 6 },
  biometricCircle: { width: 128, height: 128, borderRadius: 64, backgroundColor: c.formalio50, alignItems: 'center', justifyContent: 'center', marginTop: 60 },
  successScreen: { flexGrow: 1, alignItems: 'center', justifyContent: 'center', padding: 24 },
  checkBig: { width: 80, height: 80, borderRadius: 40, backgroundColor: c.formalio100, alignItems: 'center', justifyContent: 'center', marginTop: 20 },
  otpBox: { width: 48, height: 58, borderRadius: 17, backgroundColor: c.surface50, borderWidth: 1, borderColor: c.surface200, textAlign: 'center', fontFamily: font.bold, fontSize: 21, color: c.surface900, paddingVertical: 8 },
  bubble: { position: 'absolute', backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, borderRadius: 16, paddingHorizontal: 12, paddingVertical: 8, shadowColor: c.surface900, shadowOpacity: 0.08, shadowRadius: 12, elevation: 2 },
  halo: { position: 'absolute' },
  toastHost: { position: 'absolute', left: 0, right: 0, zIndex: 300, alignItems: 'center', paddingHorizontal: 16, gap: 8 },
  toast: { width: '100%', maxWidth: 390, borderRadius: 18, padding: 14, flexDirection: 'row', gap: 10, alignItems: 'flex-start', shadowColor: c.surface950, shadowOpacity: 0.18, shadowRadius: 24, shadowOffset: { width: 0, height: 10 }, elevation: 9 },
  valueTrack: { height: 8, borderRadius: 99, overflow: 'hidden' },
  valueFill: { height: '100%', borderRadius: 99 },
  headerSpacer: { width: 40 },
  avatar: { width: 44, height: 44, borderRadius: 22, backgroundColor: c.formalio100, borderWidth: 2, borderColor: c.white, alignItems: 'center', justifyContent: 'center', shadowColor: c.surface900, shadowOpacity: 0.08, shadowRadius: 8, elevation: 2 },
  iconButton: { width: 40, height: 40, borderRadius: 12, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, alignItems: 'center', justifyContent: 'center' },
  notificationDot: { position: 'absolute', top: 8, right: 8, width: 8, height: 8, borderRadius: 4, backgroundColor: c.danger500 },
  offlineBadge: { flexDirection: 'row', alignItems: 'center', gap: 4, paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9, backgroundColor: c.amber50 },
  modeToggle: { minWidth: 74, height: 40, borderRadius: 14, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 5, paddingHorizontal: 9 },
  modeToggleOffline: { borderColor: c.amber200, backgroundColor: c.amber50 },
  balanceCard: { borderRadius: 26, padding: 20, marginBottom: 16, overflow: 'hidden', shadowColor: c.surface900, shadowOpacity: 0.16, shadowRadius: 20, shadowOffset: { width: 0, height: 10 }, elevation: 6 },
  balancePill: { flexDirection: 'row', alignItems: 'center', gap: 4, backgroundColor: 'rgba(255,255,255,.1)', paddingHorizontal: 8, paddingVertical: 5, borderRadius: 9 },
  balanceDetail: { flexDirection: 'row', alignItems: 'center', gap: 3, backgroundColor: 'rgba(255,255,255,.1)', paddingHorizontal: 12, paddingVertical: 5, borderRadius: 9 },
  quickAction: { minHeight: 98, backgroundColor: c.white, borderWidth: 1, borderColor: c.surface200, borderRadius: 16, paddingHorizontal: 8, paddingVertical: 11, alignItems: 'center', justifyContent: 'center', shadowColor: c.surface900, shadowOpacity: 0.035, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  quickIcon: { width: 38, height: 38, borderRadius: 12, alignItems: 'center', justifyContent: 'center', marginBottom: 7 },
  quickValue: { fontSize: 15, lineHeight: 18 },
  quickLabel: { color: c.surface500, fontSize: 10, lineHeight: 13, marginTop: 2 },
  actionCard: { minHeight: 78, flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, padding: 14, shadowColor: c.surface900, shadowOpacity: 0.035, shadowRadius: 10, shadowOffset: { width: 0, height: 3 }, elevation: 1 },
  actionIcon: { width: 44, height: 44, borderRadius: 13, alignItems: 'center', justifyContent: 'center' },
  aiAccounting: { borderRadius: 18, padding: 16, marginBottom: 16, overflow: 'hidden', shadowColor: c.surface900, shadowOpacity: 0.12, shadowRadius: 16, elevation: 5 },
  aiIconBox: { width: 48, height: 48, borderRadius: 18, backgroundColor: 'rgba(255,255,255,.15)', alignItems: 'center', justifyContent: 'center' },
  newBadge: { backgroundColor: c.gold500, borderRadius: 999, paddingHorizontal: 6, paddingVertical: 2 },
  mosikaTip: { flexDirection: 'row', gap: 12, borderRadius: 18, borderWidth: 1, borderColor: c.formalio200, backgroundColor: c.formalio50, padding: 14 },
  transactionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', gap: 10, paddingVertical: 10, paddingHorizontal: 8 },
  transactionIcon: { width: 40, height: 40, borderRadius: 12, alignItems: 'center', justifyContent: 'center' },
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
  choiceCard: { minHeight: 74, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, alignItems: 'center', justifyContent: 'center', padding: 10, gap: 6 },
  choiceIcon: { width: 30, height: 30, borderRadius: 10, alignItems: 'center', justifyContent: 'center' },
  choiceSelected: { borderColor: c.formalio300, backgroundColor: c.formalio50 },
  choiceSelectedExpense: { borderColor: c.danger200, backgroundColor: c.danger50 },
  selectChip: { borderRadius: 9, borderWidth: 1, borderColor: c.surface200, backgroundColor: c.white, paddingHorizontal: 12, paddingVertical: 8 },
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
  reportRow: { flexDirection: 'row', alignItems: 'center', gap: 12, backgroundColor: c.white, borderRadius: 14, borderWidth: 1, borderColor: c.surface200, padding: 14 },
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
  profileHero: { paddingHorizontal: 16, paddingTop: 30, paddingBottom: 24, minHeight: 150, overflow: 'hidden', justifyContent: 'flex-end' },
  profileTopActions: { position: 'absolute', top: 18, right: 16, zIndex: 3 },
  profileCoverAction: { position: 'absolute', top: 18, right: 16, zIndex: 2, flexDirection: 'row', alignItems: 'center', gap: 5, borderRadius: 999, backgroundColor: 'rgba(255,255,255,.16)', paddingHorizontal: 10, paddingVertical: 7 },
  profileAvatar: { width: 64, height: 64, borderRadius: 32, backgroundColor: 'rgba(255,255,255,.1)', borderWidth: 2, borderColor: 'rgba(255,255,255,.22)', alignItems: 'center', justifyContent: 'center' },
  profileAvatarImage: { width: '100%', height: '100%', borderRadius: 32 },
  profileCheck: { position: 'absolute', right: -2, bottom: -2, width: 24, height: 24, borderRadius: 12, backgroundColor: c.formalio500, borderWidth: 2, borderColor: c.formalio800, alignItems: 'center', justifyContent: 'center' },
  profileCompletionCard: { marginBottom: 12, borderColor: c.formalio200 },
  profileEditorCard: { marginBottom: 12, padding: 15 },
  profileMiniButton: { minHeight: 34, borderRadius: 11, alignItems: 'center', justifyContent: 'center', paddingHorizontal: 12, backgroundColor: c.surface100 },
  profileMiniButtonPrimary: { backgroundColor: c.formalio700 },
  profileUploadTile: { minHeight: 112, borderRadius: 16, borderWidth: 1, borderColor: c.surface200, overflow: 'hidden', justifyContent: 'center', alignItems: 'center' },
  profileUploadContent: { minHeight: 112, alignItems: 'center', justifyContent: 'center', gap: 7, padding: 12 },
  profileInfoRow: { gap: 10, minHeight: 46, borderTopWidth: 1, borderTopColor: c.surface100 },
  profileMenu: { backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, overflow: 'hidden', shadowColor: c.surface900, shadowOpacity: 0.06, shadowRadius: 12, elevation: 2 },
  profileMenuItem: { flexDirection: 'row', alignItems: 'center', gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
  logoutButton: { flexDirection: 'row', alignItems: 'center', justifyContent: 'center', gap: 8, paddingVertical: 14, marginTop: 16 },
  settingsList: { backgroundColor: c.white, borderRadius: 18, borderWidth: 1, borderColor: c.surface200, overflow: 'hidden', marginBottom: 16 },
  settingsItem: { gap: 12, paddingHorizontal: 16, paddingVertical: 14 },
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
