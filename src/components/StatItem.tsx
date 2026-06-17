import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';

type StatItemProps = {
  label: string;
  value: string;
  tone?: 'default' | 'success' | 'danger';
};

// Reusable dashboard metric row component.
export function StatItem({ label, value, tone = 'default' }: StatItemProps) {
  const valueColor =
    tone === 'success' ? colors.success : tone === 'danger' ? colors.danger : colors.text;

  return (
    <View style={styles.row}>
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, { color: valueColor }]}>{value}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: spacing.sm,
  },
  label: {
    color: colors.subText,
    fontSize: 15,
  },
  value: {
    fontSize: 16,
    fontWeight: '700',
  },
});
