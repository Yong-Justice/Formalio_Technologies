import React, { useState } from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, className = '', onFocus, onBlur, ...props }: TextFieldProps & { className?: string }) {
  const [focused, setFocused] = useState(false);
  return (
    <View className="gap-2">
      <Text className="text-sm font-semibold text-surface-700">{label}</Text>
      <TextInput
        {...props}
        placeholderTextColor="#94A3B8"
        onFocus={(event) => {
          setFocused(true);
          onFocus?.(event);
        }}
        onBlur={(event) => {
          setFocused(false);
          onBlur?.(event);
        }}
        className={`min-h-[58px] rounded-[18px] border-2 bg-white px-4 py-4 text-[15px] leading-6 text-surface-900 ${focused ? 'border-teal shadow-sm' : error ? 'border-danger' : 'border-surface-200'} ${className}`}
      />
      {error ? <Text className="text-xs font-medium text-danger">{error}</Text> : null}
    </View>
  );
}
