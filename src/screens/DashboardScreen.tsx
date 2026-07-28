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
import { ActionCard } from '../components/ActionCard';
import { AnimatedCard } from '../components/AnimatedCard';
import { BudgetHeroCard } from '../components/BudgetHeroCard';
import { CategoryBar } from '../components/CategoryBar';
import { Icon } from '../components/Icon';
import { IconTile } from '../components/IconTile';
import { MonthPeriodBanner } from '../components/MonthPeriodBanner';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { SectionTitle } from '../components/SectionTitle';
import { TransactionRow } from '../components/TransactionRow';
import { TransferStatusModal } from '../components/TransferStatusModal';
import { colors, radius, spacing } from '../constants/theme';
import { useCsvExport } from '../hooks/useCsvExport';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { Expense } from '../types';
import { budgetSnapshot, monthCashStats, sumByCategory } from '../utils/analytics';
import { formatTodayLabel, getMonthLabel, monthRelation } from '../utils/date';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

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
    cashOnHand,
    deleteExpense,
  } = useBudgetStore();

  const { busy, exportCsv, progress } = useCsvExport();
  const [refreshing, setRefreshing] = useState(false);

  const periodRelation = monthRelation(selectedMonthKey);

  const monthExpenses = expensesForMonth(selectedMonthKey);
  const monthTransactions = transactionsForMonth(selectedMonthKey);
  const spent = totalSpent(selectedMonthKey);
  const { remaining: budgetRemaining, overBudget, usage } = budgetSnapshot(
    spent,
    monthlyBudget
  );
  const cash = cashOnHand();
  const { withdrawn: withdrawnThisMonth, cashSpent: cashSpentThisMonth } =
    monthCashStats(monthTransactions);

  const byCategory = useMemo(() => sumByCategory(monthExpenses), [monthExpenses]);
  const maxCategory = byCategory.length > 0 ? byCategory[0][1] : 0;
  const periodLabel =
    periodRelation === 'current' ? 'this month' : getMonthLabel(selectedMonthKey);

  const onRefresh = useCallback(async () => {
    if (busy) return;
    setRefreshing(true);
    try {
      await useBudgetStore.persist.rehydrate();
    } finally {
      setRefreshing(false);
    }
  }, [busy]);

  const confirmDelete = useCallback(
    (id: string, label: string) => {
      if (busy) return;
      Alert.alert('Delete transaction', `Remove "${label}"?`, [
        { text: 'Cancel', style: 'cancel' },
        { text: 'Delete', style: 'destructive', onPress: () => deleteExpense(id) },
      ]);
    },
    [busy, deleteExpense],
  );

  const renderItem: ListRenderItem<Expense> = useCallback(
    ({ item }) => (
      <TransactionRow
        item={item}
        onLongPress={busy ? undefined : () => confirmDelete(item.id, item.merchant ?? item.category)}
      />
    ),
    [busy, confirmDelete],
  );

  const listHeader = (
    <>
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>{formatTodayLabel()}</Text>
      </View>

      <MonthSwitcher
        monthKey={selectedMonthKey}
        transactionCount={monthTransactions.length}
        onPrevious={() => shiftSelectedMonth(-1)}
        onNext={() => shiftSelectedMonth(1)}
        onGoToCurrent={goToCurrentMonth}
        disabled={busy}
      />

      <MonthPeriodBanner monthKey={selectedMonthKey} />

      <BudgetHeroCard
        remaining={budgetRemaining}
        spent={spent}
        budget={monthlyBudget}
        usage={usage}
        overBudget={overBudget}
        periodLabel={periodLabel}
        cash={cash}
        withdrawn={withdrawnThisMonth}
        cashSpent={cashSpentThisMonth}
        onPressBudget={() => {
          if (!busy) navigation.navigate('BudgetSetup');
        }}
      />

      <View style={styles.toolRow} pointerEvents={busy ? 'none' : 'auto'}>
        <ActionCard
          title="Import"
          subtitle="Bring in a file"
          icon="cloud-download"
          iconColor={colors.accent}
          onPress={() => navigation.navigate('Import')}
          disabled={busy}
        />
        <ActionCard
          title={busy ? 'Exporting…' : 'Export'}
          subtitle={busy ? (progress?.message ?? 'Working…') : 'CSV backup'}
          icon="cloud-upload"
          iconColor={colors.primary}
          onPress={exportCsv}
          disabled={busy}
        />
        <ActionCard
          title="Stats"
          subtitle="All-time view"
          icon="stats-chart"
          iconColor={colors.success}
          onPress={() => navigation.navigate('Stats')}
          disabled={busy}
        />
      </View>

      <AnimatedCard index={1} style={styles.section}>
        <View style={styles.sectionHeader}>
          <SectionTitle style={styles.sectionTitleInline}>Top Categories</SectionTitle>
          <Pressable
            onPress={() => navigation.navigate('Stats')}
            hitSlop={8}
            disabled={busy}
          >
            <Text style={[styles.link, busy && styles.linkDisabled]}>See all</Text>
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
      <IconTile name="receipt" color={colors.muted} size="lg" elevated={false} />
      <Text style={styles.emptyTitle}>No transactions in this period</Text>
      <Text style={styles.emptyText}>
        {periodRelation === 'current'
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
        scrollEnabled={!busy}
        pointerEvents={busy ? 'none' : 'auto'}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            enabled={!busy}
            tintColor={colors.accent}
            colors={[colors.accent]}
            title="Pull to refresh"
            titleColor={colors.subText}
          />
        }
      />

      <Pressable
        onPress={() => {
          if (!busy) navigation.navigate('AddExpense');
        }}
        disabled={busy}
        style={({ pressed }) => [
          styles.fab,
          { bottom: insets.bottom + spacing.lg },
          pressed && !busy && styles.fabPressed,
          busy && styles.fabDisabled,
        ]}
        accessibilityLabel="Add expense"
      >
        <Icon name="add" size={22} color={colors.onAccent} />
        <Text style={styles.fabLabel}>Add expense</Text>
      </Pressable>
      <TransferStatusModal
        visible={progress != null}
        title={progress?.title ?? ''}
        message={progress?.message ?? ''}
        step={progress?.step}
        totalSteps={progress?.totalSteps}
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
    paddingBottom: 100,
  },
  headerBlock: {
    marginBottom: spacing.md,
  },
  headerTitle: {
    color: colors.text,
    fontSize: 28,
    fontWeight: '900',
    letterSpacing: -0.4,
  },
  toolRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionHeader: {
    alignItems: 'center',
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  sectionTitleInline: {
    marginBottom: 0,
  },
  link: {
    color: colors.primary,
    fontWeight: '700',
  },
  linkDisabled: {
    opacity: 0.45,
  },
  empty: {
    color: colors.subText,
  },
  emptyState: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.xl,
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
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.28,
    shadowRadius: 8,
  },
  fabPressed: {
    opacity: 0.9,
    transform: [{ scale: 0.97 }],
  },
  fabDisabled: {
    opacity: 0.45,
  },
  fabLabel: {
    color: colors.onAccent,
    fontSize: 15,
    fontWeight: '800',
  },
});
