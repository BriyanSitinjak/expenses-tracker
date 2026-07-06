import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedCard } from '../components/AnimatedCard';
import { Button } from '../components/Button';
import { CategoryBar } from '../components/CategoryBar';
import { LevelBanner } from '../components/LevelBanner';
import { ProgressBar } from '../components/ProgressBar';
import { SectionTitle } from '../components/SectionTitle';
import { StatBox } from '../components/StatBox';
import { colors, radius, spacing } from '../constants/theme';
import { useExcelExport } from '../hooks/useExcelExport';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { onlyExpenses, sumByCategory, sumByMethod } from '../utils/analytics';
import { computeGamification } from '../utils/gamification';
import { formatCurrency } from '../utils/format';

type InsightsScreenProps = NativeStackScreenProps<RootStackParamList, 'Insights'>;

// Insights screen: achievements, lifetime analytics, and Excel export.
export function InsightsScreen(_: InsightsScreenProps) {
  const { expenses, monthlyBudget, cashOnHand } = useBudgetStore();
  const { exporting, exportExpenses } = useExcelExport();

  const onlyExpenseRows = useMemo(() => onlyExpenses(expenses), [expenses]);

  const game = useMemo(
    () => computeGamification(expenses, monthlyBudget),
    [expenses, monthlyBudget]
  );

  const byCategory = useMemo(() => sumByCategory(onlyExpenseRows), [onlyExpenseRows]);
  const byMethod = useMemo(() => sumByMethod(expenses), [expenses]);

  const cash = cashOnHand();
  const methodTotal = byMethod.cash + byMethod.debit;

  const total = byCategory.reduce((sum, [, amount]) => sum + amount, 0);
  const maxCategory = byCategory.length > 0 ? byCategory[0][1] : 0;

  return (
    <ScrollView style={styles.container} contentContainerStyle={styles.content}>
      <AnimatedCard index={0} style={styles.bannerCard}>
        <LevelBanner game={game} />
      </AnimatedCard>

      <View style={styles.statsRow}>
        <StatBox label="Transactions" value={String(expenses.length)} size="lg" />
        <StatBox label="Days tracked" value={String(game.daysTracked)} size="lg" />
        <StatBox label="Streak" value={`${game.streak}🔥`} size="lg" />
      </View>

      <SectionTitle>Cash & payments</SectionTitle>
      <AnimatedCard index={1} style={styles.methodCard}>
        <View style={styles.methodTop}>
          <Text style={styles.methodLabel}>💵 Cash on hand</Text>
          <Text style={[styles.methodValue, cash < 0 && { color: colors.danger }]}>
            {formatCurrency(cash)}
          </Text>
        </View>
        <View style={styles.methodBarRow}>
          <View style={styles.methodBarLabels}>
            <Text style={styles.methodMeta}>
              💵 Cash spent <Text style={styles.methodStrong}>{formatCurrency(byMethod.cash)}</Text>
            </Text>
            <Text style={styles.methodMeta}>
              💳 Debit spent <Text style={styles.methodStrong}>{formatCurrency(byMethod.debit)}</Text>
            </Text>
          </View>
          <ProgressBar
            progress={methodTotal > 0 ? byMethod.cash / methodTotal : 0}
            color={colors.accent}
            height={8}
          />
        </View>
      </AnimatedCard>

      <SectionTitle>
        {`Achievements (${game.unlockedCount}/${game.achievements.length})`}
      </SectionTitle>
      <View style={styles.grid}>
        {game.achievements.map((item) => (
          <View
            key={item.id}
            style={[styles.badge, item.unlocked ? styles.badgeOn : styles.badgeOff]}
          >
            <Text style={[styles.badgeIcon, !item.unlocked && styles.locked]}>
              {item.unlocked ? item.icon : '🔒'}
            </Text>
            <Text style={styles.badgeTitle}>{item.title}</Text>
            <Text style={styles.badgeDesc}>{item.description}</Text>
          </View>
        ))}
      </View>

      <SectionTitle>Spending by category (all time)</SectionTitle>
      <AnimatedCard index={2}>
        {byCategory.length === 0 ? (
          <Text style={styles.empty}>No data yet.</Text>
        ) : (
          byCategory.map(([name, amount]) => (
            <CategoryBar key={name} name={name} amount={amount} max={maxCategory} total={total} />
          ))
        )}
      </AnimatedCard>

      <View style={styles.exportWrap}>
        <Button
          icon="📊"
          label={exporting ? 'Exporting…' : 'Export all to Excel'}
          onPress={exportExpenses}
          disabled={exporting}
        />
      </View>
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
  bannerCard: {
    backgroundColor: colors.cardAlt,
    marginBottom: spacing.md,
  },
  statsRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  methodCard: {
    marginBottom: spacing.lg,
  },
  methodTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  methodLabel: {
    color: colors.subText,
    fontWeight: '700',
  },
  methodValue: {
    color: colors.accent,
    fontSize: 20,
    fontWeight: '900',
  },
  methodBarRow: {
    gap: spacing.sm,
  },
  methodBarLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  methodMeta: {
    color: colors.subText,
    fontSize: 12,
  },
  methodStrong: {
    color: colors.text,
    fontWeight: '700',
  },
  grid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  badge: {
    width: '48%',
    borderRadius: radius.lg,
    borderWidth: 1,
    padding: spacing.md,
  },
  badgeOn: {
    backgroundColor: colors.card,
    borderColor: colors.gold,
  },
  badgeOff: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    opacity: 0.7,
  },
  badgeIcon: {
    fontSize: 28,
    marginBottom: spacing.xs,
  },
  locked: {
    opacity: 0.6,
  },
  badgeTitle: {
    color: colors.text,
    fontWeight: '800',
  },
  badgeDesc: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 2,
  },
  empty: {
    color: colors.subText,
  },
  exportWrap: {
    marginTop: spacing.sm,
  },
});
