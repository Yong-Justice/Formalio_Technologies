import React from 'react';
import { View } from 'react-native';

export function MiniBarChart({ values, color = '#28A745' }: { values: number[]; color?: string }) {
  const max = Math.max(...values, 1);
  return (
    <View className="h-20 flex-row items-end gap-1">
      {values.map((value, index) => (
        <View
          key={`${value}-${index}`}
          className="flex-1 rounded-t-lg"
          style={{ height: `${Math.max(10, (value / max) * 100)}%`, backgroundColor: color }}
        />
      ))}
    </View>
  );
}