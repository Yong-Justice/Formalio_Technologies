import React from 'react';
import { ActivityIndicator, Pressable, Text, PressableProps } from 'react-native';

type Variant = 'primary' | 'secondary' | 'danger' | 'ghost';

interface ButtonProps extends PressableProps {
  title: string;
  variant?: Variant;
  loading?: boolean;
}

const styles: Record<Variant, string> = {
  primary: 'bg-navy',
  secondary: 'bg-white border border-surface-200',
  danger: 'bg-danger',
  ghost: 'bg-transparent'
};

const textStyles: Record<Variant, string> = {
  primary: 'text-white',
  secondary: 'text-surface-900',
  danger: 'text-white',
  ghost: 'text-navy'
};

export function Button({ title, variant = 'primary', loading, disabled, className = '', ...props }: ButtonProps & { className?: string }) {
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled || loading}
      className={`min-h-[48px] items-center justify-center rounded-2xl px-5 ${styles[variant]} ${(disabled || loading) ? 'opacity-50' : 'active:opacity-80'} ${className}`}
      {...props}
    >
      {loading ? <ActivityIndicator color={variant === 'secondary' ? '#001F3F' : '#FFFFFF'} /> : <Text className={`text-base font-bold ${textStyles[variant]}`}>{title}</Text>}
    </Pressable>
  );
}