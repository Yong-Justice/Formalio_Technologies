import React from 'react';
import { Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/layout/Screen';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { useAuthStore } from '@/features/auth/state/auth.store';

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Profil</Text>
        <Card title="Marie Nkono"><Text className="text-surface-600">Boutique Elegance · Plan Growth</Text></Card>
        <Card title="Sécurité"><Text className="text-surface-600">Biométrie, mot de passe, sessions.</Text></Card>
        <Card title="Abonnement"><Text className="text-surface-600">Factures, paiements NotchPay, upgrade.</Text></Card>
        <Button title="Déconnexion" variant="danger" onPress={async () => { await logout(); router.replace('/(auth)/login'); }} />
      </View>
    </Screen>
  );
}