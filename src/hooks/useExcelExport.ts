import { useState } from 'react';
import { Alert } from 'react-native';
import { useBudgetStore } from '../store/budgetStore';
import { exportTransactionsBackup } from '../utils/backup';
import { exportExpensesToExcel } from '../utils/excel';

function guardEmpty(expenses: { length: number }): boolean {
  if (expenses.length === 0) {
    Alert.alert('Nothing to export', 'Add or import some transactions first.');
    return true;
  }
  return false;
}

// Shared export flows for Excel reports and re-importable CSV backups.
export function useExcelExport() {
  const expenses = useBudgetStore((state) => state.expenses);
  const monthlyBudget = useBudgetStore((state) => state.monthlyBudget);
  const [exporting, setExporting] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);

  async function exportExpenses() {
    if (guardEmpty(expenses)) return;
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

  async function exportBackup() {
    if (guardEmpty(expenses)) return;
    try {
      setExportingBackup(true);
      const result = await exportTransactionsBackup(expenses);
      if (!result.shared) {
        Alert.alert('Saved', `Backup saved to:\n${result.fileUri}`);
      }
    } catch (error) {
      Alert.alert('Export failed', String(error instanceof Error ? error.message : error));
    } finally {
      setExportingBackup(false);
    }
  }

  return { exporting, exportingBackup, exportExpenses, exportBackup };
}
