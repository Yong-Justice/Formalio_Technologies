import React, { useState } from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { Button } from '@/components/common/Button';
import { TextField } from '@/components/common/Input';
import { useAuthStore } from '@/store/authStore';

export default function OnboardingScreen() {
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
        <TextField label="Nom de l'entreprise" value={businessName} onChangeText={setBusinessName} placeholder="Boutique Élégance" />
        <TextField label="Type d'activité" value={businessType} onChangeText={setBusinessType} />
        <Button title="Terminer la configuration" onPress={finish} />
      </View>
    </Screen>
  );
}
