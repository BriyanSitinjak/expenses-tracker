import React, { useMemo } from 'react';
import { StyleSheet, Text } from 'react-native';
import { ThemeColors, radius, spacing, withAlpha } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { getMonthLabel, monthRelation } from '../utils/date';

type MonthPeriodBannerProps = {
  monthKey: string;
  /** `view` = dashboard notice, `save` = add-expense callout */
  context?: 'view' | 'save';
};

function messageFor(monthKey: string, context: 'view' | 'save'): string | null {
  const relation = monthRelation(monthKey);
  if (relation === 'current') return null;

  const label = getMonthLabel(monthKey);

  if (context === 'save') {
    return relation === 'future'
      ? `Saving into upcoming ${label}.`
      : `Saving into ${label}.`;
  }

  return relation === 'future'
    ? `Planning ${label}. New entries are saved in this upcoming month.`
    : `Showing ${label} only. Cash on hand stays all-time.`;
}

// Notice when viewing or saving into a non-current month. Renders nothing for the current month.
export function MonthPeriodBanner({ monthKey, context = 'view' }: MonthPeriodBannerProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const message = messageFor(monthKey, context);
  if (!message) return null;

  return <Text style={context === 'save' ? styles.callout : styles.hint}>{message}</Text>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    hint: {
      color: colors.accent,
      fontSize: 12,
      lineHeight: 17,
      marginBottom: spacing.md,
      marginTop: -spacing.sm,
    },
    callout: {
      backgroundColor: withAlpha(colors.accent, 0.08),
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
}
