import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colorForCategory, colors, spacing } from '../constants/theme';
import { formatCurrency } from '../utils/format';
import { ProgressBar } from './ProgressBar';

type CategoryBarProps = {
  name: string;
  amount: number;
  max: number;
  total?: number; // when provided, shows a percentage next to the amount
};

// A single category row: color dot, name, amount (+ optional %) and a bar.
export function CategoryBar({ name, amount, max, total }: CategoryBarProps) {
  const color = colorForCategory(name);
  const percent = total && total > 0 ? Math.round((amount / total) * 100) : null;

  return (
    <View style={styles.row}>
      <View style={styles.top}>
        <View style={styles.labelWrap}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.name}>{name}</Text>
        </View>
        <Text style={styles.amount}>
          {formatCurrency(amount)}
          {percent !== null ? <Text style={styles.pct}>{`  ${percent}%`}</Text> : null}
        </Text>
      </View>
      <ProgressBar progress={max > 0 ? amount / max : 0} color={color} height={6} />
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginBottom: spacing.md,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  labelWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  dot: {
    width: 10,
    height: 10,
    borderRadius: 5,
  },
  name: {
    color: colors.text,
    fontWeight: '600',
  },
  amount: {
    color: colors.text,
    fontWeight: '700',
  },
  pct: {
    color: colors.subText,
    fontWeight: '600',
    fontSize: 12,
  },
});
