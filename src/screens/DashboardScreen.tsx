import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { Alert, FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { AchievementModal } from '../components/AchievementModal';
import { AnimatedCard } from '../components/AnimatedCard';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CategoryBar } from '../components/CategoryBar';
import { LevelBanner } from '../components/LevelBanner';
import { ProgressBar } from '../components/ProgressBar';
import { colorForCategory, colors, radius, shadow, spacing } from '../constants/theme';
import { useExcelExport } from '../hooks/useExcelExport';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { sumByCategory } from '../utils/analytics';
import { getMonthLabel } from '../utils/date';
import { Achievement, computeGamification } from '../utils/gamification';
import { formatCurrency } from '../utils/format';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// Returns a greeting based on the current hour.
function greeting(): string {
  const hour = new Date().getHours();
  if (hour < 12) return 'Good morning';
  if (hour < 18) return 'Good afternoon';
  return 'Good evening';
}

const ACTIONS = [
  { key: 'AddExpense', label: 'Add', icon: '➕' },
  { key: 'Import', label: 'Import', icon: '🏦' },
  { key: 'Export', label: 'Export', icon: '📊' },
  { key: 'Insights', label: 'Badges', icon: '🏆' },
] as const;

// Main dashboard: budget, gamification, analytics, and transactions.
export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const {
    monthlyBudget,
    expenses,
    currentMonthKey,
    ensureCurrentMonth,
    expensesForMonth,
    transactionsForMonth,
    cashOnHand,
    deleteExpense,
  } = useBudgetStore();

  const { exporting, exportExpenses } = useExcelExport();
  const [newAchievements, setNewAchievements] = useState<Achievement[]>([]);
  const prevUnlocked = useRef<Set<string> | null>(null);

  useEffect(() => {
    ensureCurrentMonth();
  }, [ensureCurrentMonth]);

  const game = useMemo(
    () => computeGamification(expenses, monthlyBudget),
    [expenses, monthlyBudget]
  );

  // Detect achievements unlocked during this session and celebrate them.
  useEffect(() => {
    const unlocked = new Set(game.achievements.filter((a) => a.unlocked).map((a) => a.id));

    if (prevUnlocked.current === null) {
      prevUnlocked.current = unlocked;
      return;
    }

    const fresh = game.achievements.filter(
      (a) => a.unlocked && !prevUnlocked.current!.has(a.id)
    );
    prevUnlocked.current = unlocked;

    if (fresh.length > 0) setNewAchievements(fresh);
  }, [game]);

  const monthExpenses = expensesForMonth(currentMonthKey);
  const monthTransactions = transactionsForMonth(currentMonthKey);
  const spent = monthExpenses.reduce((sum, item) => sum + item.amount, 0);
  const remaining = monthlyBudget - spent;
  const overBudget = remaining < 0;
  const usage = monthlyBudget > 0 ? spent / monthlyBudget : 0;
  const cash = cashOnHand();
  const withdrawnThisMonth = monthTransactions
    .filter((item) => item.type === 'withdrawal')
    .reduce((sum, item) => sum + item.amount, 0);
  const cashSpentThisMonth = monthExpenses
    .filter((item) => item.method === 'cash')
    .reduce((sum, item) => sum + item.amount, 0);

  const byCategory = useMemo(() => sumByCategory(monthExpenses), [monthExpenses]);
  const maxCategory = byCategory.length > 0 ? byCategory[0][1] : 0;

  function handleAction(key: (typeof ACTIONS)[number]['key']) {
    if (key === 'Export') {
      exportExpenses();
      return;
    }
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
      <Text style={styles.monthLabel}>{getMonthLabel(currentMonthKey)}</Text>

      <AnimatedCard index={0} style={styles.bannerCard}>
        <LevelBanner game={game} />
      </AnimatedCard>

      <AnimatedCard index={1} style={styles.heroCard}>
        <Text style={styles.heroLabel}>{overBudget ? 'Over budget by' : 'Remaining this month'}</Text>
        <AnimatedNumber
          value={Math.abs(remaining)}
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
          <Text style={styles.heroMeta}>
            Budget{' '}
            <Text style={styles.heroMetaStrong}>
              {monthlyBudget > 0 ? formatCurrency(monthlyBudget) : 'not set'}
            </Text>
          </Text>
        </View>
      </AnimatedCard>

      <AnimatedCard index={2} style={styles.cashCard}>
        <View style={styles.cashHeader}>
          <Text style={styles.cashLabel}>💵 Cash on hand</Text>
          <AnimatedNumber
            value={cash}
            format={(v) => formatCurrency(v)}
            adjustsFontSizeToFit
            numberOfLines={1}
            style={[styles.cashValue, cash < 0 && { color: colors.danger }]}
          />
        </View>
        <View style={styles.cashRow}>
          <Text style={styles.cashMeta}>
            Withdrawn (mo) <Text style={styles.cashMetaStrong}>{formatCurrency(withdrawnThisMonth)}</Text>
          </Text>
          <Text style={styles.cashMeta}>
            Cash spent (mo){' '}
            <Text style={styles.cashMetaStrong}>{formatCurrency(cashSpentThisMonth)}</Text>
          </Text>
        </View>
        {cash < 0 ? (
          <Text style={styles.cashWarn}>
            You&apos;ve logged more cash spending than withdrawals — add a withdrawal or check entries.
          </Text>
        ) : null}
      </AnimatedCard>

      <View style={styles.actions}>
        {ACTIONS.map((action) => {
          const isBusy = action.key === 'Export' && exporting;
          return (
            <Pressable
              key={action.key}
              onPress={() => handleAction(action.key)}
              disabled={isBusy}
              style={({ pressed }) => [styles.actionButton, pressed && styles.actionPressed]}
            >
              <Text style={styles.actionIcon}>{isBusy ? '⏳' : action.icon}</Text>
              <Text style={styles.actionLabel}>{isBusy ? '...' : action.label}</Text>
            </Pressable>
          );
        })}
      </View>

      <AnimatedCard index={3} style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Top Categories</Text>
          <Pressable onPress={() => navigation.navigate('Insights')}>
            <Text style={styles.link}>See all</Text>
          </Pressable>
        </View>
        {byCategory.length === 0 ? (
          <Text style={styles.empty}>No spending yet this month.</Text>
        ) : (
          byCategory
            .slice(0, 4)
            .map(([name, amount]) => (
              <CategoryBar key={name} name={name} amount={amount} max={maxCategory} />
            ))
        )}
      </AnimatedCard>

      <Text style={styles.listTitle}>Transactions</Text>
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
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text style={styles.emptyEmoji}>🧾</Text>
            <Text style={styles.emptyTitle}>No transactions yet</Text>
            <Text style={styles.emptyText}>
              Import your bank statement or add an expense to get started.
            </Text>
          </View>
        }
        renderItem={({ item }) => {
          const isWithdrawal = item.type === 'withdrawal';
          const iconColor = isWithdrawal ? colors.muted : colorForCategory(item.category);
          const methodTag = item.method === 'cash' ? '💵' : '💳';
          return (
            <Pressable
              onLongPress={() => confirmDelete(item.id, item.merchant ?? item.category)}
              style={({ pressed }) => [styles.txCard, pressed && styles.txPressed]}
            >
              <View style={[styles.txIcon, { backgroundColor: iconColor }]}>
                <Text style={styles.txIconText}>{isWithdrawal ? '↑' : item.category.slice(0, 1)}</Text>
              </View>
              <View style={styles.txBody}>
                <Text style={styles.txTitle} numberOfLines={1}>
                  {item.merchant ?? item.category}
                </Text>
                <Text style={styles.txMeta}>
                  {isWithdrawal
                    ? 'Transfer → Cash'
                    : `${item.category}${item.subcategory ? ` · ${item.subcategory}` : ''} · ${methodTag}`}
                  {' · '}
                  {new Date(item.date).toLocaleDateString()}
                  {item.source !== 'manual' ? ' · 🏦' : ''}
                </Text>
              </View>
              <Text style={[styles.txAmount, isWithdrawal && styles.txTransfer]}>
                {isWithdrawal ? '→ ' : '-'}
                {formatCurrency(item.amount)}
              </Text>
            </Pressable>
          );
        }}
      />

      <AchievementModal
        achievements={newAchievements}
        onClose={() => setNewAchievements([])}
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
  },
  monthLabel: {
    color: colors.text,
    fontSize: 26,
    fontWeight: '800',
    marginBottom: spacing.lg,
  },
  bannerCard: {
    backgroundColor: colors.cardAlt,
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
  cashCard: {
    backgroundColor: colors.card,
    marginBottom: spacing.md,
  },
  cashHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  cashLabel: {
    color: colors.subText,
    fontSize: 14,
    fontWeight: '700',
  },
  cashValue: {
    color: colors.accent,
    fontSize: 22,
    fontWeight: '900',
    maxWidth: '55%',
  },
  cashRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginTop: spacing.sm,
  },
  cashMeta: {
    color: colors.subText,
    fontSize: 12,
  },
  cashMetaStrong: {
    color: colors.text,
    fontWeight: '700',
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
    paddingVertical: spacing.md,
    alignItems: 'center',
    gap: 4,
    ...shadow('sm'),
  },
  actionPressed: {
    backgroundColor: colors.cardAlt,
    transform: [{ scale: 0.97 }],
  },
  actionIcon: {
    fontSize: 22,
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
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  link: {
    color: colors.accent,
    fontWeight: '700',
  },
  empty: {
    color: colors.subText,
  },
  listTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: spacing.sm,
  },
  txCard: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderWidth: 1,
    borderRadius: radius.lg,
    padding: spacing.md,
    marginBottom: spacing.sm,
    gap: spacing.md,
  },
  txPressed: {
    backgroundColor: colors.cardAlt,
  },
  txIcon: {
    width: 40,
    height: 40,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  txIconText: {
    color: '#0B1020',
    fontWeight: '900',
    fontSize: 18,
  },
  txBody: {
    flex: 1,
  },
  txTitle: {
    color: colors.text,
    fontWeight: '700',
    fontSize: 15,
  },
  txMeta: {
    color: colors.subText,
    marginTop: 2,
    fontSize: 12,
  },
  txAmount: {
    color: colors.danger,
    fontWeight: '800',
  },
  txTransfer: {
    color: colors.muted,
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
