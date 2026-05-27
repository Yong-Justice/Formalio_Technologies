import React, { createContext, useCallback, useContext, useEffect, useState } from 'react';
import {
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
import { LinearGradient } from 'expo-linear-gradient';
import { SafeAreaView, useSafeAreaInsets } from 'react-native-safe-area-context';
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
  FadeIn,
  FadeOut,
  SlideInDown,
  SlideInRight,
  SlideOutLeft,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withSpring,
  withTiming,
  type SharedValue,
} from 'react-native-reanimated';
import {
  AlertTriangle,
  ArrowLeft,
  Bell,
  CheckCircle2,
  FileText,
  Home,
  Lightbulb,
  Plus,
  RefreshCw,
  Sparkles,
  TrendingDown,
  TrendingUp,
  User,
  Wallet,
  Wifi,
  WifiOff,
  X,
  type LucideIcon,
} from 'lucide-react-native';

import { MobileMoneyIcon, getMobileMoneyProvider } from '@/components/momo/MobileMoneyIcon';
import { localizeRuntimeText, type SupportedLanguage } from '@/i18n';
import { notifications as initialNotifications, type Transaction } from './demoData';
import { styles } from './styles';
import { c, defaultTextMaxScale, font, inputTextMaxScale, isAndroidNative } from './theme';
import { getTransactionTime } from './domain/transactions';
import type { MascotState, Screen, Toast } from './contracts';

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


let currentAppLanguage: SupportedLanguage = 'fr';

export function setCurrentAppLanguage(language: SupportedLanguage) {
  currentAppLanguage = language;
}
export const AppLanguageContext = createContext<SupportedLanguage | null>(null);

export function useAppLanguage() {
  return useContext(AppLanguageContext) ?? currentAppLanguage;
}

