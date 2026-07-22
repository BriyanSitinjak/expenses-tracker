import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  Alert,
  FlatList,
  ListRenderItem,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
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
import { useExcelExport } from '../hooks/useExcelExport';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { Expense } from '../types';
import { budgetSnapshot, monthCashStats, sumByCategory } from '../utils/analytics';
import { getMonthKey, getMonthLabel, isCurrentMonth } from '../utils/date';
import { formatCurrency } from '../utils/format';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

const TOOL_ACTIONS = [
  { key: 'Import', label: 'Import' },
  { key: 'Export', label: 'Export' },
  { key: 'Insights', label: 'Insights' },
] as const;

function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
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

  const { exporting, exportingBackup, exportExpenses, exportBackup } = useExcelExport();
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
  const exportBusy = exporting || exportingBackup;

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try {
      await useBudgetStore.persist.rehydrate();
    } finally {
      setRefreshing(false);
    }
  }, []);

  function handleToolAction(key: (typeof TOOL_ACTIONS)[number]['key']) {
    if (key === 'Export') {
      Alert.alert('Export data', 'Both formats can be imported again later.', [
        { text: 'Excel (.xlsx)', onPress: exportExpenses },
        { text: 'CSV backup', onPress: exportBackup },
        { text: 'Cancel', style: 'cancel' },
      ]);
      return;
    }
    navigation.navigate(key);
  }

  const confirmDelete = useCallback(
    (id: string, label: string) => {
      Alert.alert('Delete transaction', `Remove "${label}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
      ]);
    },
    [deleteExpense],
  );

  const renderItem: ListRenderItem<Expense> = useCallback(
    ({ item }) => (
      <TransactionRow
        item={item}
        onLongPress={() => confirmDelete(item.id, item.merchant ?? item.category)}
      />
    ),
    [confirmDelete],
  );

  const listHeader = (
    <>
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

      <View style={styles.toolRow}>
        {TOOL_ACTIONS.map((action) => (
          <Pressable
            key={action.key}
            onPress={() => handleToolAction(action.key)}
            disabled={action.key === 'Export' && exportBusy}
            style={({ pressed }) => [
              styles.toolButton,
              pressed && styles.toolPressed,
              action.key === 'Export' && exportBusy && styles.toolDisabled,
            ]}
          >
            <Text style={styles.toolLabel}>
              {action.key === 'Export' && exportBusy ? 'Exporting…' : action.label}
            </Text>
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
    </>
  );

  const listEmpty = (
    <View style={styles.emptyState}>
      <Text style={styles.emptyEmoji}>🧾</Text>
      <Text style={styles.emptyTitle}>No transactions in this period</Text>
      <Text style={styles.emptyText}>
        {viewingCurrentMonth
          ? 'Tap + below to add an expense, or use Import.'
          : `Nothing recorded for ${getMonthLabel(selectedMonthKey)}.`}
      </Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={monthTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
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
      />

      <Pressable
        onPress={() => navigation.navigate('AddExpense')}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + spacing.lg },
          pressed && styles.fabPressed,
        ]}
        accessibilityLabel="Add expense"
      >
        <Text style={styles.fabIcon}>+</Text>
        <Text style={styles.fabLabel}>Add expense</Text>
      </Pressable>
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
    paddingBottom: 100,
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
  toolRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  toolButton: {
    flex: 1,
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    paddingVertical: spacing.sm,
    ...shadow('sm'),
  },
  toolPressed: {
    backgroundColor: colors.cardAlt,
    transform: [{ scale: 0.97 }],
  },
  toolDisabled: {
    opacity: 0.6,
  },
  toolLabel: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '700',
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
  fab: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: radius.pill,
    bottom: spacing.lg,
    elevation: 8,
    flexDirection: 'row',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    position: 'absolute',
    right: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
  },
  fabPressed: {
    backgroundColor: colors.primary,
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  fabIcon: {
    color: '#FFFFFF',
    fontSize: 22,
    fontWeight: '300',
    lineHeight: 24,
  },
  fabLabel: {
    color: '#FFFFFF',
    fontSize: 15,
    fontWeight: '800',
  },
});
