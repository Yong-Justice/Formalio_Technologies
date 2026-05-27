import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { router } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { Card } from '@/components/common/Card';
import { Button } from '@/components/common/Button';
import { useAuthStore } from '@/store/authStore';
import { legalMenuItems } from '@/constants/legalDocuments';

export default function SettingsScreen() {
  const logout = useAuthStore((s) => s.logout);
  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Profil</Text>
        <Card title="Marie Nkono"><Text className="text-surface-600">Boutique Élégance · Plan Growth</Text></Card>
        <Card title="Sécurité"><Text className="text-surface-600">Biométrie, mot de passe, sessions.</Text></Card>
        <Card title="Abonnement"><Text className="text-surface-600">Factures, paiements NotchPay, upgrade.</Text></Card>
        <Card title="INFORMATIONS LÉGALES">
          <View>
            {legalMenuItems.map((item, index) => (
              <Pressable
                key={item.routeName}
                onPress={() => router.push(`/${item.routeName}` as never)}
                style={[styles.legalRow, index > 0 && styles.legalRowBorder]}
              >
                <Text style={styles.legalIcon}>{item.icon}</Text>
                <Text style={styles.legalTitle}>{item.title}</Text>
                <Text style={styles.legalArrow}>›</Text>
              </Pressable>
            ))}
          </View>
        </Card>
        <Button title="Déconnexion" variant="danger" onPress={async () => { await logout(); router.replace('/(auth)/login'); }} />
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  legalRow: {
    minHeight: 48,
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 10,
  },
  legalRowBorder: {
    borderTopWidth: 1,
    borderTopColor: '#E5E7EB',
  },
  legalIcon: {
    width: 30,
    fontSize: 18,
    marginRight: 10,
  },
  legalTitle: {
    flex: 1,
    color: '#374151',
    fontSize: 14,
    fontWeight: '600',
    lineHeight: 20,
  },
  legalArrow: {
    color: '#9CA3AF',
    fontSize: 24,
    marginLeft: 10,
  },
});
