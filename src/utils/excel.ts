import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import { Expense } from '../types';
import { paymentStats } from './analytics';
import { getMonthLabel } from './date';

async function getNativeFsModules() {
  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  return { FileSystem, Sharing };
}

type ExportResult = {
  fileUri?: string;
  shared: boolean;
};

// Converts a Uint8Array workbook into base64 without blowing the call stack.
function uint8ToBase64(bytes: Uint8Array): string {
  const chunkSize = 0x8000;
  let binary = '';
  for (let i = 0; i < bytes.length; i += chunkSize) {
    const slice = bytes.subarray(i, i + chunkSize);
    binary += String.fromCharCode(...slice);
  }
  return btoa(binary);
}

function safeLocaleDate(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime()) ? iso.slice(0, 10) : date.toLocaleDateString();
}

function safeLocaleTime(iso: string): string {
  const date = new Date(iso);
  return Number.isNaN(date.getTime())
    ? ''
    : date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
}

// Builds a workbook from expenses and exports it as .xlsx.
export async function exportExpensesToExcel(
  expenses: Expense[],
  monthlyBudget: number
): Promise<ExportResult> {
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const transactionRows = sorted.map((item) => ({
    Date: safeLocaleDate(item.date),
    Time: safeLocaleTime(item.date),
    Merchant: item.merchant ?? '',
    Category: item.category,
    Subcategory: item.subcategory ?? '',
    Type: item.type === 'withdrawal' ? 'Withdrawal' : 'Expense',
    Method: item.method === 'cash' ? 'Cash' : 'Debit',
    'Amount (IDR)': Math.round(item.amount),
    Source: item.source,
    Note: item.note ?? '',
  }));

  const stats = paymentStats(expenses);
  const { totalSpent, cashSpent, debitSpent, withdrawn, cashOnHand, byCategory, byMonth } = stats;

  const summaryRows: (string | number)[][] = [
    ['Expense Report (IDR)'],
    ['Generated', new Date().toLocaleString()],
    [],
    ['Total transactions', expenses.length],
    ['Total spent (excl. withdrawals)', Math.round(totalSpent)],
    ['Monthly budget', Math.round(monthlyBudget)],
    [],
    ['Payment method', 'Amount (IDR)'],
    ['Spent by debit', Math.round(debitSpent)],
    ['Spent by cash', Math.round(cashSpent)],
    ['Total cash withdrawn', Math.round(withdrawn)],
    ['Cash on hand', Math.round(cashOnHand)],
    [],
    ['Spending by category', 'Amount (IDR)'],
    ...Object.entries(byCategory)
      .sort((a, b) => b[1] - a[1])
      .map(([name, amount]) => [name, Math.round(amount)]),
    [],
    ['Spending by month', 'Amount (IDR)'],
    ...Object.entries(byMonth)
      .sort((a, b) => (a[0] < b[0] ? 1 : -1))
      .map(([key, amount]) => [getMonthLabel(key), Math.round(amount)]),
  ];

  const workbook = XLSX.utils.book_new();
  const summarySheet = XLSX.utils.aoa_to_sheet(summaryRows);
  summarySheet['!cols'] = [{ wch: 26 }, { wch: 16 }];
  XLSX.utils.book_append_sheet(workbook, summarySheet, 'Summary');

  const txSheet = XLSX.utils.json_to_sheet(
    transactionRows.length > 0
      ? transactionRows
      : [
          {
            Date: '',
            Time: '',
            Merchant: '',
            Category: '',
            Subcategory: '',
            Type: '',
            Method: '',
            'Amount (IDR)': '',
            Source: '',
            Note: '',
          },
        ]
  );
  txSheet['!cols'] = [
    { wch: 12 },
    { wch: 8 },
    { wch: 26 },
    { wch: 14 },
    { wch: 14 },
    { wch: 11 },
    { wch: 8 },
    { wch: 14 },
    { wch: 10 },
    { wch: 28 },
  ];
  XLSX.utils.book_append_sheet(workbook, txSheet, 'Transactions');

  const fileName = `expenses-${new Date().toISOString().slice(0, 10)}.xlsx`;

  if (Platform.OS === 'web') {
    XLSX.writeFile(workbook, fileName);
    return { shared: true };
  }

  const bytes = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' }) as Uint8Array;
  const base64 = uint8ToBase64(bytes);
  const { FileSystem, Sharing } = await getNativeFsModules();

  const directory = FileSystem.documentDirectory ?? FileSystem.cacheDirectory;
  if (!directory) {
    throw new Error('No writable directory available on this device.');
  }

  const fileUri = `${directory}${fileName}`;

  try {
    const info = await FileSystem.getInfoAsync(fileUri);
    if (info.exists) {
      await FileSystem.deleteAsync(fileUri, { idempotent: true });
    }
  } catch {
    // Ignore cleanup errors and attempt a fresh write.
  }

  await FileSystem.writeAsStringAsync(fileUri, base64, { encoding: 'base64' });

  const canShare = await Sharing.isAvailableAsync();
  if (canShare) {
    await Sharing.shareAsync(fileUri, {
      mimeType: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      dialogTitle: 'Export expenses',
      UTI: 'org.openxmlformats.spreadsheetml.sheet',
    });
    return { fileUri, shared: true };
  }

  return { fileUri, shared: false };
}
