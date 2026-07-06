import React from 'react';
import { Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colorForCategory, colors, radius, spacing } from '../constants/theme';
import { Expense, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/format';

export type TransactionRowData = Pick<
  Expense,
  'category' | 'subcategory' | 'merchant' | 'note' | 'date' | 'amount' | 'type' | 'method' | 'source'
>;

type TransactionRowProps = {
  item: TransactionRowData;
  onLongPress?: () => void;
  style?: ViewStyle;
  compact?: boolean;
};

function methodStyles(method: PaymentMethod, isWithdrawal: boolean) {
  if (isWithdrawal) {
    return {
      row: styles.rowWithdrawal,
      badge: styles.badgeWithdrawal,
      badgeText: 'Transfer',
      amount: styles.transfer,
    };
  }
  if (method === 'cash') {
    return {
      row: styles.rowCash,
      badge: styles.badgeCash,
      badgeText: '💵 Cash',
      amount: styles.amountCash,
    };
  }
  return {
    row: styles.rowDebit,
    badge: styles.badgeDebit,
    badgeText: '💳 Debit',
    amount: styles.amountDebit,
  };
}

// Shared transaction list row for dashboard and import preview.
export function TransactionRow({ item, onLongPress, style, compact }: TransactionRowProps) {
  const isWithdrawal = item.type === 'withdrawal';
  const iconColor = isWithdrawal ? colors.muted : colorForCategory(item.category);
  const payment = methodStyles(item.method, isWithdrawal);

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
        {compact ? (
          <>
            <Text style={styles.title} numberOfLines={1}>
              {item.merchant ?? item.category}
            </Text>
            <Text style={styles.meta} numberOfLines={1}>
              {isWithdrawal
                ? 'Transfer → Cash'
                : `${item.category} · ${item.method === 'cash' ? '💵' : '💳'}`}
              {' · '}
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </>
        ) : (
          <>
            <Text style={styles.category} numberOfLines={1}>
              {item.category}
            </Text>
            {item.merchant ? (
              <Text style={styles.detail} numberOfLines={1}>
                {item.merchant}
              </Text>
            ) : null}
            {item.note ? (
              <Text style={styles.note} numberOfLines={2}>
                {item.note}
              </Text>
            ) : null}
            <View style={payment.badge}>
              <Text style={styles.badgeLabel}>{payment.badgeText}</Text>
            </View>
          </>
        )}
      </View>
      <Text style={[styles.amount, payment.amount]}>
        {isWithdrawal ? '→ ' : '-'}
        {formatCurrency(item.amount)}
      </Text>
    </>
  );

  const rowStyle = [styles.row, !compact && payment.row, style];

  if (onLongPress) {
    return (
      <Pressable
        onLongPress={onLongPress}
        style={({ pressed }) => [rowStyle, pressed && styles.pressed]}
      >
        {content}
      </Pressable>
    );
  }

  return <View style={rowStyle}>{content}</View>;
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
  rowDebit: {
    backgroundColor: colors.primary + '10',
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
  },
  rowCash: {
    backgroundColor: colors.success + '10',
    borderLeftColor: colors.success,
    borderLeftWidth: 3,
  },
  rowWithdrawal: {
    backgroundColor: colors.bgElevated,
    borderLeftColor: colors.muted,
    borderLeftWidth: 3,
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
    gap: 2,
  },
  category: {
    color: colors.text,
    fontSize: 15,
    fontWeight: '800',
  },
  detail: {
    color: colors.text,
    fontSize: 13,
    fontWeight: '600',
  },
  note: {
    color: colors.subText,
    fontSize: 12,
    lineHeight: 16,
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
  badgeDebit: {
    alignSelf: 'flex-start',
    backgroundColor: colors.primary + '22',
    borderRadius: radius.pill,
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeCash: {
    alignSelf: 'flex-start',
    backgroundColor: colors.success + '22',
    borderRadius: radius.pill,
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeWithdrawal: {
    alignSelf: 'flex-start',
    backgroundColor: colors.track,
    borderRadius: radius.pill,
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeLabel: {
    color: colors.subText,
    fontSize: 11,
    fontWeight: '700',
  },
  amount: {
    fontWeight: '800',
  },
  amountDebit: {
    color: colors.primary,
  },
  amountCash: {
    color: colors.success,
  },
  transfer: {
    color: colors.muted,
  },
});
