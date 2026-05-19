import React from 'react';
import { Text, View } from 'react-native';
import { Image } from 'expo-image';

export function FormalioLogo({ size = 40, showText = true, light = false }: { size?: number; showText?: boolean; light?: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <Image
        source={require('../../../assets/images/official-logo.png')}
        style={{ width: size, height: size, borderRadius: size * 0.22 }}
        contentFit="contain"
        transition={120}
        accessibilityLabel="Formalio official logo"
      />
      {showText ? (
        <View>
          <Text className={`font-black ${light ? 'text-white' : 'text-navy'}`} style={{ fontSize: size * 0.5 }}>Formalio</Text>
          {size >= 36 ? <Text className={`text-[8px] font-bold ${light ? 'text-white/60' : 'text-teal'}`} style={{ letterSpacing: 0 }}>BUSINESS · COMPLIANT · GROWING</Text> : null}
        </View>
      ) : null}
    </View>
  );
}
