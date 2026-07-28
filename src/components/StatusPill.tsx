import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, withAlpha } from '../constants/theme';

type StatusPillProps = {
  label: string;
  color: string;
};

// Compact status chip with a solid dot + tinted background.
export function StatusPill({ label, color }: StatusPillProps) {
  return (
    <View style={[styles.pill, { backgroundColor: withAlpha(color, 0.12) }]}>
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, { color }]}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  pill: {
    alignItems: 'center',
    borderRadius: radius.pill,
    flexDirection: 'row',
    gap: 6,
    paddingHorizontal: spacing.sm,
    paddingVertical: 6,
  },
  dot: {
    borderRadius: 4,
    height: 8,
    width: 8,
  },
  text: {
    fontSize: 12,
    fontWeight: '800',
  },
});
