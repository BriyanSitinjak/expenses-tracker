import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { getMonthLabel, isCurrentMonth } from '../utils/date';
import { Icon } from './Icon';

type MonthSwitcherProps = {
  monthKey: string;
  transactionCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToCurrent: () => void;
  canGoNext: boolean;
};

// Compact period control: month label + chevrons, still easy to scan.
export function MonthSwitcher({
  monthKey,
  transactionCount,
  onPrevious,
  onNext,
  onGoToCurrent,
  canGoNext,
}: MonthSwitcherProps) {
  const viewingCurrentMonth = isCurrentMonth(monthKey);

  return (
    <View style={styles.wrap}>
      <View style={styles.row}>
        <Pressable
          onPress={onPrevious}
          hitSlop={10}
          style={({ pressed }) => [styles.arrowBtn, pressed && styles.arrowPressed]}
          accessibilityLabel="Previous month"
        >
          <Icon name="chevron-back" size={20} color={colors.text} />
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.month}>{getMonthLabel(monthKey)}</Text>
          <Text style={styles.meta}>
            {viewingCurrentMonth ? 'This month' : 'Past period'}
            {' · '}
            {transactionCount} txn{transactionCount === 1 ? '' : 's'}
          </Text>
        </View>

        <Pressable
          onPress={onNext}
          disabled={!canGoNext}
          hitSlop={10}
          style={({ pressed }) => [
            styles.arrowBtn,
            !canGoNext && styles.arrowDisabled,
            pressed && canGoNext && styles.arrowPressed,
          ]}
          accessibilityLabel="Next month"
        >
          <Icon
            name="chevron-forward"
            size={20}
            color={canGoNext ? colors.text : colors.muted}
          />
        </Pressable>
      </View>

      {!viewingCurrentMonth ? (
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
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  arrowBtn: {
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
    opacity: 0.4,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  month: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
    textAlign: 'center',
  },
  meta: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 2,
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
