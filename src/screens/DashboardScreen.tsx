import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CategoryBar } from '../components/CategoryBar';
import { MonthPeriodBanner } from '../components/MonthPeriodBanner';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { ProgressBar } from '../components/ProgressBar';
import { SectionTitle } from '../components/SectionTitle';
import { StatBox } from '../components/StatBox';
import { TransactionRow } from '../components/TransactionRow';
import { colors, radius, shadow, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { budgetSnapshot, monthCashStats, sumByCategory } from '../utils/analytics';
import { getMonthKey, getMonthLabel, isCurrentMonth } from '../utils/date';
import { formatCurrency } from '../utils/format';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const ACTIONS = [
  { key: 'AddExpense', label: 'Add expense' },
  { key: 'Import', label: 'Import' },
  { key: 'Insights', label: 'Insights' },
] as const;

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const {
    monthlyBudget,
    selectedMonthKey,
    shiftSelectedMonth,
    goToCurrentMonth,
    expensesForMonth,
    transactionsForMonth,
    totalSpent,
    remaining,
    cashOnHand,
    deleteExpense,
  } = useBudgetStore();

  const [refreshing, setRefreshing] = useState(false);

  const viewingCurrentMonth = isCurrentMonth(selectedMonthKey);
  const canGoNext = selectedMonthKey < getMonthKey();

  const monthExpenses = expensesForMonth(selectedMonthKey);
  const monthTransactions = transactionsForMonth(selectedMonthKey);
  const spent = totalSpent(selectedMonthKey);
  const budgetRemaining = remaining(selectedMonthKey);
  const { overBudget, usage } = budgetSnapshot(spent, monthlyBudget);
  const cash = cashOnHand();
  const { withdrawn: withdrawnThisMonth, cashSpent: cashSpentThisMonth } =
    monthCashStats(monthTransactions);

  const byCategory = useMemo(() => sumByCategory(monthExpenses), [monthExpenses]);
  const maxCategory = byCategory.length > 0 ? byCategory[0][1] : 0;
  const periodLabel = viewingCurrentMonth ? 'this month' : getMonthLabel(selectedMonthKey);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await useBudgetStore.persist.rehydrate();
    } finally {
      setRefreshing(false);
    }
  }, []);

  function handleAction(key: (typeof ACTIONS)[number]['key']) {
    navigation.navigate(key);
  }

  function confirmDelete(id: string, label: string) {
    Alert.alert('Delete transaction', `Remove "${label}"?`, [
      { text: 'Cancel', style: 'cancel' },
      { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
    ]);
  }

  const header = (
    <View>
      <Text style={styles.greeting}>{greeting()} 👋</Text>

      <MonthSwitcher
        monthKey={selectedMonthKey}
        transactionCount={monthTransactions.length}
        onPrevious={() => shiftSelectedMonth(-1)}
        onNext={() => shiftSelectedMonth(1)}
        onGoToCurrent={goToCurrentMonth}
        canGoNext={canGoNext}
      />

      {!viewingCurrentMonth ? (
        <MonthPeriodBanner
          message={`Showing data for ${getMonthLabel(selectedMonthKey)} only. Cash on hand stays all-time.`}
        />
      ) : null}

      <AnimatedCard index={0} style={styles.heroCard}>
        <Text style={styles.heroLabel}>
          {overBudget ? `Over budget in ${periodLabel}` : `Remaining in ${periodLabel}`}
        </Text>
        <AnimatedNumber
          value={Math.abs(budgetRemaining)}
          format={(v) => formatCurrency(v)}
          adjustsFontSizeToFit
          numberOfLines={1}
          style={[styles.heroAmount, { color: overBudget ? colors.danger : colors.success }]}
        />
        <View style={styles.heroProgress}>
          <ProgressBar
            progress={usage}
            color={overBudget ? colors.danger : usage > 0.8 ? colors.warning : colors.primary}
            height={14}
          />
        </View>
        <View style={styles.heroRow}>
          <Text style={styles.heroMeta}>
            Spent <Text style={styles.heroMetaStrong}>{formatCurrency(spent)}</Text>
          </Text>
          <Pressable onPress={() => navigation.navigate('BudgetSetup')} hitSlop={8}>
            <Text style={styles.heroMeta}>
              Budget{' '}
              <Text style={[styles.heroMetaStrong, styles.budgetLink]}>
                {monthlyBudget > 0 ? formatCurrency(monthlyBudget) : 'not set — tap to add'}
              </Text>
            </Text>
          </Pressable>
        </View>
        <View style={styles.heroStats}>
          <StatBox label="Cash (all-time)" value={formatCurrency(cash)} danger={cash < 0} />
          <StatBox label="Withdrawn" value={formatCurrency(withdrawnThisMonth)} />
          <StatBox label="Cash spent" value={formatCurrency(cashSpentThisMonth)} />
        </View>
        {cash < 0 ? (
          <Text style={styles.cashWarn}>Cash spending is higher than recorded withdrawals.</Text>
        ) : null}
      </AnimatedCard>

      <View style={styles.actions}>
        {ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => handleAction(action.key)}
            style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
          >
            <Text style={styles.actionLabel}>{action.label}</Text>
          </Pressable>
        ))}
      </View>

      <AnimatedCard index={1} style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle style={styles.sectionTitleInline}>Top Categories</SectionTitle>
          <Pressable onPress={() => navigation.navigate('Insights')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {byCategory.length === 0 ? (
          <Text style={styles.empty}>No spending in {getMonthLabel(selectedMonthKey)}.</Text>
        ) : (
          byCategory
            .slice(0, 4)
            .map(([name, amount]) => (
              <CategoryBar key={name} name={name} amount={amount} max={maxCategory} />
            ))
        )}
      </AnimatedCard>

      <SectionTitle>Transactions in {getMonthLabel(selectedMonthKey)}</SectionTitle>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={monthTransactions}
        keyExtractor={(item) => item.id}
        ListHeaderComponent={header}
        contentContainerStyle={styles.listContent}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            tintColor={colors.accent}
            colors={[colors.accent]}
            title="Pull to refresh"
            titleColor={colors.subText}
          />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyTitle}>No transactions in this period</Text>
            <Text style={styles.emptyText}>
              {viewingCurrentMonth
                ? 'Import your bank statement or add an expense to get started.'
                : `Nothing recorded for ${getMonthLabel(selectedMonthKey)}. Try another month or add an expense.`}
            </Text>
          </View>
        }
        renderItem={({ item }) => (
          <TransactionRow
            item={item}
            onLongPress={() => confirmDelete(item.id, item.merchant ?? item.category)}
          />
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  listContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xxl,
  },
  greeting: {
    color: colors.subText,
    fontSize: 15,
    marginBottom: spacing.md,
  },
  heroCard: {
    marginBottom: spacing.md,
  },
  heroLabel: {
    color: colors.subText,
    fontSize: 14,
  },
  heroAmount: {
    fontSize: 40,
    fontWeight: '900',
    marginTop: spacing.xs,
  },
  heroProgress: {
    marginTop: spacing.md,
  },
  heroRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.md,
  },
  heroMeta: {
    color: colors.subText,
    fontSize: 13,
  },
  heroMetaStrong: {
    color: colors.text,
    fontWeight: '700',
  },
  budgetLink: {
    color: colors.accent,
  },
  heroStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  cashWarn: {
    color: colors.warning,
    fontSize: 12,
    marginTop: spacing.sm,
    lineHeight: 16,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    ...shadow('sm'),
  },
  actionPressed: {
    backgroundColor: colors.cardAlt,
    transform: [{ scale: 0.97 }],
  },
  actionLabel: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 13,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  sectionTitleInline: {
    marginBottom: 0,
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
  },
  empty: {
    color: colors.subText,
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: spacing.xl,
  },
  emptyEmoji: {
    fontSize: 44,
    marginBottom: spacing.sm,
  },
  emptyTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  emptyText: {
    color: colors.subText,
    textAlign: 'center',
    marginTop: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
});
