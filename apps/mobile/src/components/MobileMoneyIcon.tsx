import React from 'react';
import {
  Image,
  StyleSheet,
  View,
  type ImageStyle,
  type StyleProp,
  type ViewStyle,
} from 'react-native';

export type MobileMoneyProvider = 'mtn-momo' | 'orange-money';

const mobileMoneyAssets: Record<MobileMoneyProvider, number> = {
  'mtn-momo': require('../../assets/images/mobile-money/mtn-momo.png'),
  'orange-money': require('../../assets/images/mobile-money/orange-money.png'),
};

const mobileMoneyLabels: Record<MobileMoneyProvider, string> = {
  'mtn-momo': 'MTN MoMo',
  'orange-money': 'Orange Money',
};

function normalizeProviderText(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '');
}

export function getMobileMoneyProvider(value?: string | null): MobileMoneyProvider | null {
  if (!value) return null;
  const normalized = normalizeProviderText(value);

  if (normalized.includes('orangemoney') || (normalized.includes('orange') && normalized.includes('money'))) {
    return 'orange-money';
  }

  if (
    normalized.includes('mtnmomo') ||
    normalized.includes('mtnmobilemoney') ||
    normalized.includes('momofrommtn') ||
    normalized.includes('mtnmoney') ||
    normalized === 'momo' ||
    (normalized.includes('mtn') && normalized.includes('momo')) ||
    (normalized.includes('mtn') && normalized.includes('money'))
  ) {
    return 'mtn-momo';
  }

  return null;
}

export function getMobileMoneyLabel(provider: MobileMoneyProvider) {
  return mobileMoneyLabels[provider];
}

export function isMobileMoneyMethod(value?: string | null) {
  return Boolean(getMobileMoneyProvider(value));
}

export function MobileMoneyIcon({
  method,
  provider,
  size = 28,
  containerStyle,
  imageStyle,
}: {
  method?: string | null;
  provider?: MobileMoneyProvider | null;
  size?: number;
  containerStyle?: StyleProp<ViewStyle>;
  imageStyle?: StyleProp<ImageStyle>;
}) {
  const resolvedProvider = provider ?? getMobileMoneyProvider(method);
  if (!resolvedProvider) return null;

  const isOrange = resolvedProvider === 'orange-money';
  const imageWidth = isOrange ? size * 0.96 : size * 0.86;
  const imageHeight = isOrange ? size * 0.68 : size * 0.86;

  return (
    <View
      accessibilityLabel={mobileMoneyLabels[resolvedProvider]}
      style={[
        styles.frame,
        {
          width: size,
          height: size,
          borderRadius: Math.max(8, size * 0.28),
        },
        containerStyle,
      ]}
    >
      <Image
        source={mobileMoneyAssets[resolvedProvider]}
        resizeMode="contain"
        style={[{ width: imageWidth, height: imageHeight }, imageStyle]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  frame: {
    alignItems: 'center',
    justifyContent: 'center',
    overflow: 'hidden',
    backgroundColor: '#ffffff',
  },
});
