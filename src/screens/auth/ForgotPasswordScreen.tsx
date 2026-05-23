import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { FormalioLogo } from '@/components/common/Logo';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/Input';

function isEmailOrPhone(value: string) {
  const trimmed = value.trim();
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(trimmed) || trimmed.replace(/\D/g, '').length >= 9;
}

export default function ForgotPasswordScreen() {
  const [identifier, setIdentifier] = useState('');
  const [error, setError] = useState('');
  const submit = () => {
    if (!isEmailOrPhone(identifier)) {
      setError('Entrez un email valide ou un numéro de téléphone.');
      return;
    }
    router.push({ pathname: '/(auth)/otp', params: { phone: identifier, mode: 'reset' } });
  };

  return (
    <Screen>
      <View className="gap-6 pt-10">
        <FormalioLogo size={54} />
        <View>
          <Text className="text-3xl font-black text-navy">Récupérer l'accès</Text>
          <Text className="mt-2 text-base text-surface-500">Recevez un code par email ou SMS.</Text>
        </View>
        <TextField
          label="Email ou téléphone"
          value={identifier}
          onChangeText={(value) => {
            setIdentifier(value);
            setError('');
          }}
          autoCapitalize="none"
          keyboardType="email-address"
          placeholder="marie@boutique.cm ou 6XX XXX XXX"
          error={error}
        />
        <Button title="Envoyer le code" onPress={submit} />
        <Button title="Retour connexion" variant="secondary" onPress={() => router.back()} />
      </View>
    </Screen>
  );
}
