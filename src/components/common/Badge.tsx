import { Text, View } from 'react-native';

export function Badge({ label }: { label?: string }) {
  if (!label) return null;
  return (
    <View className="rounded-full bg-surface-100 px-2 py-1">
      <Text className="text-xs font-bold text-surface-700">{label}</Text>
    </View>
  );
}
