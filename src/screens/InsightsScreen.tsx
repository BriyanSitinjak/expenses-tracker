import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo } from 'react';
import { ScrollView, StyleSheet, Text, View } from 'react-native';
import { AnimatedCard } from '../components/AnimatedCard';
import { Button } from '../components/Button';
import { CategoryBar } from '../components/CategoryBar';
import { LevelBanner } from '../components/LevelBanner';
import { ProgressBar } from '../components/ProgressBar';
import { colors, radius, spacing } from '../constants/theme';
import { useExcelExport } from '../hooks/useExcelExport';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { sumByCategory } from '../utils/analytics';
import { computeGamification } from '../utils/gamification';
import { formatCurrency } from '../utils/format';

type InsightsScreenProps = NativeStackScreenProps<RootStackParamList, 'Insights'>;

// Insights screen: achievements, lifetime analytics, and Excel export.
export function InsightsScreen(_: InsightsScreenProps) {
  const { expenses, monthlyBudget, cashOnHand } = useBudgetStore();
  const { exporting, exportExpenses } = useExcelExport();

  const onlyExpenses = useMemo(
    () => expenses.filter((item) => item.type === 'expense'),
    [expenses]
  );

  const game = useMemo(
    () => computeGamification(expenses, monthlyBudget),
    [expenses, monthlyBudget]
  );

  const byCategory = useMemo(() => sumByCategory(onlyExpenses), [onlyExpenses]);

  const byMethod = useMemo(() => {
    let cash = 0;
    let debit = 0;
    for (const item of onlyExpenses) {
      if (item.method === 'cash') cash += item.amount;
      else debit += item.amount;
    }
    return { cash, debit };
  }, [onlyExpenses]);

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
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{expenses.length}</Text>
          <Text style={styles.statLabel}>Transactions</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{game.daysTracked}</Text>
          <Text style={styles.statLabel}>Days tracked</Text>
        </View>
        <View style={styles.statBox}>
          <Text style={styles.statValue}>{game.streak}🔥</Text>
          <Text style={styles.statLabel}>Streak</Text>
        </View>
      </View>

      <Text style={styles.sectionTitle}>Cash & payments</Text>
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

      <Text style={styles.sectionTitle}>
        Achievements ({game.unlockedCount}/{game.achievements.length})
      </Text>
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

      <Text style={styles.sectionTitle}>Spending by category (all time)</Text>
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
  statBox: {
    flex: 1,
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    alignItems: 'center',
  },
  statValue: {
    color: colors.text,
    fontSize: 22,
    fontWeight: '900',
  },
  statLabel: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 2,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: spacing.sm,
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
