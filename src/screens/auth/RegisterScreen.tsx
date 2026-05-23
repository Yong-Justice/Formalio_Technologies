import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { Screen } from '@/components/common/Screen';
import { FormalioLogo } from '@/components/common/Logo';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/Input';
import { registerSchema, RegisterForm } from '@/utils/validators';

export default function RegisterScreen() {
  const { control, handleSubmit, formState } = useForm<RegisterForm>({ resolver: zodResolver(registerSchema), defaultValues: { fullName: '', phone: '', email: '', password: '', referralCode: '' } });
  const onSubmit = async (values: RegisterForm) => {
    // Replace with authService.register(values) when backend is connected.
    router.push({ pathname: '/(auth)/otp', params: { phone: values.phone, mode: 'register' } });
  };
  return (
    <Screen>
      <View className="gap-5 pt-6">
        <FormalioLogo size={48} />
        <View>
          <Text className="text-3xl font-black text-navy">Créer un compte</Text>
          <Text className="mt-2 text-base text-surface-500">Commencez gratuitement avec votre numéro.</Text>
        </View>
        <Controller control={control} name="fullName" render={({ field, fieldState }) => <TextField label="Nom complet" value={field.value} onChangeText={field.onChange} error={fieldState.error?.message} />} />
        <Controller control={control} name="phone" render={({ field, fieldState }) => <TextField label="Téléphone" value={field.value} onChangeText={field.onChange} keyboardType="phone-pad" error={fieldState.error?.message} />} />
        <Controller control={control} name="email" render={({ field, fieldState }) => <TextField label="Email (optionnel)" value={field.value} onChangeText={field.onChange} keyboardType="email-address" autoCapitalize="none" error={fieldState.error?.message} />} />
        <Controller control={control} name="password" render={({ field, fieldState }) => <TextField label="Mot de passe" value={field.value} onChangeText={field.onChange} secureTextEntry error={fieldState.error?.message} />} />
        <Controller control={control} name="referralCode" render={({ field }) => <TextField label="Code parrainage (optionnel)" value={field.value} onChangeText={field.onChange} />} />
        <Button title="Continuer" loading={formState.isSubmitting} onPress={handleSubmit(onSubmit)} />
      </View>
    </Screen>
  );
}