import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/layout/Screen';
import { FormalioLogo } from '@/components/brand/Logo';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { loginSchema, LoginForm } from '@/features/auth/schemas/auth.schemas';
import { useAuthStore } from '@/features/auth/state/auth.store';

export default function LoginScreen() {
  const setSession = useAuthStore((s) => s.setSession);
  const { control, handleSubmit, formState } = useForm<LoginForm>({ resolver: zodResolver(loginSchema), defaultValues: { identifier: '', password: '' } });
  const onSubmit = async (values: LoginForm) => {
    // Replace demo session with authService.login(values) when backend is connected.
    await setSession({
      user: { id: 'demo-user', phone: values.identifier, fullName: 'Marie Nkono', language: 'fr', onboardingCompleted: true, biometricEnabled: false },
      accessToken: 'demo-access-token',
      refreshToken: 'demo-refresh-token'
    });
    router.replace('/(tabs)/home');
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
        <Button title="Se connecter" loading={formState.isSubmitting} onPress={handleSubmit(onSubmit)} />
        <Button title="Créer un compte" variant="secondary" onPress={() => router.push('/(auth)/register')} />
      </View>
    </Screen>
  );
}