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

function backupRowToCsvLine(item: BackupRow): string {
  return [
    item.date,
    item.amount,
    escapeCsvField(item.category),
    escapeCsvField(item.subcategory),
    escapeCsvField(item.merchant),
    item.type,
    item.method,
    item.source,
    escapeCsvField(item.note),
  ].join(',');
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
  const rows = expensesToBackupRows(expenses).map(backupRowToCsvLine);
  return [header, ...rows].join('\n');
}

// Local calendar day as YYYY-MM-DD for easy editing in Sheets/Excel.
function dayKey(offset = 0): string {
  const d = new Date();
  d.setDate(d.getDate() - offset);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(
    d.getDate()
  ).padStart(2, '0')}`;
}

// Blank-ready CSV template with example rows matching the app import format.
export function buildImportTemplateCsv(): string {
  const header = BACKUP_CSV_HEADERS.join(',');
  const examples: BackupRow[] = [
    {
      date: dayKey(0),
      amount: 45000,
      category: 'Food',
      subcategory: 'Coffee',
      merchant: 'Kopi Kenangan',
      type: 'expense',
      method: 'debit',
      source: 'manual',
      note: 'Morning coffee — replace or delete these example rows',
    },
    {
      date: dayKey(1),
      amount: 154000,
      category: 'Groceries',
      subcategory: '',
      merchant: 'Indomaret',
      type: 'expense',
      method: 'cash',
      source: 'manual',
      note: '',
    },
    {
      date: dayKey(2),
      amount: 500000,
      category: 'Cash Withdrawal',
      subcategory: '',
      merchant: 'ATM BCA',
      type: 'withdrawal',
      method: 'cash',
      source: 'manual',
      note: 'Transfers use type=withdrawal (excluded from spending)',
    },
  ];

  return [header, ...examples.map(backupRowToCsvLine)].join('\n');
}

type BackupExportOptions = {
  onProgress?: TransferProgress;
  onBeforeShare?: () => void | Promise<void>;
};

const CSV_STEPS = 2;

async function shareCsvFile(
  csv: string,
  fileName: string,
  dialogTitle: string,
  options: BackupExportOptions & { prepareMessage?: string } = {}
): Promise<ExportResult> {
  const { onProgress, onBeforeShare, prepareMessage } = options;
  preloadTransferModules();

  await reportTransferProgress(onProgress, {
    step: 1,
    totalSteps: CSV_STEPS,
    message: prepareMessage ?? 'Preparing CSV…',
  });

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
    dialogTitle,
    UTI: 'public.comma-separated-values-text',
  });

  if (shareStatus === 'unavailable') return { fileUri, shared: false };
  if (shareStatus === 'dismissed') return { fileUri, shared: false, dismissed: true };
  return { fileUri, shared: true };
}

// Exports transactions as a shareable CSV backup file.
export async function exportTransactionsBackup(
  expenses: Expense[],
  options: BackupExportOptions = {}
): Promise<ExportResult> {
  const csv = buildBackupCsv(expenses);
  const fileName = `expenses-backup-${new Date().toISOString().slice(0, 10)}.csv`;
  return shareCsvFile(csv, fileName, 'Export backup', {
    ...options,
    prepareMessage: `Building CSV for ${expenses.length} transaction${
      expenses.length === 1 ? '' : 's'
    }…`,
  });
}

// Shares a fillable CSV template for manual imports.
export async function exportImportTemplate(
  options: BackupExportOptions = {}
): Promise<ExportResult> {
  const csv = buildImportTemplateCsv();
  return shareCsvFile(csv, 'expenses-import-template.csv', 'CSV import template', {
    ...options,
    prepareMessage: 'Building import template…',
  });
}

// Returns true when CSV headers match the app's backup export format.
export function isBackupCsv(text: string): boolean {
  const firstLine = text.trim().split(/\r?\n/)[0] ?? '';
  const headers = firstLine.split(',').map((cell) => cell.trim());
  return isBackupHeaders(headers);
}
