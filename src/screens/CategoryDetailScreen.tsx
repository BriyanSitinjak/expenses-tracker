import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useCallback, useLayoutEffect, useMemo, useState } from 'react';
import { FlatList, ListRenderItem, ScrollView, StyleSheet, Text, View } from 'react-native';
import { EmptyState } from '../components/EmptyState';
import { SelectChip } from '../components/SelectChip';
import { TransactionRow } from '../components/TransactionRow';
import {
  colorForCategory,
  colorForSubcategory,
  colors,
  radius,
  spacing,
  surface,
} from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { Expense } from '../types';
import { onlyExpenses, sumAmount } from '../utils/analytics';
import { confirmDeleteExpense } from '../utils/confirmDelete';
import { getMonthLabel } from '../utils/date';
import { formatCurrency } from '../utils/format';

type CategoryDetailScreenProps = NativeStackScreenProps<RootStackParamList, 'CategoryDetail'>;

const ALL = '__all__';
const NONE = '__none__';

// Lists expenses in a category, with optional sub-category filter chips.
export function CategoryDetailScreen({ navigation, route }: CategoryDetailScreenProps) {
  const { category, monthKey } = route.params;
  const { expenses, expensesForMonth, deleteExpense } = useBudgetStore();
  const [subFilter, setSubFilter] = useState(ALL);

  const categoryItems = useMemo(() => {
    const source = monthKey ? expensesForMonth(monthKey) : onlyExpenses(expenses);
    return source
      .filter((item) => item.category === category)
      .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
  }, [category, expenses, expensesForMonth, monthKey]);

  const subOptions = useMemo(() => {
    const names = new Set<string>();
    let hasNone = false;
    for (const item of categoryItems) {
      if (item.subcategory?.trim()) names.add(item.subcategory.trim());
      else hasNone = true;
    }
    return {
      names: [...names].sort((a, b) => a.localeCompare(b)),
      hasNone,
    };
  }, [categoryItems]);

  const visibleItems = useMemo(() => {
    if (subFilter === ALL) return categoryItems;
    if (subFilter === NONE) {
      return categoryItems.filter((item) => !item.subcategory?.trim());
    }
    return categoryItems.filter((item) => item.subcategory === subFilter);
  }, [categoryItems, subFilter]);

  const total = useMemo(() => sumAmount(visibleItems), [visibleItems]);
  const color = colorForCategory(category);
  const scopeLabel = monthKey ? getMonthLabel(monthKey) : 'All time';
  const showSubFilters = subOptions.names.length > 0 || subOptions.hasNone;

  useLayoutEffect(() => {
    navigation.setOptions({ title: category });
  }, [category, navigation]);

  // Reset filter when category/month changes.
  useLayoutEffect(() => {
    setSubFilter(ALL);
  }, [category, monthKey]);

  const renderItem: ListRenderItem<Expense> = useCallback(
    ({ item }) => (
      <TransactionRow
        item={item}
        onPress={() => navigation.navigate('AddExpense', { expenseId: item.id })}
        onLongPress={() =>
          confirmDeleteExpense(item.id, item.merchant ?? item.category, deleteExpense)
        }
      />
    ),
    [deleteExpense, navigation],
  );

  const listHeader = (
    <View>
      <View style={styles.summary}>
        <View style={[styles.swatch, { backgroundColor: color }]} />
        <View style={styles.summaryBody}>
          <Text style={styles.scope}>{scopeLabel}</Text>
          <Text style={styles.total}>{formatCurrency(total)}</Text>
          <Text style={styles.count}>
            {visibleItems.length} expense{visibleItems.length === 1 ? '' : 's'}
            {subFilter !== ALL
              ? subFilter === NONE
                ? ' · no sub-category'
                : ` · ${subFilter}`
              : ''}
          </Text>
        </View>
      </View>

      {showSubFilters ? (
        <View style={styles.filterBlock}>
          <Text style={styles.filterLabel}>Sub-category</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.filterRow}
          >
            <SelectChip
              label="All"
              color={color}
              active={subFilter === ALL}
              onPress={() => setSubFilter(ALL)}
            />
            {subOptions.names.map((name) => {
              const subColor = colorForSubcategory(name, category);
              return (
                <SelectChip
                  key={name}
                  label={name}
                  color={subColor}
                  active={subFilter === name}
                  onPress={() => setSubFilter(name)}
                />
              );
            })}
            {subOptions.hasNone ? (
              <SelectChip
                label="No sub"
                color={colors.muted}
                active={subFilter === NONE}
                onPress={() => setSubFilter(NONE)}
              />
            ) : null}
          </ScrollView>
        </View>
      ) : null}
    </View>
  );

  const listEmpty = (
    <EmptyState
      icon="receipt"
      title="No expenses here"
      message={
        subFilter !== ALL
          ? 'Nothing matches this sub-category filter.'
          : `Nothing recorded in ${category}${
              monthKey ? ` for ${getMonthLabel(monthKey)}` : ''
            }.`
      }
    />
  );

  return (
    <FlatList
      style={styles.container}
      data={visibleItems}
      keyExtractor={(item) => item.id}
      renderItem={renderItem}
      ListHeaderComponent={listHeader}
      ListEmptyComponent={listEmpty}
      contentContainerStyle={styles.content}
      showsVerticalScrollIndicator={false}
    />
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
    flexGrow: 1,
  },
  summary: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.md,
    padding: spacing.md,
    ...surface('md'),
  },
  swatch: {
    borderRadius: radius.md,
    height: 48,
    width: 48,
  },
  summaryBody: {
    flex: 1,
    gap: 2,
  },
  scope: {
    color: colors.subText,
    fontSize: 13,
    fontWeight: '600',
  },
  total: {
    color: colors.text,
    fontSize: 24,
    fontWeight: '900',
  },
  count: {
    color: colors.muted,
    fontSize: 13,
    fontWeight: '600',
  },
  filterBlock: {
    marginBottom: spacing.md,
  },
  filterLabel: {
    color: colors.subText,
    fontSize: 12,
    fontWeight: '700',
    marginBottom: spacing.sm,
  },
  filterRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    paddingRight: spacing.md,
  },
});
