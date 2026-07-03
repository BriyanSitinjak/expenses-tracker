import { useState } from 'react';
import { Alert } from 'react-native';
import { useBudgetStore } from '../store/budgetStore';
import { exportExpensesToExcel } from '../utils/excel';

// Shared Excel export flow: guards empty data, tracks loading, reports result.
export function useExcelExport() {
  const expenses = useBudgetStore((state) => state.expenses);
  const monthlyBudget = useBudgetStore((state) => state.monthlyBudget);
  const [exporting, setExporting] = useState(false);

  async function exportExpenses() {
    if (expenses.length === 0) {
      Alert.alert('Nothing to export', 'Add or import some transactions first.');
      return;
    }
    try {
      setExporting(true);
      const result = await exportExpensesToExcel(expenses, monthlyBudget);
      if (!result.shared) {
        Alert.alert('Saved', `Excel file saved to:\n${result.fileUri}`);
      }
    } catch (error) {
      Alert.alert('Export failed', String(error instanceof Error ? error.message : error));
    } finally {
      setExporting(false);
    }
  }

  return { exporting, exportExpenses };
}
