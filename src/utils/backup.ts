import { Platform } from 'react-native';
import { Expense } from '../types';
import {
  ExportResult,
  preloadTransferModules,
  reportTransferProgress,
  resolveExportDirectory,
  shareExportFile,
  TransferProgress,
  writeExportFile,
  yieldToUI,
} from './transfer';

const BACKUP_CSV_HEADERS = [
  'date',
  'amount',
  'category',
  'subcategory',
  'merchant',
  'type',
  'method',
  'source',
  'note',
] as const;

type BackupRow = {
  date: string;
  amount: number;
  category: string;
  subcategory: string;
  merchant: string;
  type: string;
  method: string;
  source: string;
  note: string;
};

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

function expenseToBackupRow(item: Expense): BackupRow {
  return {
    date: item.date,
    amount: Math.round(item.amount),
    category: item.category,
    subcategory: item.subcategory ?? '',
    merchant: item.merchant ?? '',
    type: item.type,
    method: item.method,
    source: item.source,
    note: item.note ?? '',
  };
}

function expensesToBackupRows(expenses: Expense[]): BackupRow[] {
  return [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(expenseToBackupRow);
}

// Returns true when headers match the app's backup export format (order-sensitive).
export function isBackupHeaders(headers: string[]): boolean {
  const normalized = headers.map((header) => header.trim().toLowerCase());
  return BACKUP_CSV_HEADERS.every((header, index) => normalized[index] === header);
}

// Builds a CSV backup that preserves all transaction fields for re-import.
function buildBackupCsv(expenses: Expense[]): string {
  const header = BACKUP_CSV_HEADERS.join(',');
  const rows = expensesToBackupRows(expenses).map((item) =>
    [
      item.date,
      item.amount,
      escapeCsvField(item.category),
      escapeCsvField(item.subcategory),
      escapeCsvField(item.merchant),
      item.type,
      item.method,
      item.source,
      escapeCsvField(item.note),
    ].join(',')
  );

  return [header, ...rows].join('\n');
}

type BackupExportOptions = {
  onProgress?: TransferProgress;
  onBeforeShare?: () => void | Promise<void>;
};

const CSV_STEPS = 2;

// Exports transactions as a shareable CSV backup file.
export async function exportTransactionsBackup(
  expenses: Expense[],
  options: BackupExportOptions = {}
): Promise<ExportResult> {
  const { onProgress, onBeforeShare } = options;
  preloadTransferModules();

  await reportTransferProgress(onProgress, {
    step: 1,
    totalSteps: CSV_STEPS,
    message: `Building CSV for ${expenses.length} transaction${expenses.length === 1 ? '' : 's'}…`,
  });
  const csv = buildBackupCsv(expenses);
  const fileName = `expenses-backup-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    await reportTransferProgress(onProgress, {
      step: CSV_STEPS,
      totalSteps: CSV_STEPS,
      message: 'Downloading CSV file…',
    });
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return { shared: true };
  }

  await reportTransferProgress(onProgress, {
    step: 2,
    totalSteps: CSV_STEPS,
    message: 'Saving file…',
  });
  const directory = await resolveExportDirectory();
  const fileUri = `${directory}${fileName}`;
  await writeExportFile(fileUri, csv, 'utf8');

  await onBeforeShare?.();
  await yieldToUI(40);

  const shareStatus = await shareExportFile(fileUri, {
    mimeType: 'text/csv',
    dialogTitle: 'Export backup',
    UTI: 'public.comma-separated-values-text',
  });

  if (shareStatus === 'unavailable') return { fileUri, shared: false };
  if (shareStatus === 'dismissed') return { fileUri, shared: false, dismissed: true };
  return { fileUri, shared: true };
}

// Returns true when CSV headers match the app's backup export format.
export function isBackupCsv(text: string): boolean {
  const firstLine = text.trim().split(/\r?\n/)[0] ?? '';
  const headers = firstLine.split(',').map((cell) => cell.trim());
  return isBackupHeaders(headers);
}
