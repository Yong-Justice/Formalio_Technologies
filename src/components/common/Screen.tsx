import React from 'react';
import { KeyboardAvoidingView, Platform, ScrollView, View } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { OfflineBanner } from './OfflineBanner';

export function Screen({ children, scroll = true }: { children: React.ReactNode; scroll?: boolean }) {
  const content = scroll ? (
    <ScrollView keyboardShouldPersistTaps="handled" showsVerticalScrollIndicator={false} contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
      {children}
    </ScrollView>
  ) : (
    <View className="flex-1 p-4">{children}</View>
  );
  return (
    <SafeAreaView className="flex-1 bg-surface-50">
      <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} className="flex-1">
        <OfflineBanner />
        {content}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}