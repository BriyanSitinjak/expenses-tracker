import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, radius, spacing, surface } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { formatCurrency } from '../utils/format';
import { AnimatedNumber } from './AnimatedNumber';
import { ProgressBar } from './ProgressBar';
import { StatusPill } from './StatusPill';

type BudgetHeroCardProps = {
  remaining: number;
  spent: number;
  budget: number;
  usage: number;
  overBudget: boolean;
  periodLabel: string;
  onPressBudget: () => void;
};

// Eye-catching budget summary with light staggered entrance motion.
export function BudgetHeroCard({
  remaining,
  spent,
  budget,
  usage,
  overBudget,
  periodLabel,
  onPressBudget,
}: BudgetHeroCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const enter = useRef(new Animated.Value(0)).current;
  const amountPulse = useRef(new Animated.Value(1)).current;

  const status = useMemo(() => {
    if (budget <= 0) {
      return { label: 'Set a budget', color: colors.accent, bar: colors.primary };
    }
    if (overBudget) {
      return { label: 'Over budget', color: colors.danger, bar: colors.danger };
    }
    if (usage > 0.8) {
      return { label: 'Almost there', color: colors.warning, bar: colors.warning };
    }
    return { label: 'On track', color: colors.success, bar: colors.primary };
  }, [budget, colors, overBudget, usage]);

  const usagePercent = Math.round(Math.max(0, Math.min(usage, 2)) * 100);

  useEffect(() => {
    enter.setValue(0);
    Animated.timing(enter, {
      toValue: 1,
      duration: 520,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: true,
    }).start();
  }, [enter, periodLabel]);

  useEffect(() => {
    amountPulse.setValue(0.97);
    Animated.spring(amountPulse, {
      toValue: 1,
      friction: 7,
      tension: 120,
      useNativeDriver: true,
    }).start();
  }, [amountPulse, remaining, overBudget]);

  const cardOpacity = enter;
  const cardLift = enter.interpolate({
    inputRange: [0, 1],
    outputRange: [14, 0],
  });

  return (
    <Animated.View
      style={[
        styles.card,
        {
          opacity: cardOpacity,
          transform: [{ translateY: cardLift }],
        },
      ]}
    >
      <View style={styles.topRow}>
        <View style={styles.amountBlock}>
          <Text style={styles.kicker}>
            {overBudget ? `Over in ${periodLabel}` : `Left in ${periodLabel}`}
          </Text>
          <View style={styles.amountSlot}>
            <Animated.View style={[styles.amountPulse, { transform: [{ scale: amountPulse }] }]}>
              <AnimatedNumber
                value={Math.abs(remaining)}
                format={(v) => formatCurrency(v)}
                adjustsFontSizeToFit
                numberOfLines={1}
                style={[styles.amount, { color: overBudget ? colors.danger : colors.text }]}
              />
            </Animated.View>
          </View>
        </View>

        <StatusPill label={status.label} color={status.color} />
      </View>

      <View style={styles.progressBlock}>
        <View style={styles.progressLabels}>
          <Text style={styles.progressCaption}>Budget used</Text>
          <Text style={[styles.progressCaption, { color: status.bar }]}>{usagePercent}%</Text>
        </View>
        <ProgressBar progress={usage} color={status.bar} height={10} />
      </View>

      <View style={styles.metaRow}>
        <View style={styles.metaItem}>
          <Text style={styles.metaLabel}>Spent</Text>
          <Text style={styles.metaValue}>{formatCurrency(spent)}</Text>
        </View>
        <View style={styles.metaDivider} />
        <Pressable onPress={onPressBudget} hitSlop={8} style={styles.metaItem}>
          <Text style={styles.metaLabel}>Budget</Text>
          <Text style={[styles.metaValue, styles.budgetLink]}>
            {budget > 0 ? formatCurrency(budget) : 'Tap to set'}
          </Text>
        </Pressable>
      </View>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      marginBottom: spacing.md,
      padding: spacing.lg,
      ...surface('md', { radius: 'xl' }, colors),
    },
    topRow: {
      alignItems: 'flex-start',
      flexDirection: 'row',
      gap: spacing.md,
      justifyContent: 'space-between',
    },
    amountBlock: {
      flex: 1,
      minWidth: 0,
    },
    kicker: {
      color: colors.subText,
      fontSize: 13,
      fontWeight: '600',
      letterSpacing: 0.2,
    },
    amountSlot: {
      justifyContent: 'center',
      marginTop: spacing.xs,
      minHeight: 48,
      overflow: 'visible',
      paddingHorizontal: 2,
      paddingVertical: 4,
    },
    amountPulse: {
      alignSelf: 'flex-start',
    },
    amount: {
      fontSize: 36,
      fontWeight: '900',
      letterSpacing: -0.5,
      maxWidth: 220,
    },
    progressBlock: {
      marginTop: spacing.lg,
    },
    progressLabels: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.xs,
    },
    progressCaption: {
      color: colors.subText,
      fontSize: 12,
      fontWeight: '700',
    },
    metaRow: {
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderRadius: radius.lg,
      flexDirection: 'row',
      marginTop: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    metaItem: {
      flex: 1,
    },
    metaDivider: {
      backgroundColor: colors.border,
      height: 28,
      marginHorizontal: spacing.sm,
      width: 1,
    },
    metaLabel: {
      color: colors.muted,
      fontSize: 11,
      fontWeight: '700',
      textTransform: 'uppercase',
    },
    metaValue: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
      marginTop: 2,
    },
    budgetLink: {
      color: colors.primary,
    },
  });
}
