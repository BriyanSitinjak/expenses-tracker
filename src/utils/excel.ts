import { Platform } from 'react-native';
import * as XLSX from 'xlsx';
import { Expense } from '../types';
import { paymentStats } from './analytics';
import { getMonthLabel } from './date';

// Lazily-imported native modules so web builds don't choke on them.
async function getNativeFsModules() {
  const FileSystem = await import('expo-file-system/legacy');
  const Sharing = await import('expo-sharing');
  return { FileSystem, Sharing };
}

type ExportResult = {
  fileUri?: string;
  shared: boolean;
};

// Builds a styled-ish workbook from expenses and exports it as .xlsx.
export async function exportExpensesToExcel(
  expenses: Expense[],
  monthlyBudget: number
): Promise<ExportResult> {
  const sorted = [...expenses].sort(
    (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
  );

  const transactionRows = sorted.map((item) => ({
    Date: new Date(item.date).toLocaleDateString(),
    Time: new Date(item.date).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    Merchant: item.merchant ?? '',
    Category: item.category,
    Subcategory: item.subcategory ?? '',
    Type: item.type === 'withdrawal' ? 'Withdrawal' : 'Expense',
    Method: item.method === 'cash' ? 'Cash' : 'Debit',
    'Amount (IDR)': Math.round(item.amount),
    Source: item.source,
    Note: item.note ?? '',
  }));

  // Only real spending counts toward totals; withdrawals are transfers.
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

  const base64 = XLSX.write(workbook, { type: 'base64', bookType: 'xlsx' });
  const { FileSystem, Sharing } = await getNativeFsModules();
  const fileUri = `${FileSystem.documentDirectory}${fileName}`;

  await FileSystem.writeAsStringAsync(fileUri, base64, {
    encoding: FileSystem.EncodingType.Base64,
  });

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
