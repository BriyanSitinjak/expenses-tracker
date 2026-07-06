import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

type StatBoxProps = {
  label: string;
  value: string;
  danger?: boolean;
  size?: 'sm' | 'lg';
};

// Compact metric tile used on dashboard and insights screens.
export function StatBox({ label, value, danger, size = 'sm' }: StatBoxProps) {
  const isLarge = size === 'lg';

  return (
    <View style={[styles.box, isLarge && styles.boxLg]}>
      <Text style={styles.label}>{label}</Text>
      <Text
        style={[
          isLarge ? styles.valueLg : styles.valueSm,
          danger && { color: colors.danger },
        ]}
      >
        {value}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  box: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    flex: 1,
    padding: spacing.sm,
  },
  boxLg: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderRadius: radius.lg,
    padding: spacing.md,
  },
  label: {
    color: colors.subText,
    fontSize: 11,
    fontWeight: '700',
  },
  valueSm: {
    color: colors.text,
    fontSize: 12,
    fontWeight: '800',
    marginTop: 2,
  },
  valueLg: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
    marginTop: 2,
  },
});
