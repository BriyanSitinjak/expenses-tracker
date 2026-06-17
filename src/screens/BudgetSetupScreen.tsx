import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TextInputField } from '../components/TextInputField';
import { colors, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';

type BudgetSetupScreenProps = NativeStackScreenProps<RootStackParamList, 'BudgetSetup'>;

// Screen to set or update monthly budget quota.
export function BudgetSetupScreen({ navigation }: BudgetSetupScreenProps) {
  const { monthlyBudget, setMonthlyBudget } = useBudgetStore();
  const [budgetInput, setBudgetInput] = useState(monthlyBudget ? String(monthlyBudget) : '');

  // Handles budget save action with basic validation.
  function handleSaveBudget() {
    const parsed = Number(budgetInput);

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
        <TextInputField
          keyboardType="numeric"
          label="Budget amount"
          onChangeText={setBudgetInput}
          placeholder="e.g. 5000"
          value={budgetInput}
        />
        <Button label="Save Budget" onPress={handleSaveBudget} />
      </Card>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
    padding: spacing.lg,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '700',
    marginBottom: spacing.md,
  },
});
