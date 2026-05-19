import React, { useRef } from 'react';
import { TextInput, View } from 'react-native';

export function OTPInput({ value, onChange }: { value: string; onChange: (value: string) => void }) {
  const refs = useRef<Array<TextInput | null>>([]);
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
          className="h-14 flex-1 rounded-2xl border border-surface-200 bg-white text-center text-xl font-black text-navy"
        />
      ))}
    </View>
  );
}