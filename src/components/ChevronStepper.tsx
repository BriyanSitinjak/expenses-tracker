import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { Icon } from './Icon';

type ChevronStepperProps = {
  label: string;
  hint?: string;
  onPrevious: () => void;
  onNext: () => void;
  canGoPrevious?: boolean;
  canGoNext?: boolean;
  size?: 'sm' | 'md';
  style?: ViewStyle;
};

// Shared previous/next control used for month and day pickers.
export function ChevronStepper({
  label,
  hint,
  onPrevious,
  onNext,
  canGoPrevious = true,
  canGoNext = true,
  size = 'md',
  style,
}: ChevronStepperProps) {
  const compact = size === 'sm';

  return (
    <View style={[styles.row, compact && styles.rowCompact, style]}>
      <Pressable
        onPress={onPrevious}
        disabled={!canGoPrevious}
        hitSlop={8}
        style={({ pressed }) => [
          styles.arrow,
          compact && styles.arrowCompact,
          !canGoPrevious && styles.arrowDisabled,
          pressed && canGoPrevious && styles.arrowPressed,
        ]}
        accessibilityLabel="Previous"
      >
        <Icon
          name="chevron-back"
          size={compact ? 18 : 20}
          color={canGoPrevious ? colors.text : colors.muted}
        />
      </Pressable>

      <View style={styles.center}>
        <Text style={[styles.label, compact && styles.labelCompact]}>{label}</Text>
        {hint ? <Text style={styles.hint}>{hint}</Text> : null}
      </View>

      <Pressable
        onPress={onNext}
        disabled={!canGoNext}
        hitSlop={8}
        style={({ pressed }) => [
          styles.arrow,
          compact && styles.arrowCompact,
          !canGoNext && styles.arrowDisabled,
          pressed && canGoNext && styles.arrowPressed,
        ]}
        accessibilityLabel="Next"
      >
        <Icon
          name="chevron-forward"
          size={compact ? 18 : 20}
          color={canGoNext ? colors.text : colors.muted}
        />
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
  rowCompact: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.sm,
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
  arrowCompact: {
    backgroundColor: 'transparent',
    borderWidth: 0,
  },
  arrowPressed: {
    backgroundColor: colors.cardAlt,
  },
  arrowDisabled: {
    opacity: 0.4,
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
  labelCompact: {
    fontSize: 16,
  },
  hint: {
    color: colors.warning,
    fontSize: 11,
    fontWeight: '700',
    marginTop: 2,
  },
});
