import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useEffect, useMemo } from 'react';
import { FlatList, Pressable, StyleSheet, Text, View } from 'react-native';
import { Card } from '../components/Card';
import { StatItem } from '../components/StatItem';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { formatCurrency } from '../utils/format';

type DashboardScreenProps = NativeStackScreenProps<RootStackParamList, 'Dashboard'>;

// Main dashboard screen showing budget, progress, and transaction history.
export function DashboardScreen({ navigation }: DashboardScreenProps) {
  const { monthlyBudget, expenses, totalSpent, remaining, ensureCurrentMonth } = useBudgetStore();

  // Ensures state is in correct monthly scope when entering dashboard.
  useEffect(() => {
    ensureCurrentMonth();
  }, [ensureCurrentMonth]);

  // Computes spending per category for quick analytics.
  const byCategory = useMemo(() => {
    const map: Record<string, number> = {};

    for (const item of expenses) {
      map[item.category] = (map[item.category] || 0) + item.amount;
    }

    return Object.entries(map).sort((a, b) => b[1] - a[1]);
  }, [expenses]);

  const spent = totalSpent();
  const remain = remaining();

  return (
    <View style={styles.container}>
      <Card style={styles.section}>
        <StatItem label="Total Budget" value={formatCurrency(monthlyBudget)} />
        <StatItem label="Total Spent" tone="danger" value={formatCurrency(spent)} />
        <StatItem
          label="Remaining"
          tone={remain >= 0 ? 'success' : 'danger'}
          value={formatCurrency(remain)}
        />
      </Card>

      <View style={styles.actions}>
        <Pressable onPress={() => navigation.navigate('BudgetSetup')} style={styles.actionButton}>
          <Text style={styles.actionText}>Set Budget</Text>
        </Pressable>
        <Pressable onPress={() => navigation.navigate('AddExpense')} style={styles.actionButton}>
          <Text style={styles.actionText}>Add Expense</Text>
        </Pressable>
      </View>

      <Card style={styles.section}>
        <Text style={styles.sectionTitle}>Top Categories</Text>
        {byCategory.length === 0 ? (
          <Text style={styles.empty}>No expenses yet.</Text>
        ) : (
          byCategory
            .slice(0, 4)
            .map(([name, amount]) => (
              <StatItem key={name} label={name} value={formatCurrency(amount)} />
            ))
        )}
      </Card>

      <Text style={styles.sectionTitle}>Transactions</Text>
      <FlatList
        contentContainerStyle={styles.listContent}
        data={expenses}
        keyExtractor={(item) => item.id}
        ListEmptyComponent={<Text style={styles.empty}>No transactions yet.</Text>}
        renderItem={({ item }) => (
          <Card style={styles.transactionCard}>
            <View style={styles.transactionRow}>
              <Text style={styles.transactionTitle}>{item.category}</Text>
              <Text style={styles.transactionAmount}>-{formatCurrency(item.amount)}</Text>
            </View>
            <Text style={styles.transactionMeta}>{new Date(item.date).toLocaleDateString()}</Text>
            {item.note ? <Text style={styles.transactionMeta}>{item.note}</Text> : null}
          </Card>
        )}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
    padding: spacing.lg,
  },
  section: {
    marginBottom: spacing.md,
  },
  sectionTitle: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  actionButton: {
    alignItems: 'center',
    backgroundColor: colors.primary,
    borderRadius: 12,
    flex: 1,
    paddingVertical: spacing.sm,
  },
  actionText: {
    color: '#FFFFFF',
    fontWeight: '700',
  },
  empty: {
    color: colors.subText,
    marginBottom: spacing.sm,
  },
  listContent: {
    paddingBottom: spacing.xl,
  },
  transactionCard: {
    marginBottom: spacing.sm,
  },
  transactionRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: spacing.xs,
  },
  transactionTitle: {
    color: colors.text,
    fontWeight: '700',
  },
  transactionAmount: {
    color: colors.danger,
    fontWeight: '700',
  },
  transactionMeta: {
    color: colors.subText,
    marginTop: 2,
  },
});
