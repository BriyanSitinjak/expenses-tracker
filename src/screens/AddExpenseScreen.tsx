import { NativeStackScreenProps } from '@react-navigation/native-stack';
import React, { useState } from 'react';
import { Alert, Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';
import { Button } from '../components/Button';
import { Card } from '../components/Card';
import { InlineAddRow } from '../components/InlineAddRow';
import { MonthPeriodBanner } from '../components/MonthPeriodBanner';
import { TextInputField } from '../components/TextInputField';
import { WITHDRAWAL_CATEGORY } from '../constants/categories';
import { colorForCategory, colors, radius, spacing } from '../constants/theme';
import { RootStackParamList } from '../navigation/AppNavigator';
import { useBudgetStore } from '../store/budgetStore';
import { PaymentMethod } from '../types';
import { defaultDateForMonth, getMonthLabel, isCurrentMonth, dayKeyToIso } from '../utils/date';
import { formatCurrency } from '../utils/format';

type AddExpenseScreenProps = NativeStackScreenProps<RootStackParamList, 'AddExpense'>;

type Mode = 'expense' | 'withdrawal';

const METHODS: { key: PaymentMethod; label: string; icon: string }[] = [
  { key: 'debit', label: 'Debit', icon: '💳' },
  { key: 'cash', label: 'Cash', icon: '💵' },
];

// Screen to create a new expense or a cash withdrawal (transfer).
export function AddExpenseScreen({ navigation }: AddExpenseScreenProps) {
  const { addExpense, addCategory, addSubcategory, categories, subcategories, cashOnHand, selectedMonthKey } =
    useBudgetStore();

  const [mode, setMode] = useState<Mode>('expense');
  const [amount, setAmount] = useState('');
  const [merchant, setMerchant] = useState('');
  const [note, setNote] = useState('');
  const [method, setMethod] = useState<PaymentMethod>('debit');
  const [category, setCategory] = useState(categories[0] ?? 'Other');
  const [subcategory, setSubcategory] = useState<string | undefined>(undefined);

  const [addingCat, setAddingCat] = useState(false);
  const [newCategory, setNewCategory] = useState('');
  const [addingSub, setAddingSub] = useState(false);
  const [newSub, setNewSub] = useState('');

  const subOptions = subcategories[category] ?? [];
  const viewingCurrentMonth = isCurrentMonth(selectedMonthKey);
  const defaultDate = defaultDateForMonth(selectedMonthKey);

  function expenseDate(): string {
    return dayKeyToIso(defaultDate);
  }

  // Creates + selects a new parent category.
  function handleAddCategory() {
    const created = addCategory(newCategory);
    if (!created) {
      Alert.alert('Invalid name', 'Please type a category name.');
      return;
    }
    setCategory(created);
    setSubcategory(undefined);
    setNewCategory('');
    setAddingCat(false);
  }

  // Creates + selects a new sub-category under the current category.
  function handleAddSub() {
    const created = addSubcategory(category, newSub);
    if (!created) {
      Alert.alert('Invalid name', 'Please type a sub-category name.');
      return;
    }
    setSubcategory(created);
    setNewSub('');
    setAddingSub(false);
  }

  // Validates and saves the transaction, then returns to the dashboard.
  function handleSave() {
    const parsedAmount = Number(amount);
    if (!parsedAmount || parsedAmount <= 0) {
      Alert.alert('Invalid amount', 'Please enter a valid amount greater than 0.');
      return;
    }

    if (mode === 'withdrawal') {
      addExpense({
        amount: parsedAmount,
        category: WITHDRAWAL_CATEGORY,
        merchant: merchant.trim() || 'Cash withdrawal',
        note: note.trim() || undefined,
        source: 'manual',
        method: 'cash',
        type: 'withdrawal',
        date: expenseDate(),
      });
    } else {
      addExpense({
        amount: parsedAmount,
        category,
        subcategory,
        merchant: merchant.trim() || undefined,
        note: note.trim() || undefined,
        source: 'manual',
        method,
        type: 'expense',
        date: expenseDate(),
      });
    }

    navigation.goBack();
  }

  return (
    <ScrollView contentContainerStyle={styles.content} style={styles.container}>
      <View style={styles.segment}>
        {(['expense', 'withdrawal'] as Mode[]).map((item) => {
          const active = item === mode;
          return (
            <Pressable
              key={item}
              onPress={() => setMode(item)}
              style={[styles.segmentBtn, active && styles.segmentActive]}
            >
              <Text style={[styles.segmentText, active && styles.segmentTextActive]}>
                {item === 'expense' ? '🧾  Expense' : '💵  Withdraw cash'}
              </Text>
            </Pressable>
          );
        })}
      </View>

      {mode === 'withdrawal' ? (
        <Text style={styles.hint}>
          Recorded as a transfer (Debit → Cash). Excluded from spending. Cash on hand:{' '}
          {formatCurrency(cashOnHand())}
        </Text>
      ) : null}

      {!viewingCurrentMonth ? (
        <MonthPeriodBanner
          variant="callout"
          message={`You are viewing ${getMonthLabel(selectedMonthKey)}. New entries will be saved in that month.`}
        />
      ) : null}

      <Card>
        <TextInputField
          keyboardType="numeric"
          label="Amount (IDR)"
          onChangeText={setAmount}
          placeholder="e.g. 25000"
          value={amount}
        />

        {mode === 'expense' ? (
          <>
            <Text style={styles.label}>Paid with</Text>
            <View style={styles.methodRow}>
              {METHODS.map((item) => {
                const active = item.key === method;
                return (
                  <Pressable
                    key={item.key}
                    onPress={() => setMethod(item.key)}
                    style={[styles.methodBtn, active && styles.methodActive]}
                  >
                    <Text style={[styles.methodText, active && styles.methodTextActive]}>
                      {item.icon}  {item.label}
                    </Text>
                  </Pressable>
                );
              })}
            </View>
          </>
        ) : null}

        <TextInputField
          label={mode === 'withdrawal' ? 'Label (optional)' : 'Merchant (optional)'}
          onChangeText={setMerchant}
          placeholder={mode === 'withdrawal' ? 'e.g. ATM BCA' : 'e.g. Pertamina, Indomaret'}
          value={merchant}
        />

        {mode === 'expense' ? (
          <>
            <Text style={styles.label}>Category</Text>
            <View style={styles.chipWrap}>
              {categories.map((item) => {
                const active = item === category;
                const color = colorForCategory(item);
                return (
                  <Pressable
                    key={item}
                    onPress={() => {
                      setCategory(item);
                      setSubcategory(undefined);
                      setAddingSub(false);
                    }}
                    style={[
                      styles.chip,
                      active && { backgroundColor: color + '22', borderColor: color },
                    ]}
                  >
                    <View style={[styles.chipDot, { backgroundColor: color }]} />
                    <Text style={[styles.chipText, active && { color, fontWeight: '800' }]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => setAddingCat((v) => !v)} style={styles.addChip}>
                <Text style={styles.addChipText}>{addingCat ? '× Cancel' : '+ New'}</Text>
              </Pressable>
            </View>

            <InlineAddRow
              visible={addingCat}
              value={newCategory}
              onChangeText={setNewCategory}
              onSubmit={handleAddCategory}
              placeholder="New category name"
            />

            <Text style={styles.label}>Sub-category (optional)</Text>
            <View style={styles.chipWrap}>
              {subOptions.map((item) => {
                const active = item === subcategory;
                return (
                  <Pressable
                    key={item}
                    onPress={() => setSubcategory(active ? undefined : item)}
                    style={[styles.subChip, active && styles.subChipActive]}
                  >
                    <Text style={[styles.subChipText, active && styles.subChipTextActive]}>
                      {item}
                    </Text>
                  </Pressable>
                );
              })}
              <Pressable onPress={() => setAddingSub((v) => !v)} style={styles.addChip}>
                <Text style={styles.addChipText}>{addingSub ? '× Cancel' : '+ New'}</Text>
              </Pressable>
            </View>

            <InlineAddRow
              visible={addingSub}
              value={newSub}
              onChangeText={setNewSub}
              onSubmit={handleAddSub}
              placeholder={`New sub-category in ${category}`}
            />
          </>
        ) : null}

        <TextInputField
          label="Note (optional)"
          onChangeText={setNote}
          placeholder={mode === 'withdrawal' ? 'e.g. for weekly spending' : 'e.g. lunch with team'}
          value={note}
        />

        <Button
          icon={mode === 'withdrawal' ? '💵' : '💾'}
          label={mode === 'withdrawal' ? 'Save Withdrawal' : 'Save Expense'}
          onPress={handleSave}
        />
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
  segment: {
    flexDirection: 'row',
    backgroundColor: colors.bgElevated,
    borderRadius: radius.lg,
    borderWidth: 1,
    borderColor: colors.border,
    padding: 4,
    marginBottom: spacing.md,
  },
  segmentBtn: {
    flex: 1,
    paddingVertical: spacing.sm,
    alignItems: 'center',
    borderRadius: radius.md,
  },
  segmentActive: {
    backgroundColor: colors.primary,
  },
  segmentText: {
    color: colors.subText,
    fontWeight: '700',
  },
  segmentTextActive: {
    color: '#FFFFFF',
  },
  hint: {
    color: colors.subText,
    fontSize: 13,
    marginBottom: spacing.md,
    lineHeight: 18,
  },
  label: {
    color: colors.subText,
    fontWeight: '600',
    marginBottom: spacing.sm,
  },
  methodRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  methodBtn: {
    flex: 1,
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: colors.bgElevated,
  },
  methodActive: {
    borderColor: colors.primary,
    backgroundColor: colors.primary + '22',
  },
  methodText: {
    color: colors.text,
    fontWeight: '700',
  },
  methodTextActive: {
    color: colors.primary,
  },
  chipWrap: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  chipDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  chipText: {
    color: colors.text,
  },
  subChip: {
    backgroundColor: colors.bgElevated,
    borderColor: colors.border,
    borderRadius: radius.pill,
    borderWidth: 1,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  subChipActive: {
    backgroundColor: colors.accent + '22',
    borderColor: colors.accent,
  },
  subChipText: {
    color: colors.subText,
  },
  subChipTextActive: {
    color: colors.accent,
    fontWeight: '800',
  },
  addChip: {
    backgroundColor: 'transparent',
    borderColor: colors.primary,
    borderWidth: 1,
    borderStyle: 'dashed',
    borderRadius: radius.pill,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  addChipText: {
    color: colors.primary,
    fontWeight: '800',
  },
});
