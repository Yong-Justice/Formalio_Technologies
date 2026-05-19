import React from 'react';
import { Image, Text, View } from 'react-native';

export function FormalioLogo({ size = 40, showText = true, light = false }: { size?: number; showText?: boolean; light?: boolean }) {
  return (
    <View className="flex-row items-center gap-2">
      <Image source={require('../../../assets/images/icon.png')} style={{ width: size, height: size, borderRadius: size * 0.22 }} />
      {showText ? (
        <View>
          <Text className={`font-black ${light ? 'text-white' : 'text-navy'}`} style={{ fontSize: size * 0.5 }}>Formalio</Text>
          {size >= 36 ? <Text className={`text-[8px] font-bold tracking-widest ${light ? 'text-white/60' : 'text-teal'}`}>BUSINESS · COMPLIANT · GROWING</Text> : null}
        </View>
      ) : null}
    </View>
  );
}