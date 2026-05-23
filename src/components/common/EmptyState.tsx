import { Text, View } from 'react-native';

export function EmptyState({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View className="items-center p-4">
      <Text className="text-center text-sm text-surface-500">{message}</Text>
    </View>
  );
}
