import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedCard } from '../components/AnimatedCard';
import { CategoryBreakdownList } from '../components/CategoryBreakdownList';
import { CategoryShareChart } from '../components/CategoryShareChart';
import { IconTile } from '../components/IconTile';
import { MonthSwitcher } from '../components/MonthSwitcher';
import { ProgressBar } from '../components/ProgressBar';
import { SectionTitle } from '../components/SectionTitle';
import { ThemeColors, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { sumAmount, sumByCategory, sumByMethod } from '../utils/analytics';
import { getMonthLabel } from '../utils/date';
import { formatCurrency } from '../utils/format';

type StatsScreenProps = NativeStackScreenProps<RootStackParamList, 'Stats'>;

// Monthly stats: share overview, category bars, cash on hand, and payment mix.
export function StatsScreen({ navigation }: StatsScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  const {
    cashOnHand,
    selectedMonthKey,
    shiftSelectedMonth,
    goToCurrentMonth,
    expensesForMonth,
    transactionsForMonth,
  } = useBudgetStore();

  const monthTransactions = transactionsForMonth(selectedMonthKey);
  const monthExpenses = useMemo(
    () => expensesForMonth(selectedMonthKey),
    [expensesForMonth, selectedMonthKey]
  );

  const byCategory = useMemo(() => sumByCategory(monthExpenses), [monthExpenses]);
  const byMethod = useMemo(() => sumByMethod(monthTransactions), [monthTransactions]);

  const cash = cashOnHand();
  const methodTotal = byMethod.cash + byMethod.debit;
  const total = sumAmount(monthExpenses);
  const monthLabel = getMonthLabel(selectedMonthKey);

  function openCategory(category: string) {
    navigation.navigate('CategoryDetail', {
      category,
      monthKey: selectedMonthKey,
    });
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <MonthSwitcher
        monthKey={selectedMonthKey}
        transactionCount={monthTransactions.length}
        onPrevious={() => shiftSelectedMonth(-1)}
        onNext={() => shiftSelectedMonth(1)}
        onGoToCurrent={goToCurrentMonth}
      />

      <SectionTitle>Spending overview</SectionTitle>
      <AnimatedCard index={0} style={styles.block}>
        <Text style={styles.txnHint}>
          {monthTransactions.length} transaction
          {monthTransactions.length === 1 ? '' : 's'} · {monthLabel}
        </Text>
        <CategoryShareChart items={byCategory} total={total} />
      </AnimatedCard>

      <SectionTitle>By category</SectionTitle>
      <AnimatedCard index={1} style={styles.block}>
        <CategoryBreakdownList
          items={byCategory}
          total={total}
          emptyText={`No spending in ${monthLabel}.`}
          onPressCategory={openCategory}
        />
      </AnimatedCard>

      <SectionTitle>Cash & payments</SectionTitle>
      <AnimatedCard index={2} style={styles.block}>
        <View style={styles.cashRow}>
          <View>
            <Text style={styles.cashLabel}>Cash on hand</Text>
            <Text style={[styles.cashValue, cash < 0 && styles.cashDanger]}>
              {formatCurrency(cash)}
            </Text>
            <Text style={styles.cashHint}>All-time wallet balance</Text>
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

      <Text style={styles.footnote}>
        {monthLabel} stats · cash on hand stays all-time
      </Text>
    </ScrollView>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.bg,
      flex: 1,
    },
    content: {
      padding: spacing.lg,
      paddingBottom: spacing.xxl,
    },
    block: {
      marginBottom: spacing.lg,
    },
    txnHint: {
      color: colors.subText,
      fontSize: 13,
      fontWeight: '600',
      marginBottom: spacing.md,
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
    cashHint: {
      color: colors.muted,
      fontSize: 12,
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
    footnote: {
      color: colors.muted,
      fontSize: 12,
      textAlign: 'center',
    },
  });
}
