import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colorForCategory, colors, radius, spacing } from '../constants/theme';
import { Expense } from '../types';
import { formatCurrency } from '../utils/format';

export type TransactionRowData = Pick<
  Expense,
  'category' | 'subcategory' | 'merchant' | 'date' | 'amount' | 'type' | 'method' | 'source'
>;

type TransactionRowProps = {
  item: TransactionRowData;
  onLongPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
};

function formatMeta(item: TransactionRowData): string {
  const isWithdrawal = item.type === 'withdrawal';
  if (isWithdrawal) return 'Transfer → Cash';

  const methodTag = item.method === 'cash' ? '💵' : '💳';
  const categoryLine = `${item.category}${item.subcategory ? ` · ${item.subcategory}` : ''} · ${methodTag}`;
  const dateLine = new Date(item.date).toLocaleDateString();
  const sourceTag = item.source && item.source !== 'manual' ? ' · 🏦' : '';
  return `${categoryLine} · ${dateLine}${sourceTag}`;
}

// Shared transaction list row for dashboard and import preview.
export function TransactionRow({ item, onLongPress, style, compact }: TransactionRowProps) {
  const isWithdrawal = item.type === 'withdrawal';
  const iconColor = isWithdrawal ? colors.muted : colorForCategory(item.category);
  const title = item.merchant ?? item.category;

  const content = (
    <>
      <View
        style={[
          compact ? styles.dot : styles.icon,
          { backgroundColor: iconColor },
        ]}
      >
        {!compact ? (
          <Text style={styles.iconText}>{isWithdrawal ? '↑' : item.category.slice(0, 1)}</Text>
        ) : null}
      </View>
      <View style={styles.body}>
        <Text style={styles.title} numberOfLines={1}>
          {title}
        </Text>
        <Text style={styles.meta}>{formatMeta(item)}</Text>
      </View>
      <Text style={[styles.amount, isWithdrawal && styles.transfer]}>
        {isWithdrawal ? '→ ' : '-'}
        {formatCurrency(item.amount)}
      </Text>
    </>
  );

  if (onLongPress) {
    return (
      <Pressable
        onLongPress={onLongPress}
        style={({ pressed }) => [styles.row, pressed && styles.pressed, style]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={[styles.row, style]}>{content}</View>;
}

const styles = StyleSheet.create({
  row: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    flexDirection: 'row',
    gap: spacing.md,
    marginBottom: spacing.sm,
    padding: spacing.md,
  },
  pressed: {
    backgroundColor: colors.cardAlt,
  },
  icon: {
    alignItems: 'center',
    borderRadius: radius.md,
    height: 40,
    justifyContent: 'center',
    width: 40,
  },
  iconText: {
    color: '#0B1020',
    fontSize: 18,
    fontWeight: '900',
  },
  dot: {
    borderRadius: 6,
    height: 12,
    width: 12,
  },
  body: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '700',
  },
  meta: {
    color: colors.subText,
    fontSize: 12,
    marginTop: 2,
  },
  amount: {
    color: colors.danger,
    fontWeight: '800',
  },
  transfer: {
    color: colors.muted,
  },
});
