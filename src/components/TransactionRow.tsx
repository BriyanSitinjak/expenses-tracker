import React from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import {
  colorForCategory,
  colorForSubcategory,
  colors,
  radius,
  spacing,
  withAlpha,
} from '../constants/theme';
import { Expense, PaymentMethod } from '../types';
import { formatCurrency } from '../utils/format';

type TransactionRowData = Pick<
  Expense,
  'category' | 'subcategory' | 'merchant' | 'note' | 'date' | 'amount' | 'type' | 'method'
>;

type TransactionRowProps = {
  item: TransactionRowData;
  onPress?: () => void;
  onLongPress?: () => void;
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
      badgeText: 'Cash',
      amount: styles.amountCash,
    };
  }
  return {
    row: styles.rowDebit,
    badge: styles.badgeDebit,
    badgeText: 'Debit',
    amount: styles.amountDebit,
  };
}

// Shared transaction list row for dashboard and import preview.
export function TransactionRow({ item, onPress, onLongPress, compact }: TransactionRowProps) {
  const isWithdrawal = item.type === 'withdrawal';
  const categoryColor = isWithdrawal ? colors.muted : colorForCategory(item.category);
  const subcategoryColor = item.subcategory
    ? colorForSubcategory(item.subcategory, item.category)
    : null;
  const payment = methodStyles(item.method, isWithdrawal);

  const content = (
    <>
      <View
        style={[
          compact ? styles.dot : styles.icon,
          { backgroundColor: categoryColor },
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
                : `${item.category}${item.subcategory ? ` · ${item.subcategory}` : ''} · ${
                    item.method === 'cash' ? 'Cash' : 'Debit'
                  }`}
              {' · '}
              {new Date(item.date).toLocaleDateString()}
            </Text>
          </>
        ) : (
          <>
            <View style={styles.badgeRow}>
              <View
                style={[
                  styles.categoryBadge,
                  { backgroundColor: withAlpha(categoryColor, 0.13) },
                ]}
              >
                <Text style={[styles.categoryBadgeText, { color: categoryColor }]}>
                  {item.category}
                </Text>
              </View>
              {item.subcategory && subcategoryColor ? (
                <View
                  style={[
                    styles.subcategoryBadge,
                    { backgroundColor: withAlpha(subcategoryColor, 0.13) },
                  ]}
                >
                  <Text style={[styles.subcategoryBadgeText, { color: subcategoryColor }]}>
                    {item.subcategory}
                  </Text>
                </View>
              ) : null}
            </View>
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

  const rowStyle = [styles.row, !compact && payment.row];

  if (onPress || onLongPress) {
    return (
      <Pressable
        onPress={onPress}
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
    backgroundColor: withAlpha(colors.primary, 0.06),
    borderLeftColor: colors.primary,
    borderLeftWidth: 3,
  },
  rowCash: {
    backgroundColor: withAlpha(colors.success, 0.06),
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
    color: colors.onAccent,
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
  badgeRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
    marginBottom: 2,
  },
  categoryBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  categoryBadgeText: {
    fontSize: 12,
    fontWeight: '800',
  },
  subcategoryBadge: {
    borderRadius: radius.pill,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  subcategoryBadgeText: {
    fontSize: 12,
    fontWeight: '700',
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
    backgroundColor: withAlpha(colors.primary, 0.13),
    borderRadius: radius.pill,
    marginTop: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 2,
  },
  badgeCash: {
    alignSelf: 'flex-start',
    backgroundColor: withAlpha(colors.success, 0.13),
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
