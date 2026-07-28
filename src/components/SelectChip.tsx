import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, withAlpha } from '../constants/theme';

type SelectChipProps = {
  label: string;
  color: string;
  active: boolean;
  onPress: () => void;
};

// Color-dot pill used for category / sub-category pickers.
export function SelectChip({ label, color, active, onPress }: SelectChipProps) {
  return (
    <Pressable
      onPress={onPress}
      style={[
        styles.chip,
        active && {
          backgroundColor: withAlpha(color, 0.13),
          borderColor: color,
        },
      ]}
    >
      <View style={[styles.dot, { backgroundColor: color }]} />
      <Text style={[styles.text, active && { color, fontWeight: '800' }]}>{label}</Text>
    </Pressable>
  );
}

type AddChipProps = {
  label: string;
  onPress: () => void;
};

// Dashed “+ New / Cancel” action next to selectable chips.
export function AddChip({ label, onPress }: AddChipProps) {
  return (
    <Pressable onPress={onPress} style={styles.addChip}>
      <Text style={styles.addChipText}>{label}</Text>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  dot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  text: {
    color: colors.text,
  },
  addChip: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addChipText: {
    color: colors.primary,
    fontWeight: '800',
  },
});
