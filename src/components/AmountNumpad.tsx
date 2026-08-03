import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { appendAmountDigits, deleteAmountDigit } from '../utils/format';
import { Icon } from './Icon';

type AmountNumpadProps = {
  label?: string;
  value: string;
  onChange: (value: string) => void;
};

type Key = string | 'back';

const ROWS: Key[][] = [
  ['1', '2', '3'],
  ['4', '5', '6'],
  ['7', '8', '9'],
  ['00', '0', '000'],
];

// Custom IDR amount numpad with 00 / 000 keys built into the grid.
export function AmountNumpad({
  label = 'Amount (IDR)',
  value,
  onChange,
}: AmountNumpadProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  function handleKey(key: Key) {
    if (key === 'back') {
      onChange(deleteAmountDigit(value));
      return;
    }
    onChange(appendAmountDigits(value, key));
  }

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>

      <View style={styles.display}>
        <Text style={[styles.amount, !value && styles.amountPlaceholder]} numberOfLines={1}>
          {value || '0'}
        </Text>
        <Pressable
          accessibilityLabel="Delete last digit"
          accessibilityRole="button"
          hitSlop={8}
          onLongPress={() => onChange('')}
          onPress={() => handleKey('back')}
          style={({ pressed }) => [styles.backBtn, pressed && styles.keyPressed]}
        >
          <Icon name="backspace-outline" size={22} color={colors.text} />
        </Pressable>
      </View>

      <View style={styles.pad}>
        {ROWS.map((row) => (
          <View key={row.join('-')} style={styles.row}>
            {row.map((key) => (
              <Pressable
                key={key}
                accessibilityLabel={`Key ${key}`}
                accessibilityRole="button"
                onPress={() => handleKey(key)}
                style={({ pressed }) => [styles.key, pressed && styles.keyPressed]}
              >
                <Text style={styles.keyLabel}>{key}</Text>
              </Pressable>
            ))}
          </View>
        ))}
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.subText,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    display: {
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      flexDirection: 'row',
      marginBottom: spacing.sm,
      minHeight: 56,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    amount: {
      color: colors.text,
      flex: 1,
      fontSize: 28,
      fontWeight: '800',
      letterSpacing: -0.3,
    },
    amountPlaceholder: {
      color: colors.muted,
    },
    backBtn: {
      alignItems: 'center',
      borderRadius: radius.sm,
      height: 40,
      justifyContent: 'center',
      width: 40,
    },
    pad: {
      gap: spacing.xs,
    },
    row: {
      flexDirection: 'row',
      gap: spacing.xs,
    },
    key: {
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      flex: 1,
      justifyContent: 'center',
      minHeight: 48,
      paddingVertical: spacing.sm,
    },
    keyPressed: {
      backgroundColor: colors.cardAlt,
      opacity: 0.9,
    },
    keyLabel: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
    },
  });
}
