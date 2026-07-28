import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { getMonthLabel, monthRelation } from '../utils/date';
import { ChevronStepper } from './ChevronStepper';

type MonthSwitcherProps = {
  monthKey: string;
  transactionCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToCurrent: () => void;
};

// Compact period control: month label + chevrons, still easy to scan.
export function MonthSwitcher({
  monthKey,
  transactionCount,
  onPrevious,
  onNext,
  onGoToCurrent,
}: MonthSwitcherProps) {
  const relation = monthRelation(monthKey);
  const periodMeta =
    relation === 'current' ? 'This month' : relation === 'future' ? 'Upcoming' : 'Past period';

  return (
    <View style={styles.wrap}>
      <ChevronStepper
        label={getMonthLabel(monthKey)}
        onPrevious={onPrevious}
        onNext={onNext}
      />
      <Text style={styles.meta}>
        {periodMeta}
        {' · '}
        {transactionCount} txn{transactionCount === 1 ? '' : 's'}
      </Text>

      {relation !== 'current' ? (
        <Pressable
          onPress={onGoToCurrent}
          hitSlop={8}
          style={({ pressed }) => [styles.todayLink, pressed && styles.todayPressed]}
        >
          <Text style={styles.todayText}>Back to current month</Text>
        </Pressable>
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    marginBottom: spacing.md,
  },
  meta: {
    color: colors.subText,
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
  todayLink: {
    alignSelf: 'center',
    marginTop: spacing.sm,
    paddingVertical: 2,
  },
  todayPressed: {
    opacity: 0.7,
  },
  todayText: {
    color: colors.primary,
    fontSize: 13,
    fontWeight: '700',
  },
});
