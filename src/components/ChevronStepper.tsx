import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { Icon } from './Icon';

type ChevronStepperProps = {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  style?: ViewStyle;
};

// Shared previous/next control (month switcher).
export function ChevronStepper({ label, onPrevious, onNext, style }: ChevronStepperProps) {
  return (
    <View style={[styles.row, style]}>
      <Pressable
        onPress={onPrevious}
        hitSlop={8}
        style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
        accessibilityLabel="Previous"
      >
        <Icon name="chevron-back" size={20} color={colors.text} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
      </View>

      <Pressable
        onPress={onNext}
        hitSlop={8}
        style={({ pressed }) => [styles.arrow, pressed && styles.arrowPressed]}
        accessibilityLabel="Next"
      >
        <Icon name="chevron-forward" size={20} color={colors.text} />
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  arrow: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 36,
    justifyContent: 'center',
    width: 36,
  },
  arrowPressed: {
    backgroundColor: colors.cardAlt,
  },
  center: {
    alignItems: 'center',
    flex: 1,
  },
  label: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
});
