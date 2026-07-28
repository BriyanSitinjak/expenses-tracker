import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing, withAlpha } from '../constants/theme';
import { getMonthLabel, monthRelation } from '../utils/date';
import { ChevronStepper } from './ChevronStepper';

type MonthSwitcherProps = {
  monthKey: string;
  transactionCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToCurrent: () => void;
  disabled?: boolean;
};

// Compact period control: month label + chevrons, still easy to scan.
export function MonthSwitcher({
  monthKey,
  transactionCount,
  onPrevious,
  onNext,
  onGoToCurrent,
  disabled = false,
}: MonthSwitcherProps) {
  const relation = monthRelation(monthKey);
  const periodMeta =
    relation === 'current' ? 'This month' : relation === 'future' ? 'Upcoming' : 'Past period';

  return (
    <View style={[styles.wrap, disabled && styles.wrapDisabled]} pointerEvents={disabled ? 'none' : 'auto'}>
      <ChevronStepper
        label={getMonthLabel(monthKey)}
        onPrevious={onPrevious}
        onNext={onNext}
        disabled={disabled}
      />
      <View style={styles.metaRow}>
        <Text style={styles.meta}>
          {periodMeta}
          {' · '}
          {transactionCount} txn{transactionCount === 1 ? '' : 's'}
        </Text>

        {relation !== 'current' ? (
          <Pressable
            onPress={onGoToCurrent}
            disabled={disabled}
            hitSlop={8}
            style={({ pressed }) => [styles.todayBtn, pressed && styles.todayPressed]}
          >
            <Text style={styles.todayText}>Today</Text>
          </Pressable>
        ) : null}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  wrapDisabled: {
    opacity: 0.55,
  },
  metaRow: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
    justifyContent: 'center',
    marginTop: spacing.xs,
  },
  meta: {
    color: colors.subText,
    fontSize: 12,
    textAlign: 'center',
  },
  todayBtn: {
    backgroundColor: withAlpha(colors.primary, 0.12),
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 4,
  },
  todayPressed: {
    opacity: 0.7,
  },
  todayText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
});
