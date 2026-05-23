import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Profil</Text>
        <Card title="Marie Nkono"><Text className="text-surface-600">Boutique Élégance · Plan Growth</Text></Card>
        <Card title="Sécurité"><Text className="text-surface-600">Biométrie, mot de passe, sessions.</Text></Card>
        <Card title="Abonnement"><Text className="text-surface-600">Factures, paiements NotchPay, upgrade.</Text></Card>
        <Button title="Déconnexion" variant="danger" onPress={async () => { await logout(); router.replace('/(auth)/login'); }} />
      </View>
    </Screen>
  );
}