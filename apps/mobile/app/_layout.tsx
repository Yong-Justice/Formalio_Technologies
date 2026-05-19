import '../src/styles/global.css';
import 'react-native-reanimated';
import React, { useEffect } from 'react';
import { Stack } from 'expo-router';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import { AppProviders } from '@/app/providers/AppProviders';

void SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  useEffect(() => {
    const timer = setTimeout(() => void SplashScreen.hideAsync(), 700);
    return () => clearTimeout(timer);
  }, []);

  return (
    <AppProviders>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="index" />
        <Stack.Screen name="(onboarding)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="modals/loan-request" options={{ presentation: 'modal' }} />
      </Stack>
    </AppProviders>
  );
}