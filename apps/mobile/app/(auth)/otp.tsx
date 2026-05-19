import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router, useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { OTPInput } from '@/components/ui/OTPInput';
import { useAuthStore } from '@/features/auth/state/auth.store';

export default function OtpScreen() {
  const params = useLocalSearchParams<{ phone?: string; mode?: string }>();
  const [otp, setOtp] = useState('');
  const setSession = useAuthStore((s) => s.setSession);
  const verify = async () => {
    if (otp.length !== 6) return;
    const isRegistration = params.mode === 'register';
    await setSession({
      user: { id: 'demo-user', phone: params.phone ?? '', fullName: 'Nouvel utilisateur', language: 'fr', onboardingCompleted: !isRegistration, biometricEnabled: false },
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token'
    });
    router.replace(isRegistration ? '/(auth)/business-setup' : '/(tabs)/home');
  };
  return (
    <Screen>
      <View className="gap-6 pt-12">
        <View>
          <Text className="text-3xl font-black text-navy">Code de vérification</Text>
          <Text className="mt-2 text-base text-surface-500">Envoyé au {params.phone ?? 'votre téléphone'}.</Text>
        </View>
        <OTPInput value={otp} onChange={setOtp} />
        <Button title="Vérifier" disabled={otp.length !== 6} onPress={verify} />
        <Button title="Remplir le code démo" variant="secondary" onPress={() => setOtp('123456')} />
      </View>
    </Screen>
  );
}