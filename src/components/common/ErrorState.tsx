import { Text, View } from 'react-native';

export function ErrorState({ message }: { message?: string }) {
  if (!message) return null;
  return (
    <View className="rounded-2xl bg-danger/10 p-4">
      <Text className="text-sm font-semibold text-danger">{message}</Text>
    </View>
  );
}
