import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { getMonthLabel, isCurrentMonth } from '../utils/date';

type MonthSwitcherProps = {
  monthKey: string;
  transactionCount: number;
  onPrevious: () => void;
  onNext: () => void;
  onGoToCurrent: () => void;
  canGoNext: boolean;
};

// Clear month navigation so users know which period they are viewing.
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
    <View style={[styles.wrap, !viewingCurrentMonth && styles.wrapHighlighted]}>
      <Text style={styles.caption}>Viewing period</Text>

      <View style={styles.row}>
        <Pressable
          onPress={onPrevious}
          hitSlop={10}
          style={({ pressed }) => [styles.arrowBtn, pressed && styles.arrowPressed]}
          accessibilityLabel="Previous month"
        >
          <Text style={styles.arrow}>‹</Text>
        </Pressable>

        <View style={styles.center}>
          <Text style={styles.month}>{getMonthLabel(monthKey)}</Text>
          <Text style={styles.meta}>
            {transactionCount} transaction{transactionCount === 1 ? '' : 's'} in this period
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
          <Text style={[styles.arrow, !canGoNext && styles.arrowTextDisabled]}>›</Text>
        </Pressable>
      </View>

      {viewingCurrentMonth ? (
        <View style={styles.badge}>
          <Text style={styles.badgeText}>This month</Text>
        </View>
      ) : (
        <Pressable
          onPress={onGoToCurrent}
          style={({ pressed }) => [styles.todayBtn, pressed && styles.todayPressed]}
        >
          <Text style={styles.todayText}>Go to current month</Text>
        </Pressable>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  wrap: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    marginBottom: spacing.lg,
    padding: spacing.md,
  },
  wrapHighlighted: {
    borderColor: colors.accent,
  },
  caption: {
    color: colors.subText,
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 0.4,
    marginBottom: spacing.sm,
    textTransform: 'uppercase',
  },
  row: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
  },
  arrowBtn: {
    alignItems: 'center',
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  arrowPressed: {
    backgroundColor: colors.cardAlt,
  },
  arrowDisabled: {
    opacity: 0.35,
  },
  arrow: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '300',
    lineHeight: 30,
  },
  arrowTextDisabled: {
    color: colors.muted,
  },
  center: {
    flex: 1,
    alignItems: 'center',
  },
  month: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '800',
    textAlign: 'center',
  },
  meta: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 2,
    textAlign: 'center',
  },
  badge: {
    alignSelf: 'center',
    backgroundColor: colors.primary + '22',
    borderRadius: radius.pill,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  badgeText: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
  },
  todayBtn: {
    alignSelf: 'center',
    backgroundColor: colors.accent + '18',
    borderColor: colors.accent,
    borderRadius: radius.pill,
    borderWidth: 1,
    marginTop: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  todayPressed: {
    opacity: 0.8,
  },
  todayText: {
    color: colors.accent,
    fontSize: 12,
    fontWeight: '800',
  },
});
