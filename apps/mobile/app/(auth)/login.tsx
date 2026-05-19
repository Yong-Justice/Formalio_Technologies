import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import * as LocalAuthentication from 'expo-local-authentication';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/layout/Screen';
import { FormalioLogo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { loginSchema, LoginForm } from '@/features/auth/schemas/auth.schemas';
import { useAuthStore } from '@/features/auth/state/auth.store';
import { analytics } from '@/services/analytics/analytics.service';

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const [biometricLoading, setBiometricLoading] = useState(false);
  const [biometricError, setBiometricError] = useState('');
  const { control, handleSubmit, formState } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' } });
  const onSubmit = async (values: LoginForm) => {
    const identifier = values.identifier.trim();
    const normalized = identifier.includes('@') ? identifier.toLowerCase() : identifier.replace(/\D/g, '');
    // Replace demo session with authService.login(values) when backend is connected.
    await setSession({
      user: { id: 'demo-user', phone: identifier.includes('@') ? '' : normalized, email: identifier.includes('@') ? normalized : undefined, fullName: 'Marie Nkono', language: 'fr', onboardingCompleted: true, biometricEnabled: false },
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token'
    });
    analytics.track('login_completed', { method: 'password' });
    router.replace('/(tabs)/home');
  };
  const biometricLogin = async () => {
    setBiometricError('');
    setBiometricLoading(true);
    try {
      const hasHardware = await LocalAuthentication.hasHardwareAsync();
      const enrolled = hasHardware ? await LocalAuthentication.isEnrolledAsync() : false;
      if (!hasHardware || !enrolled) {
        setBiometricError('Aucune biométrie enregistrée sur cet appareil.');
        return;
      }
      const result = await LocalAuthentication.authenticateAsync({
        promptMessage: 'Connexion sécurisée Formalio',
        fallbackLabel: 'Code appareil',
        cancelLabel: 'Annuler',
        disableDeviceFallback: false,
      });
      if (!result.success) {
        setBiometricError('Vérification biométrique échouée.');
        return;
      }
      await setSession({
        user: { id: 'demo-user', phone: '', fullName: 'Marie Nkono', language: 'fr', onboardingCompleted: true, biometricEnabled: true },
        accessToken: 'demo-access-token',
        refreshToken: 'demo-refresh-token',
      });
      analytics.track('login_completed', { method: 'biometric' });
      router.replace('/(tabs)/home');
    } finally {
      setBiometricLoading(false);
    }
  };
  return (
    <Screen>
      <View className="gap-6 pt-10">
        <FormalioLogo size={54} />
        <View>
          <Text className="text-3xl font-black text-navy">Bon retour</Text>
          <Text className="mt-2 text-base text-surface-500">Connectez-vous à Formalio.</Text>
        </View>
        <Controller control={control} name="identifier" render={({ field, fieldState }) => <TextField label="Téléphone ou email" value={field.value} onChangeText={field.onChange} autoCapitalize="none" keyboardType="email-address" error={fieldState.error?.message} />} />
        <Controller control={control} name="password" render={({ field, fieldState }) => <TextField label="Mot de passe" value={field.value} onChangeText={field.onChange} secureTextEntry error={fieldState.error?.message} />} />
        <Text className="text-sm font-bold text-teal" onPress={() => router.push('/(auth)/forgot-password')}>Mot de passe oublié ?</Text>
        <Button title="Se connecter" loading={formState.isSubmitting} onPress={handleSubmit(onSubmit)} />
        {biometricError ? <Text className="text-sm font-semibold text-danger">{biometricError}</Text> : null}
        <Button title="Connexion biométrique" variant="secondary" loading={biometricLoading} onPress={biometricLogin} />
        <Button title="Créer un compte" variant="secondary" onPress={() => router.push('/(auth)/register')} />
      </View>
    </Screen>
  );
}
