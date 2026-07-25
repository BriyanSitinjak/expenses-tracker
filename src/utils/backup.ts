import { Platform } from 'react-native';
import { Expense } from '../types';

export const BACKUP_CSV_HEADERS = [
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

export type BackupRow = {
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

type ExportResult = {
  fileUri?: string;
  shared: boolean;
};

function escapeCsvField(value: string): string {
  if (/[",\n\r]/.test(value)) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
}

// Flat row shape used by both CSV and Excel backup exports.
export function expenseToBackupRow(item: Expense): BackupRow {
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

export function expensesToBackupRows(expenses: Expense[]): BackupRow[] {
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
export function buildBackupCsv(expenses: Expense[]): string {
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

async function getNativeFsModules() {
  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  return { FileSystem, Sharing };
}

// Exports transactions as a shareable CSV backup file.
export async function exportTransactionsBackup(
  expenses: Expense[],
  onProgress?: (message: string) => void
): Promise<ExportResult> {
  onProgress?.('Building CSV backup…');
  const csv = buildBackupCsv(expenses);
  const fileName = `expenses-backup-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    onProgress?.('Downloading CSV file…');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return { shared: true };
  }

  onProgress?.('Saving file…');
  const { FileSystem, Sharing } = await getNativeFsModules();
  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error('No writable directory available on this device.');
  }
  const fileUri = `${directory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    onProgress?.('Opening share sheet…');
    await Sharing.shareAsync(fileUri, {
      mimeType: 'text/csv',
      dialogTitle: 'Export backup',
      UTI: 'public.comma-separated-values-text',
    });
    return { fileUri, shared: true };
  }

  return { fileUri, shared: false };
}

// Returns true when CSV headers match the app's backup export format.
export function isBackupCsv(text: string): boolean {
  const firstLine = text.trim().split(/\r?\n/)[0] ?? '';
  const headers = firstLine.split(',').map((cell) => cell.trim());
  return isBackupHeaders(headers);
}
