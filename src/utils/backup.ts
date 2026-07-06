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

// Builds a CSV backup that preserves all transaction fields for re-import.
export function buildBackupCsv(expenses: Expense[]): string {
  const header = BACKUP_CSV_HEADERS.join(',');
  const rows = [...expenses]
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((item) =>
      [
        item.date,
        Math.round(item.amount),
        escapeCsvField(item.category),
        escapeCsvField(item.subcategory ?? ''),
        escapeCsvField(item.merchant ?? ''),
        item.type,
        item.method,
        item.source,
        escapeCsvField(item.note ?? ''),
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
export async function exportTransactionsBackup(expenses: Expense[]): Promise<ExportResult> {
  const csv = buildBackupCsv(expenses);
  const fileName = `expenses-backup-${new Date().toISOString().slice(0, 10)}.csv`;

  if (Platform.OS === 'web') {
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = fileName;
    link.click();
    URL.revokeObjectURL(url);
    return { shared: true };
  }

  const { FileSystem, Sharing } = await getNativeFsModules();
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;
  await FileSystem.writeAsStringAsync(fileUri, csv, {
    encoding: FileSystem.EncodingType.UTF8,
  });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
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
  const firstLine = text.trim().split(/\r?\n/)[0]?.toLowerCase() ?? '';
  const headers = firstLine.split(',').map((cell) => cell.trim());
  return BACKUP_CSV_HEADERS.every((header, index) => headers[index] === header);
}
