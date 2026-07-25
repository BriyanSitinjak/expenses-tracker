import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useBudgetStore } from '../store/budgetStore';
import { exportTransactionsBackup } from '../utils/backup';
import { exportExpensesToExcel } from '../utils/excel';
import { describeTransferError, yieldToUI } from '../utils/transfer';

export type ExportProgress = {
  title: string;
  message: string;
} | null;

function guardEmpty(expenses: { length: number }): boolean {
  if (expenses.length === 0) {
    Alert.alert('Nothing to export', 'Add or import some transactions first.');
    return true;
  }
  return false;
}

// Shared export flows for re-importable Excel (.xlsx) and CSV backups.
export function useExcelExport() {
  const expenses = useBudgetStore((state) => state.expenses);
  const monthlyBudget = useBudgetStore((state) => state.monthlyBudget);
  const [exporting, setExporting] = useState(false);
  const [exportingBackup, setExportingBackup] = useState(false);
  const [progress, setProgress] = useState<ExportProgress>(null);

  const showProgress = useCallback((title: string, message: string) => {
    setProgress({ title, message });
  }, []);

  const clearProgress = useCallback(() => {
    setProgress(null);
  }, []);

  async function exportExpenses() {
    if (guardEmpty(expenses)) return;
    try {
      setExporting(true);
      showProgress('Exporting Excel', 'Preparing your spreadsheet…');
      await yieldToUI();
      const result = await exportExpensesToExcel(expenses, monthlyBudget, (message) => {
        showProgress('Exporting Excel', message);
      });
      clearProgress();
      if (!result.shared) {
        Alert.alert(
          'Excel saved',
          `Sharing is unavailable on this device, so the file was saved locally:\n${result.fileUri}`
        );
      }
    } catch (error) {
      clearProgress();
      Alert.alert(
        'Excel export failed',
        describeTransferError(
          error,
          'Something went wrong while building or sharing the Excel file. Please try again.'
        )
      );
    } finally {
      setExporting(false);
      clearProgress();
    }
  }

  async function exportBackup() {
    if (guardEmpty(expenses)) return;
    try {
      setExportingBackup(true);
      showProgress('Exporting CSV', 'Preparing your backup…');
      await yieldToUI();
      const result = await exportTransactionsBackup(expenses, (message) => {
        showProgress('Exporting CSV', message);
      });
      clearProgress();
      if (!result.shared) {
        Alert.alert(
          'CSV saved',
          `Sharing is unavailable on this device, so the file was saved locally:\n${result.fileUri}`
        );
      }
    } catch (error) {
      clearProgress();
      Alert.alert(
        'CSV export failed',
        describeTransferError(
          error,
          'Something went wrong while building or sharing the CSV backup. Please try again.'
        )
      );
    } finally {
      setExportingBackup(false);
      clearProgress();
    }
  }

  return {
    exporting,
    exportingBackup,
    exportExpenses,
    exportBackup,
    progress,
  };
}
