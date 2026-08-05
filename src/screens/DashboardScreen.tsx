import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useMemo, useState } from 'react';
import {
  FlatList,
  Keyboard,
  KeyboardAvoidingView,
  ListRenderItem,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { ActionCard } from '../components/ActionCard';
import { AnimatedCard } from '../components/AnimatedCard';
import { BudgetHeroCard } from '../components/BudgetHeroCard';
import { CategoryBreakdownList } from '../components/CategoryBreakdownList';
import { EmptyState } from '../components/EmptyState';
import { Icon } from '../components/Icon';
import { MonthPeriodBanner } from '../components/MonthPeriodBanner';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { SectionTitle } from '../components/SectionTitle';
import { TransactionRow } from '../components/TransactionRow';
import { TransferStatusModal } from '../components/TransferStatusModal';
import { ThemeColors, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { useCsvExport } from '../hooks/useCsvExport';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { Expense } from '../types';
import { budgetSnapshot, sumByCategory } from '../utils/analytics';
import { confirmDeleteExpense } from '../utils/confirmDelete';
import { formatTodayLabel, getMonthLabel, monthRelation } from '../utils/date';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

function matchesSearch(item: Expense, query: string): boolean {
  const q = query.trim().toLowerCase();
  if (!q) return true;
  const haystack = [
    item.merchant,
    item.category,
    item.subcategory,
    item.note,
    item.method,
    item.type,
  ]
    .filter(Boolean)
    .join(' ')
    .toLowerCase();
  return haystack.includes(q);
}

export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const insets = useSafeAreaInsets();
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const {
    monthlyBudget,
    selectedMonthKey,
    shiftSelectedMonth,
    goToCurrentMonth,
    expensesForMonth,
    transactionsForMonth,
    totalSpent,
    deleteExpense,
  } = useBudgetStore();

  const { busy, exportCsv, progress } = useCsvExport();
  const [refreshing, setRefreshing] = useState(false);
  const [searchOpen, setSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');

  const periodRelation = monthRelation(selectedMonthKey);

  const monthExpenses = expensesForMonth(selectedMonthKey);
  const monthTransactions = transactionsForMonth(selectedMonthKey);
  const spent = totalSpent(selectedMonthKey);
  const { remaining: budgetRemaining, overBudget, usage } = budgetSnapshot(
    spent,
    monthlyBudget
  );

  const byCategory = useMemo(() => sumByCategory(monthExpenses), [monthExpenses]);
  const periodLabel =
    periodRelation === 'current' ? 'this month' : getMonthLabel(selectedMonthKey);

  const visibleTransactions = useMemo(() => {
    if (!searchQuery.trim()) return monthTransactions;
    return monthTransactions.filter((item) => matchesSearch(item, searchQuery));
  }, [monthTransactions, searchQuery]);

  const onRefresh = useCallback(async () => {
    if (busy) return;
    setRefreshing(true);
    try {
      await useBudgetStore.persist.rehydrate();
    } finally {
      setRefreshing(false);
    }
  }, [busy]);

  const renderItem: ListRenderItem<Expense> = useCallback(
    ({ item }) => (
      <TransactionRow
        item={item}
        onPress={
          busy ? undefined : () => navigation.navigate('AddExpense', { expenseId: item.id })
        }
        onLongPress={
          busy
            ? undefined
            : () => confirmDeleteExpense(item.id, item.merchant ?? item.category, deleteExpense)
        }
      />
    ),
    [busy, deleteExpense, navigation],
  );

  function toggleSearch() {
    if (busy) return;
    setSearchOpen((open) => {
      if (open) setSearchQuery('');
      return !open;
    });
  }

  function openCategory(category: string) {
    if (busy) return;
    navigation.navigate('CategoryDetail', {
      category,
      monthKey: selectedMonthKey,
    });
  }

  const listHeader = (
    <>
      <View style={styles.headerBlock}>
        <Text style={styles.headerTitle}>{formatTodayLabel()}</Text>
        <Text style={styles.headerSubtitle}>Track your spending</Text>
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
          subtitle={getMonthLabel(selectedMonthKey)}
          icon="stats-chart"
          iconColor={colors.success}
          onPress={() => navigation.navigate('Stats')}
          disabled={busy}
        />
      </View>

      <SectionTitle>Top categories</SectionTitle>
      <AnimatedCard index={1} style={styles.section}>
        <CategoryBreakdownList
          items={byCategory}
          total={spent}
          limit={4}
          emptyText={`No spending in ${getMonthLabel(selectedMonthKey)}.`}
          onPressCategory={openCategory}
        />
      </AnimatedCard>

      <View style={styles.transactionsHeader}>
        <SectionTitle style={styles.sectionTitleInline}>
          Transactions in {getMonthLabel(selectedMonthKey)}
        </SectionTitle>
        <Pressable
          onPress={toggleSearch}
          hitSlop={8}
          disabled={busy}
          style={({ pressed }) => [
            styles.searchBtn,
            searchOpen && styles.searchBtnActive,
            pressed && !busy && styles.searchBtnPressed,
            busy && styles.searchBtnDisabled,
          ]}
          accessibilityLabel={searchOpen ? 'Close search' : 'Search expenses'}
        >
          <Icon
            name={searchOpen ? 'close' : 'search'}
            size={18}
            color={searchOpen ? colors.primary : colors.subText}
          />
        </Pressable>
      </View>

      {searchOpen ? (
        <View style={styles.searchField}>
          <Icon name="search" size={16} color={colors.muted} />
          <TextInput
            value={searchQuery}
            onChangeText={setSearchQuery}
            placeholder="Search merchant, category, note…"
            placeholderTextColor={colors.muted}
            style={styles.searchInput}
            autoFocus
            autoCorrect={false}
            clearButtonMode="while-editing"
            editable={!busy}
            returnKeyType="search"
            blurOnSubmit
            onSubmitEditing={Keyboard.dismiss}
          />
        </View>
      ) : null}
    </>
  );

  const searching = Boolean(searchQuery.trim());
  const listEmpty = (
    <EmptyState
      icon={searching ? 'search' : 'receipt'}
      title={searching ? 'No matching expenses' : 'No transactions in this period'}
      message={
        searching
          ? 'Try another keyword, or clear the search.'
          : periodRelation === 'current'
            ? 'Tap + below to add an expense, or use Import.'
            : `Nothing recorded for ${getMonthLabel(selectedMonthKey)}.`
      }
    />
  );

  return (
    <KeyboardAvoidingView
      style={styles.container}
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      keyboardVerticalOffset={Platform.OS === 'ios' ? 88 : 0}
    >
      <FlatList
        data={visibleTransactions}
        keyExtractor={(item) => item.id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={[
          styles.listContent,
          searchOpen && styles.listContentSearching,
        ]}
        showsVerticalScrollIndicator={false}
        scrollEnabled={!busy}
        pointerEvents={busy ? 'none' : 'auto'}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        automaticallyAdjustKeyboardInsets
        onScrollBeginDrag={Keyboard.dismiss}
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

      {!searchOpen ? (
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
      ) : null}
      <TransferStatusModal
        visible={progress != null}
        title={progress?.title ?? ''}
        message={progress?.message ?? ''}
        step={progress?.step}
        totalSteps={progress?.totalSteps}
      />
    </KeyboardAvoidingView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.bg,
      flex: 1,
    },
    listContent: {
      padding: spacing.lg,
      paddingBottom: 100,
      flexGrow: 1,
    },
    listContentSearching: {
      paddingBottom: spacing.xxl,
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
    headerSubtitle: {
      color: colors.subText,
      fontSize: 15,
      fontWeight: '500',
      marginTop: 4,
    },
    toolRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    section: {
      marginBottom: spacing.md,
    },
    sectionTitleInline: {
      marginBottom: 0,
      flex: 1,
    },
    transactionsHeader: {
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.sm,
    },
    searchBtn: {
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    searchBtnActive: {
      backgroundColor: colors.card,
      borderColor: colors.primary,
    },
    searchBtnPressed: {
      opacity: 0.75,
    },
    searchBtnDisabled: {
      opacity: 0.45,
    },
    searchField: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    searchInput: {
      color: colors.text,
      flex: 1,
      fontSize: 15,
      paddingVertical: 4,
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
}
