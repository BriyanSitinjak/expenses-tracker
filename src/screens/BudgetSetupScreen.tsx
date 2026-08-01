import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useMemo, useState } from 'react';
import { Alert, Pressable, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TextInputField } from '../components/TextInputField';
import { ThemeColors, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import {
  formatAmountInput,
  formatCompact,
  parseAmountInput,
  stripAmountInput,
} from '../utils/format';

type BudgetSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'BudgetSetup'>;

const PRESETS = [1_000_000, 2_000_000, 3_000_000, 5_000_000, 10_000_000];

// Screen to set or update monthly budget quota.
export function BudgetSetupScreen({ navigation }: BudgetSetupScreenProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const { monthlyBudget, setMonthlyBudget } = useBudgetStore();
  const [budgetInput, setBudgetInput] = useState(
    monthlyBudget ? formatAmountInput(String(Math.round(monthlyBudget))) : ''
  );

  function handleAmountChange(text: string) {
    const digits = stripAmountInput(text);
    setBudgetInput(digits ? formatAmountInput(digits) : '');
  }

  // Handles budget save action with basic validation.
  function handleSaveBudget() {
    const parsed = parseAmountInput(budgetInput);

    if (!parsed || parsed <= 0) {
      Alert.alert('Invalid budget', 'Please enter a valid amount greater than 0.');
      return;
    }

    setMonthlyBudget(parsed);
    navigation.goBack();
  }

  return (
    <View style={styles.container}>
      <Card>
        <Text style={styles.title}>Set your monthly budget</Text>
        <Text style={styles.subtitle}>
          We&apos;ll track your spending against this amount each month.
        </Text>
        <TextInputField
          keyboardType="numeric"
          label="Budget amount (IDR)"
          onChangeText={handleAmountChange}
          placeholder="e.g. 3.000.000"
          value={budgetInput}
        />

        <View style={styles.presets}>
          {PRESETS.map((preset) => (
            <Pressable
              key={preset}
              onPress={() => setBudgetInput(formatAmountInput(String(preset)))}
              style={styles.preset}
            >
              <Text style={styles.presetText}>{formatCompact(preset)}</Text>
            </Pressable>
          ))}
        </View>

        <Button icon="checkmark" label="Save Budget" onPress={handleSaveBudget} />
      </Card>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    container: {
      backgroundColor: colors.bg,
      flex: 1,
      padding: spacing.lg,
    },
    title: {
      color: colors.text,
      fontSize: 20,
      fontWeight: '800',
      marginBottom: spacing.xs,
    },
    subtitle: {
      color: colors.subText,
      marginBottom: spacing.lg,
    },
    presets: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      gap: spacing.sm,
      marginBottom: spacing.lg,
    },
    preset: {
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
      borderWidth: 1,
      borderRadius: radius.pill,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    presetText: {
      color: colors.text,
      fontWeight: '700',
    },
  });
}
