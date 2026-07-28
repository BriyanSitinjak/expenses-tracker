import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedCard } from '../components/AnimatedCard';
import { CategoryBar } from '../components/CategoryBar';
import { IconTile } from '../components/IconTile';
import { MetricTile } from '../components/MetricTile';
import { ProgressBar } from '../components/ProgressBar';
import { SectionTitle } from '../components/SectionTitle';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { onlyExpenses, sumByCategory, sumByMethod, trackingStats } from '../utils/analytics';
import { formatCurrency } from '../utils/format';

type StatsScreenProps = NativeStackScreenProps<RootStackParamList, 'Stats'>;

// Lightweight all-time stats: totals, payment split, and full category breakdown.
export function StatsScreen(_: StatsScreenProps) {
  const { expenses, cashOnHand } = useBudgetStore();

  const onlyExpenseRows = useMemo(() => onlyExpenses(expenses), [expenses]);
  const tracking = useMemo(() => trackingStats(expenses), [expenses]);
  const byCategory = useMemo(() => sumByCategory(onlyExpenseRows), [onlyExpenseRows]);
  const byMethod = useMemo(() => sumByMethod(expenses), [expenses]);

  const cash = cashOnHand();
  const methodTotal = byMethod.cash + byMethod.debit;
  const total = byCategory.reduce((sum, [, amount]) => sum + amount, 0);
  const maxCategory = byCategory.length > 0 ? byCategory[0][1] : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <View style={styles.statRow}>
        <MetricTile
          icon="receipt"
          label="Transactions"
          value={String(expenses.length)}
          tone={colors.primary}
        />
        <MetricTile
          icon="calendar"
          label="Days tracked"
          value={String(tracking.daysTracked)}
          tone={colors.accent}
        />
        <MetricTile
          icon="flame"
          label="Streak"
          value={`${tracking.streak}d`}
          tone={colors.warning}
        />
      </View>

      <SectionTitle>Cash & payments</SectionTitle>
      <AnimatedCard index={0} style={styles.block}>
        <View style={styles.cashRow}>
          <View>
            <Text style={styles.cashLabel}>Cash on hand</Text>
            <Text style={[styles.cashValue, cash < 0 && styles.cashDanger]}>
              {formatCurrency(cash)}
            </Text>
          </View>
          <IconTile name="wallet" color={colors.success} size="lg" />
        </View>

        <View style={styles.methodMeta}>
          <Text style={styles.metaLine}>
            Cash spent <Text style={styles.metaStrong}>{formatCurrency(byMethod.cash)}</Text>
          </Text>
          <Text style={styles.metaLine}>
            Debit spent <Text style={styles.metaStrong}>{formatCurrency(byMethod.debit)}</Text>
          </Text>
        </View>
        <ProgressBar
          progress={methodTotal > 0 ? byMethod.cash / methodTotal : 0}
          color={colors.accent}
          height={8}
        />
        <Text style={styles.progressHint}>
          {methodTotal > 0
            ? `${Math.round((byMethod.cash / methodTotal) * 100)}% of spending was cash`
            : 'No spending yet'}
        </Text>
      </AnimatedCard>

      <SectionTitle>Spending by category</SectionTitle>
      <AnimatedCard index={1} style={styles.block}>
        {byCategory.length === 0 ? (
          <Text style={styles.empty}>No spending data yet.</Text>
        ) : (
          byCategory.map(([name, amount]) => (
            <CategoryBar key={name} name={name} amount={amount} max={maxCategory} total={total} />
          ))
        )}
      </AnimatedCard>

      <Text style={styles.footnote}>All-time totals · export lives on the dashboard</Text>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  statRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  block: {
    marginBottom: spacing.lg,
  },
  cashRow: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  cashLabel: {
    color: colors.subText,
    fontSize: 13,
    fontWeight: '600',
  },
  cashValue: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    marginTop: 2,
  },
  cashDanger: {
    color: colors.danger,
  },
  methodMeta: {
    gap: 4,
    marginBottom: spacing.sm,
  },
  metaLine: {
    color: colors.subText,
    fontSize: 13,
  },
  metaStrong: {
    color: colors.text,
    fontWeight: '700',
  },
  progressHint: {
    color: colors.muted,
    fontSize: 12,
    marginTop: spacing.sm,
  },
  empty: {
    color: colors.subText,
  },
  footnote: {
    color: colors.muted,
    fontSize: 12,
    textAlign: 'center',
  },
});
