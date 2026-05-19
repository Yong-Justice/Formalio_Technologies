import React from 'react';
import { Text, TextInput, TextInputProps, View } from 'react-native';

interface TextFieldProps extends TextInputProps {
  label: string;
  error?: string;
}

export function TextField({ label, error, className = '', ...props }: TextFieldProps & { className?: string }) {
  return (
    <View className="gap-1.5">
      <Text className="text-sm font-semibold text-surface-700">{label}</Text>
      <TextInput
        placeholderTextColor="#94A3B8"
        className={`min-h-[48px] rounded-2xl border bg-white px-4 text-base text-surface-900 ${error ? 'border-danger' : 'border-surface-200'} ${className}`}
        {...props}
      />
      {error ? <Text className="text-xs font-medium text-danger">{error}</Text> : null}
    </View>
  );
}