import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';

export function OTPInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const refs = useRef<(TextInput | null)[]>([]);
  const digits = value.padEnd(6, ' ').slice(0, 6).split('');
  return (
    <View className="flex-row justify-between gap-2">
      {digits.map((digit, index) => (
        <TextInput
          key={index}
          ref={(ref) => { refs.current[index] = ref; }}
          value={digit.trim()}
          keyboardType="number-pad"
          maxLength={1}
          onChangeText={(text) => {
            const next = value.split('');
            next[index] = text.slice(-1);
            const joined = next.join('').slice(0, 6);
            onChange(joined);
            if (text && index < 5) refs.current[index + 1]?.focus();
          }}
          className="h-[60px] flex-1 rounded-[18px] border-2 border-surface-200 bg-white py-3 text-center text-[22px] font-black text-navy"
        />
      ))}
    </View>
  );
}
