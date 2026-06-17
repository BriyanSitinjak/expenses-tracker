import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { TextInputField } from '../components/TextInputField';
import { CATEGORIES } from '../constants/categories';
import { colors, radius, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';

type AddExpenseScreenProps = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

// Screen to create a new expense transaction entry.
export function AddExpenseScreen({ navigation }: AddExpenseScreenProps) {
  const { addExpense } = useBudgetStore();
  const [amount, setAmount] = useState('');
  const [note, setNote] = useState('');
  const [category, setCategory] = useState(CATEGORIES[0]);

  // Handles save action for a new expense with validation.
  function handleSaveExpense() {
    const parsedAmount = Number(amount);

    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    addExpense({
      amount: parsedAmount,
      category,
      note: note.trim() || undefined,
    });

    navigation.goBack();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <Card>
        <TextInputField
          keyboardType="numeric"
          label="Amount"
          onChangeText={setAmount}
          placeholder="e.g. 12.50"
          value={amount}
        />

        <Text style={styles.label}>Category</Text>
        <View style={styles.categoryWrap}>
          {CATEGORIES.map((item) => {
            const active = item === category;

            return (
              <Pressable
                key={item}
                onPress={() => setCategory(item)}
                style={[styles.chip, active && styles.chipActive]}
              >
                <Text style={[styles.chipText, active && styles.chipTextActive]}>{item}</Text>
              </Pressable>
            );
          })}
        </View>

        <TextInputField
          label="Note (optional)"
          onChangeText={setNote}
          placeholder="Lunch with team"
          value={note}
        />

        <Button label="Save Expense" onPress={handleSaveExpense} />
      </Card>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    backgroundColor: colors.bg,
    flex: 1,
  },
  content: {
    padding: spacing.lg,
  },
  label: {
    color: colors.subText,
    fontWeight: '600',
    marginBottom: spacing.xs,
  },
  categoryWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    backgroundColor: '#FFFFFF',
    borderColor: colors.border,
    borderRadius: radius.md,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
  },
  chipActive: {
    backgroundColor: '#EFF6FF',
    borderColor: colors.primary,
  },
  chipText: {
    color: colors.text,
  },
  chipTextActive: {
    color: colors.primary,
    fontWeight: '700',
  },
});
