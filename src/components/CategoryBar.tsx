import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colorForCategory, ThemeColors, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { formatCurrency } from '../utils/format';
import { Icon } from './Icon';
import { ProgressBar } from './ProgressBar';

type CategoryBarProps = {
  name: string;
  amount: number;
  max: number;
  total?: number; // when provided, shows a percentage next to the amount
  onPress?: () => void;
};

// A single category row: color dot, name, amount (+ optional %) and a bar.
export function CategoryBar({ name, amount, max, total, onPress }: CategoryBarProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const color = colorForCategory(name);
  const percent = total && total > 0 ? Math.round((amount / total) * 100) : null;

  const body = (
    <>
      <View style={styles.top}>
        <View style={styles.labelWrap}>
          <View style={[styles.dot, { backgroundColor: color }]} />
          <Text style={styles.name}>{name}</Text>
        </View>
        <View style={styles.amountWrap}>
          <Text style={styles.amount}>
            {formatCurrency(amount)}
            {percent !== null ? <Text style={styles.pct}>{`  ${percent}%`}</Text> : null}
          </Text>
          {onPress ? <Icon name="chevron-forward" size={16} color={colors.muted} /> : null}
        </View>
      </View>
      <ProgressBar progress={max > 0 ? amount / max : 0} color={color} height={6} />
    </>
  );

  if (onPress) {
    return (
      <Pressable
        onPress={onPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed]}
        accessibilityRole="button"
        accessibilityLabel={`View ${name} expenses`}
      >
        {body}
      </Pressable>
    );
  }

  return <View style={styles.row}>{body}</View>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      marginBottom: spacing.md,
    },
    pressed: {
      opacity: 0.72,
    },
    top: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
      gap: spacing.sm,
    },
    labelWrap: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      flex: 1,
      minWidth: 0,
    },
    amountWrap: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: 4,
    },
    dot: {
      width: 10,
      height: 10,
      borderRadius: 5,
    },
    name: {
      color: colors.text,
      fontWeight: '600',
      flexShrink: 1,
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
}
