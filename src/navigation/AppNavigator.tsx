import '@/services/observability/sentry';
import '@/styles/global.css';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import { GestureHandlerRootView } from 'react-native-gesture-handler';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/providers/AppProviders';
import { useAuthStore } from '@/store/authStore';
import { Sentry } from '@/services/observability/sentry';

import { vexo } from 'vexo-analytics';

// Initialize Vexo at the root level, outside of any component
if (__DEV__ === false) {
  vexo('b52dba9f-c071-4b87-98d1-5d79891007da');
}

function RootLayout() {
  const isHydrated = useAuthStore((s) => s.isHydrated);

  useEffect(() => {
    if (isHydrated) void SplashScreen.hideAsync();
  }, [isHydrated]);

  return (
    <GestureHandlerRootView style={{ flex: 1 }}>
      <AppProviders>
        <StatusBar style="dark" backgroundColor="#f8fafc" />
        <Stack
          screenOptions={{
            headerShown: false,
            animation: 'slide_from_right',
            animationDuration: 280,
            gestureEnabled: true,
            contentStyle: { backgroundColor: '#f8fafc' },
          }}
        >
          <Stack.Screen name="index" />
          <Stack.Screen name="(onboarding)" />
          <Stack.Screen name="(auth)" />
          <Stack.Screen name="(tabs)" />
          <Stack.Screen name="modals/loan-request" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/transaction-detail" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
          <Stack.Screen name="modals/security-alert" options={{ presentation: 'modal', animation: 'slide_from_bottom' }} />
        </Stack>
      </AppProviders>
    </GestureHandlerRootView>
  );
}

export default Sentry.wrap(RootLayout);
