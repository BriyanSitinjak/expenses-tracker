import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors } from '../constants/theme';
import { CategoryBar } from './CategoryBar';

type CategoryBreakdownListProps = {
  items: [string, number][];
  total: number;
  emptyText: string;
  /** When set, only the top N categories are shown. */
  limit?: number;
  onPressCategory?: (name: string) => void;
};

// Shared category spend bars used on Dashboard (top N) and Stats (full list).
export function CategoryBreakdownList({
  items,
  total,
  emptyText,
  limit,
  onPressCategory,
}: CategoryBreakdownListProps) {
  const visible = limit != null ? items.slice(0, limit) : items;
  const max = items[0]?.[1] ?? 0;

  if (visible.length === 0) {
    return <Text style={styles.empty}>{emptyText}</Text>;
  }

  return (
    <View>
      {visible.map(([name, amount]) => (
        <CategoryBar
          key={name}
          name={name}
          amount={amount}
          max={max}
          total={total}
          onPress={onPressCategory ? () => onPressCategory(name) : undefined}
        />
      ))}
    </View>
  );
}

const styles = StyleSheet.create({
  empty: {
    color: colors.subText,
  },
});
