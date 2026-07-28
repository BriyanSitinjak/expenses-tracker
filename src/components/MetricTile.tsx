import React from 'react';
import { StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, spacing, surface } from '../constants/theme';
import { IconName } from './Icon';
import { IconTile } from './IconTile';

type MetricTileProps = {
  icon: IconName;
  label: string;
  value: string;
  tone?: string;
  style?: ViewStyle;
};

// Compact non-pressable metric card (icon + value + label).
export function MetricTile({
  icon,
  label,
  value,
  tone = colors.primary,
  style,
}: MetricTileProps) {
  return (
    <View style={[styles.tile, style]}>
      <IconTile name={icon} color={tone} size="sm" />
      <Text style={styles.value}>{value}</Text>
      <Text style={styles.label}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  tile: {
    flex: 1,
    alignItems: 'flex-start',
    gap: spacing.sm,
    padding: spacing.md,
    ...surface('sm'),
  },
  value: {
    color: colors.text,
    fontSize: 20,
    fontWeight: '800',
  },
  label: {
    color: colors.subText,
    fontSize: 12,
    marginTop: -4,
  },
});
