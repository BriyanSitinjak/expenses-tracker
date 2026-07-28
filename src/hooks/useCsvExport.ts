import { useCallback, useState } from 'react';
import { Alert } from 'react-native';
import { useBudgetStore } from '../store/budgetStore';
import { exportTransactionsBackup } from '../utils/backup';
import {
  describeTransferError,
  preloadTransferModules,
  TransferProgressUpdate,
  TransferStatus,
  yieldToUI,
} from '../utils/transfer';

function guardEmpty(expenses: { length: number }): boolean {
  if (expenses.length === 0) {
    Alert.alert('Nothing to export', 'Add or import some transactions first.');
    return true;
  }
  return false;
}

// CSV-only export (fast, re-importable).
export function useCsvExport() {
  const expenses = useBudgetStore((state) => state.expenses);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState<TransferStatus>(null);

  const showProgress = useCallback((update: TransferProgressUpdate) => {
    setProgress({
      title: 'Exporting CSV',
      message: update.message,
      step: update.step,
      totalSteps: update.totalSteps,
    });
  }, []);

  const clearProgress = useCallback(async () => {
    setProgress(null);
    await yieldToUI(40);
  }, []);

  async function exportCsv() {
    if (guardEmpty(expenses) || busy) return;
    try {
      setBusy(true);
      preloadTransferModules();
      showProgress({
        step: 1,
        totalSteps: 2,
        message: 'Starting export…',
      });
      await yieldToUI(24);
      const result = await exportTransactionsBackup(expenses, {
        onProgress: showProgress,
        onBeforeShare: clearProgress,
      });
      await clearProgress();
      if (!result.shared && !result.dismissed) {
        Alert.alert(
          'CSV saved',
          `Sharing is unavailable on this device, so the file was saved locally:\n${result.fileUri}`
        );
      }
    } catch (error) {
      await clearProgress();
      Alert.alert(
        'CSV export failed',
        describeTransferError(
          error,
          'Something went wrong while building or sharing the CSV backup. Please try again.'
        )
      );
    } finally {
      setBusy(false);
      setProgress(null);
    }
  }

  return {
    busy,
    exportCsv,
    progress,
  };
}
