import React from 'react';
import { Text, View } from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Screen } from '@/components/common/Screen';
import { Card } from '@/components/common/Card';

export default function SecurityScreen() {
  const { alertId } = useLocalSearchParams<{ alertId?: string }>();

  return (
    <Screen>
      <View className="gap-4">
        <Text className="text-2xl font-black text-navy">Security alert</Text>
        <Card title="Review required">
          <Text className="text-surface-700">
            Formalio flagged unusual account or transaction activity. Review the alert before continuing high-risk actions.
          </Text>
          {alertId ? <Text className="mt-3 text-xs font-semibold text-surface-500">Alert ID: {alertId}</Text> : null}
        </Card>
      </View>
    </Screen>
  );
}
