import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { ThemeColors, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { Icon } from './Icon';

type ChevronStepperProps = {
  label: string;
  onPrevious: () => void;
  onNext: () => void;
  disabled?: boolean;
  style?: ViewStyle;
};

// Shared previous/next control (month switcher).
export function ChevronStepper({
  label,
  onPrevious,
  onNext,
  disabled = false,
  style,
}: ChevronStepperProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={[styles.row, style]}>
      <Pressable
        onPress={onPrevious}
        disabled={disabled}
        hitSlop={8}
        style={({ pressed }) => [
          styles.arrow,
          pressed && !disabled && styles.arrowPressed,
          disabled && styles.arrowDisabled,
        ]}
        accessibilityLabel="Previous"
      >
        <Icon name="chevron-back" size={20} color={disabled ? colors.muted : colors.text} />
      </Pressable>

      <View style={styles.center}>
        <Text style={styles.label}>{label}</Text>
      </View>

      <Pressable
        onPress={onNext}
        disabled={disabled}
        hitSlop={8}
        style={({ pressed }) => [
          styles.arrow,
          pressed && !disabled && styles.arrowPressed,
          disabled && styles.arrowDisabled,
        ]}
        accessibilityLabel="Next"
      >
        <Icon name="chevron-forward" size={20} color={disabled ? colors.muted : colors.text} />
      </Pressable>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
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
    arrowDisabled: {
      opacity: 0.45,
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
}
