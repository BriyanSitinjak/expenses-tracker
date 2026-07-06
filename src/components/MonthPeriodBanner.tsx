import React from 'react';
import { StyleSheet, Text } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

type MonthPeriodBannerProps = {
  message: string;
  variant?: 'hint' | 'callout';
};

// Reusable notice when the user is viewing or editing a non-current month.
export function MonthPeriodBanner({ message, variant = 'hint' }: MonthPeriodBannerProps) {
  return <Text style={variant === 'callout' ? styles.callout : styles.hint}>{message}</Text>;
}

const styles = StyleSheet.create({
  hint: {
    color: colors.accent,
    fontSize: 12,
    lineHeight: 17,
    marginBottom: spacing.md,
    marginTop: -spacing.sm,
  },
  callout: {
    backgroundColor: colors.accent + '14',
    borderColor: colors.accent,
    borderRadius: radius.md,
    borderWidth: 1,
    color: colors.accent,
    fontSize: 13,
    lineHeight: 18,
    marginBottom: spacing.md,
    padding: spacing.md,
  },
});