export function Txt({
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

export function Tap({
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

export function Icon({ icon: IconComponent, size = 18, color = c.surface600, strokeWidth = 2.2 }: { icon: LucideIcon; size?: number; color?: string; strokeWidth?: number }) {
  return <IconComponent size={size} color={color} strokeWidth={strokeWidth} />;
}

export function Card({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.card, style]}>{children}</View>;
}

export function Row({ children, style }: { children: React.ReactNode; style?: StyleProp<ViewStyle> }) {
  return <View style={[styles.row, style]}>{children}</View>;
}

export function Grid({ children, columns = 2, gap = 8 }: { children: React.ReactNode; columns?: number; gap?: number }) {
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

export function Pill({ children, tone = 'green', style }: { children: React.ReactNode; tone?: 'green' | 'gold' | 'blue' | 'red' | 'surface'; style?: StyleProp<ViewStyle> }) {
  const palette = {
    green: [c.formalio50, c.formalio700],
    gold: [c.gold50, c.gold700],
    blue: [c.info50, c.info700],
    red: [c.danger50, c.danger600],
    surface: [c.surface100, c.surface600],
  }[tone];
  const content = React.Children.map(children, (child) => {
    if (typeof child === 'string' || typeof child === 'number') {
      return (
        <Txt weight="bold" style={{ color: palette[1], fontSize: 10 }}>
          {child}
        </Txt>
      );
    }

    return child;
  });

  return (
    <View style={[styles.pill, { backgroundColor: palette[0] }, style]}>
      {content}
    </View>
  );
}

export function PrimaryButton({
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

export function LogoMark({ size = 48, light = false }: { size?: number; light?: boolean }) {
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

export function Logo({ size = 40, light = false }: { size?: number; light?: boolean }) {
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

export function AnimatedMascot({ state = 'idle', size = 120, showBubble, message }: { state?: MascotState; size?: number; showBubble?: boolean; message?: string }) {
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

export function useToast() {
  const ctx = useContext(ToastContext);
  if (!ctx) throw new Error('useToast must be used within ToastProvider');
  return ctx;
}

export function ToastProvider({ children }: { children: React.ReactNode }) {
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

export function ValueBar({ value, color = c.formalio500, track = c.surface100 }: { value: number; color?: string; track?: string }) {
  return (
    <View style={[styles.valueTrack, { backgroundColor: track }]}>
      <Animated.View entering={FadeIn.duration(500)} style={[styles.valueFill, { width: `${Math.max(4, Math.min(100, value))}%`, backgroundColor: color }]} />
    </View>
  );
}

export function BarChart({ data, keys, colors, labels = true, height = 150 }: { data: any[]; keys: string[]; colors: string[]; labels?: boolean; height?: number }) {
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

export function AreaChart({ data, keys, colors, height = 150 }: { data: any[]; keys: string[]; colors: string[]; height?: number }) {
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

export function DonutChart({ data, size = 128 }: { data: { name: string; value: number; color: string }[]; size?: number }) {
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

export function Segment<T extends string>({ value, options, onChange, style }: { value: T; options: { key: T | string; label: string; icon?: LucideIcon }[]; onChange: (v: T) => void; style?: StyleProp<ViewStyle> }) {
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
            <View key={option.key} style={styles.segmentAndroidSlot}>
              <Pressable
                accessibilityRole="button"
                accessibilityState={{ selected }}
                onPress={() => onChange(option.key as T)}
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
            </View>
          );
        }
        return (
          <Tap
            key={option.key}
            onPress={() => onChange(option.key as T)}
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

export function Field({
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

export function ModalShell({ visible, onClose, children, align = 'bottom' }: { visible: boolean; onClose: () => void; children: React.ReactNode; align?: 'bottom' | 'center' }) {
  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={styles.modalBackdrop}>
        <Pressable style={[StyleSheet.absoluteFill, { zIndex: 0 }]} onPress={onClose} />
        <Animated.View
          entering={align === 'bottom' ? SlideInDown.springify().damping(22).stiffness(180) : FadeIn.duration(180)}
          exiting={FadeOut.duration(160)}
          style={[styles.modalCard, { zIndex: 1, elevation: 24 }, align === 'center' && { alignSelf: 'center', marginTop: 80, marginBottom: 80 }]}
        >
          {children}
        </Animated.View>
      </KeyboardAvoidingView>
    </Modal>
  );
}

export function ScreenWrapper({
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
  openAi,
  offlineMode,
  setOfflineMode,
  notifications,
  pendingSyncCount = 0,
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
  openAi?: () => void;
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  notifications: typeof initialNotifications;
  pendingSyncCount?: number;
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
              {showNav ? <HeaderUtilityActions offlineMode={offlineMode} setOfflineMode={setOfflineMode} notifications={notifications} navigate={navigate} pendingSyncCount={pendingSyncCount} /> : null}
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
      {showNav && openAi ? (
        <AssistantFloatingAction
          bottom={navBottomOffset + 72}
          onPress={openAi}
        />
      ) : null}
    </SafeAreaView>
  );
}

function AssistantFloatingAction({
  bottom,
  onPress,
}: {
  bottom: number;
  onPress: () => void;
}) {
  return (
    <View pointerEvents="box-none" style={[styles.aiFabDock, { bottom, right: 18, zIndex: 240, elevation: 48 }]}>
      <Pressable
        accessibilityRole="button"
        accessibilityLabel="Ouvrir Mosika AI"
        collapsable={false}
        hitSlop={12}
        onPress={onPress}
        style={({ pressed }) => [
          styles.aiFabTouchable,
          pressed && { opacity: 0.88 },
        ]}
      >
        <View pointerEvents="none" style={styles.aiFab}>
          <LinearGradient colors={[c.formalio600, c.formalio800]} style={styles.aiFabInner}>
            <Icon icon={Sparkles} size={21} color={c.white} />
          </LinearGradient>
          <View style={styles.aiFabBadge}>
            <Txt weight="bold" style={{ color: c.white, fontSize: 9 }}>AI</Txt>
          </View>
        </View>
      </Pressable>
    </View>
  );
}

export function HeaderUtilityActions({
  offlineMode,
  setOfflineMode,
  notifications,
  navigate,
  pendingSyncCount = 0,
}: {
  offlineMode: boolean;
  setOfflineMode: (v: boolean) => void;
  notifications: typeof initialNotifications;
  navigate: (s: Screen) => void;
  pendingSyncCount?: number;
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
        {pendingSyncCount > 0 ? (
          <View style={styles.notificationDot} />
        ) : null}
      </Tap>
      <Tap onPress={() => navigate('notifications')} accessibilityLabel="Notifications" style={styles.iconButton}>
        <Icon icon={Bell} size={20} color={c.surface600} />
        {unread ? <View style={styles.notificationDot} /> : null}
      </Tap>
    </Row>
  );
}


export function FilterChipGroup({
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

export function PaymentMethodInline({ method, color = c.surface500 }: { method: string; color?: string }) {
  const provider = getMobileMoneyProvider(method);
  return (
    <Row style={styles.paymentMethodInline}>
      {provider ? <MobileMoneyIcon provider={provider} size={16} containerStyle={styles.paymentMethodMiniIcon} /> : null}
      <Txt numberOfLines={1} style={{ color, fontSize: 11 }}>{method}</Txt>
    </Row>
  );
}

export function PaymentBrandPill({ label }: { label: string }) {
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

export function TransactionRow({ transaction, compact = false }: { transaction: Transaction; compact?: boolean }) {
  const income = transaction.type === 'income';
  const fiche = transaction.type === 'fiche_reconciliation';
  const retrait = transaction.type === 'retrait';
  const positive = income || fiche;
  const icon = fiche ? FileText : retrait ? Wallet : income ? TrendingUp : TrendingDown;
  const amountColor = retrait ? '#F97316' : positive ? c.formalio600 : c.danger500;
  const iconBg = retrait ? '#FFF7ED' : positive ? c.formalio50 : c.danger50;
  return (
    <View style={[styles.transactionRow, compact && { paddingVertical: 8 }]}>
      <Row style={{ gap: 12, flex: 1, minWidth: 0 }}>
        <View style={[styles.transactionIcon, { backgroundColor: iconBg }]}>
          <Icon icon={icon} size={compact ? 16 : 20} color={amountColor} />
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
      <Txt weight="bold" style={{ color: amountColor, fontSize: 13 }}>{positive ? '+' : '-'}{transaction.amount.toLocaleString('fr-FR')}</Txt>
    </View>
  );
}


export type AvatarStyle = 'short' | 'bob' | 'curly' | 'wrap' | 'waves' | 'fade';
export type ProfileAvatar = { id: string; label: string; group: 'Women' | 'Men' | 'Neutral'; skin: string; hair: string; accent: string; suit: string; style: AvatarStyle };

export const profileAvatars: ProfileAvatar[] = [
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

export const coverThemes = [
  { id: 'emerald', label: 'Emerald', colors: [c.formalio900, c.formalio700] as const },
  { id: 'midnight', label: 'Midnight', colors: ['#111827', '#334155'] as const },
  { id: 'gold', label: 'Gold', colors: ['#78350f', '#d97706'] as const },
  { id: 'indigo', label: 'Indigo', colors: ['#312e81', '#2563eb'] as const },
];

export function getProfileAvatar(id?: string) {
  return profileAvatars.find((avatar) => avatar.id === id) ?? profileAvatars[0];
}

export function getCoverTheme(id?: string) {
  return coverThemes.find((theme) => theme.id === id) ?? coverThemes[0];
}

export function BuiltInAvatar({ avatarId, size = 72, selected = false }: { avatarId?: string; size?: number; selected?: boolean }) {
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


export function InfoLine({ label, value, valueColor = c.surface900, bold }: { label: string; value: string; valueColor?: string; bold?: boolean }) {
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


export function ToneIcon({ icon, tone, spinning }: { icon: LucideIcon; tone: 'green' | 'amber' | 'blue'; spinning?: boolean }) {
  const palette = tone === 'green' ? [c.formalio50, c.formalio700] : tone === 'amber' ? [c.gold50, c.gold600] : [c.info50, c.info600];
  return (
    <View style={[styles.transactionIcon, { backgroundColor: palette[0] }]}>
      <Icon icon={spinning ? RefreshCw : icon} size={16} color={palette[1]} />
    </View>
  );
}
