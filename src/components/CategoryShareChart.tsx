import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colorForCategory, colors, radius, spacing } from '../constants/theme';
import { formatCurrency } from '../utils/format';

type CategoryShareChartProps = {
  items: [string, number][];
  total: number;
};

// Stacked share bar for all-time spending mix by category.
export function CategoryShareChart({ items, total }: CategoryShareChartProps) {
  if (items.length === 0 || total <= 0) {
    return <Text style={styles.empty}>No spending data yet.</Text>;
  }

  return (
    <View style={styles.wrap}>
      <View style={styles.header}>
        <Text style={styles.label}>Total spent</Text>
        <Text style={styles.total}>{formatCurrency(total)}</Text>
      </View>

      <View style={styles.bar}>
        {items.map(([name, amount]) => {
          const flex = Math.max(amount / total, 0.02);
          return (
            <View
              key={name}
              style={[styles.segment, { flex, backgroundColor: colorForCategory(name) }]}
            />
          );
        })}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    gap: spacing.md,
  },
  header: {
    gap: 2,
  },
  label: {
    color: colors.subText,
    fontSize: 13,
    fontWeight: '600',
  },
  total: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
  },
  bar: {
    backgroundColor: colors.track,
    borderRadius: radius.pill,
    flexDirection: 'row',
    height: 18,
    overflow: 'hidden',
  },
  segment: {
    height: '100%',
  },
  empty: {
    color: colors.subText,
  },
});
