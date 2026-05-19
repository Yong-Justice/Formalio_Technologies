import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Button } from '@/components/ui/Button';
import { TextField } from '@/components/ui/TextField';
import { useAuthStore } from '@/features/auth/state/auth.store';

export default function BusinessSetupScreen() {
  const [businessName, setBusinessName] = useState('');
  const [businessType, setBusinessType] = useState('Commerce');
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const finish = () => {
    if (user) setUser({ ...user, onboardingCompleted: true });
    router.replace('/(tabs)/home');
  };
  return (
    <Screen>
      <View className="gap-5 pt-6">
        <Text className="text-3xl font-black text-navy">Parlez-nous de votre entreprise</Text>
        <Text className="text-base text-surface-500">Cette étape apparaît uniquement lors de la création du compte.</Text>
        <TextField label="Nom de l'entreprise" value={businessName} onChangeText={setBusinessName} placeholder="Boutique Elegance" />
        <TextField label="Type d'activité" value={businessType} onChangeText={setBusinessType} />
        <Button title="Terminer la configuration" onPress={finish} />
      </View>
    </Screen>
  );
}