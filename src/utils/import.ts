import { autoCategory, isWithdrawal, WITHDRAWAL_CATEGORY } from '../constants/categories';
import { DraftExpense, ExpenseSource, PaymentMethod, TxType } from '../types';
import { isBackupCsv } from './backup';
import { parseFlexibleDate } from './date';

// Minimal CSV parser that handles quoted fields and embedded commas.
function parseCsv(text: string): string[][] {
  const rows: string[][] = [];
  let row: string[] = [];
  let field = '';
  let inQuotes = false;

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    const next = text[i + 1];

    if (inQuotes) {
      if (char === '"' && next === '"') {
        field += '"';
        i += 1;
      } else if (char === '"') {
        inQuotes = false;
      } else {
        field += char;
      }
      continue;
    }

    if (char === '"') {
      inQuotes = true;
    } else if (char === ',') {
      row.push(field);
      field = '';
    } else if (char === '\n' || char === '\r') {
      if (char === '\r' && next === '\n') i += 1;
      row.push(field);
      rows.push(row);
      row = [];
      field = '';
    } else {
      field += char;
    }
  }

  if (field.length > 0 || row.length > 0) {
    row.push(field);
    rows.push(row);
  }

  return rows.filter((cells) => cells.some((cell) => cell.trim() !== ''));
}

// Parses a money string into a number, handling symbols, separators and parentheses.
function parseAmount(raw: string): number {
  if (!raw) return NaN;
  let value = raw.trim();
  const negativeByParens = /^\(.*\)$/.test(value);
  value = value.replace(/[()]/g, '');
  const negativeBySign = value.includes('-');
  value = value.replace(/[^0-9.,]/g, '');

  if (value.includes('.') && value.includes(',')) {
    // Assume comma = thousands separator, dot = decimal.
    value = value.replace(/,/g, '');
  } else if (value.includes(',') && !value.includes('.')) {
    const parts = value.split(',');
    if (parts[parts.length - 1].length === 2) {
      // Comma used as decimal separator.
      value = value.replace(/,/g, '.');
    } else {
      value = value.replace(/,/g, '');
    }
  }

  const num = parseFloat(value);
  if (Number.isNaN(num)) return NaN;
  return negativeByParens || negativeBySign ? -Math.abs(num) : num;
}

// Finds the first column index whose header matches any of the keywords.
function findColumn(headers: string[], keywords: string[]): number {
  return headers.findIndex((header) => keywords.some((keyword) => header.includes(keyword)));
}

export type ImportFormat = 'bank' | 'backup';

export type ParseReport = {
  drafts: DraftExpense[];
  format: ImportFormat;
  totalRows: number;
  incomeSkipped: number;
  invalidSkipped: number;
  withdrawals: number;
};

// Converts raw CSV text from a bank statement export into draft expenses.
export function parseBankCsv(text: string): ParseReport {
  const rows = parseCsv(text);
  const report: ParseReport = {
    drafts: [],
    format: 'bank',
    totalRows: 0,
    incomeSkipped: 0,
    invalidSkipped: 0,
    withdrawals: 0,
  };
  if (rows.length === 0) return report;

  const headers = rows[0].map((cell) => cell.trim().toLowerCase());
  const dateCol = findColumn(headers, ['date', 'time', 'posted', 'tanggal']);
  const descCol = findColumn(headers, [
    'desc',
    'detail',
    'narration',
    'merchant',
    'remark',
    'reference',
    'transaction',
    'keterangan',
    'name',
  ]);
  const debitCol = findColumn(headers, ['debit', 'withdraw', 'out', 'spend', 'paid']);
  const creditCol = findColumn(headers, ['credit', 'deposit', 'in', 'received']);
  const amountCol = findColumn(headers, ['amount', 'value', 'total', 'jumlah', 'nominal']);

  const hasHeader = dateCol !== -1 || amountCol !== -1 || debitCol !== -1;
  const dataRows = hasHeader ? rows.slice(1) : rows;

  // Fallback positions for a simple "date, description, amount" CSV.
  const dIdx = dateCol !== -1 ? dateCol : 0;
  const descIdx = descCol !== -1 ? descCol : 1;
  const amtIdx = amountCol !== -1 ? amountCol : 2;

  for (const cells of dataRows) {
    report.totalRows += 1;

    const dateRaw = cells[dIdx]?.trim() ?? '';
    const description = (cells[descIdx]?.trim() || 'Transaction').replace(/\s+/g, ' ');
    const date = parseFlexibleDate(dateRaw);

    if (!date) {
      report.invalidSkipped += 1;
      continue;
    }

    let outflow = NaN;

    if (debitCol !== -1) {
      const debit = parseAmount(cells[debitCol] ?? '');
      const credit = creditCol !== -1 ? parseAmount(cells[creditCol] ?? '') : NaN;
      if (!Number.isNaN(credit) && Math.abs(credit) > 0 && (Number.isNaN(debit) || debit === 0)) {
        report.incomeSkipped += 1;
        continue;
      }
      outflow = Math.abs(debit);
    } else {
      const amount = parseAmount(cells[amtIdx] ?? '');
      if (Number.isNaN(amount)) {
        report.invalidSkipped += 1;
        continue;
      }
      if (amount > 0 && creditCol !== -1) {
        // Positive value in a statement that distinguishes credits = income.
        report.incomeSkipped += 1;
        continue;
      }
      outflow = Math.abs(amount);
    }

    if (Number.isNaN(outflow) || outflow <= 0) {
      report.invalidSkipped += 1;
      continue;
    }

    const withdrawal = isWithdrawal(description);
    if (withdrawal) report.withdrawals += 1;

    report.drafts.push({
      date: date.toISOString(),
      amount: outflow,
      category: withdrawal ? WITHDRAWAL_CATEGORY : autoCategory(description),
      merchant: description,
      source: 'import',
      method: withdrawal ? 'cash' : 'debit',
      type: withdrawal ? 'withdrawal' : 'expense',
    });
  }

  return report;
}

function isTxType(value: string): value is TxType {
  return value === 'expense' || value === 'withdrawal';
}

function isPaymentMethod(value: string): value is PaymentMethod {
  return value === 'debit' || value === 'cash';
}

function isExpenseSource(value: string): value is ExpenseSource {
  return value === 'manual' || value === 'import' || value === 'bank';
}

// Parses a CSV produced by exportTransactionsBackup (app backup format).
export function parseBackupCsv(text: string): ParseReport {
  const rows = parseCsv(text);
  const report: ParseReport = {
    drafts: [],
    format: 'backup',
    totalRows: 0,
    incomeSkipped: 0,
    invalidSkipped: 0,
    withdrawals: 0,
  };
  if (rows.length === 0) return report;

  const headers = rows[0].map((cell) => cell.trim().toLowerCase());
  const col = (name: string) => headers.indexOf(name);

  const dateCol = col('date');
  const amountCol = col('amount');
  const categoryCol = col('category');
  const subcategoryCol = col('subcategory');
  const merchantCol = col('merchant');
  const typeCol = col('type');
  const methodCol = col('method');
  const sourceCol = col('source');
  const noteCol = col('note');

  for (const cells of rows.slice(1)) {
    report.totalRows += 1;

    const dateRaw = cells[dateCol]?.trim() ?? '';
    const date = new Date(dateRaw);
    const amount = parseAmount(cells[amountCol] ?? '');
    const category = cells[categoryCol]?.trim() ?? '';
    const typeRaw = (cells[typeCol]?.trim() ?? 'expense').toLowerCase();
    const methodRaw = (cells[methodCol]?.trim() ?? 'debit').toLowerCase();
    const sourceRaw = (cells[sourceCol]?.trim() ?? 'import').toLowerCase();

    if (Number.isNaN(date.getTime()) || Number.isNaN(amount) || amount <= 0 || !category) {
      report.invalidSkipped += 1;
      continue;
    }

    const type: TxType = isTxType(typeRaw) ? typeRaw : 'expense';
    const method: PaymentMethod = isPaymentMethod(methodRaw) ? methodRaw : 'debit';
    const source: ExpenseSource = isExpenseSource(sourceRaw) ? sourceRaw : 'import';
    if (type === 'withdrawal') report.withdrawals += 1;

    report.drafts.push({
      date: date.toISOString(),
      amount,
      category,
      subcategory: cells[subcategoryCol]?.trim() || undefined,
      merchant: cells[merchantCol]?.trim() || undefined,
      note: cells[noteCol]?.trim() || undefined,
      source,
      method,
      type,
    });
  }

  return report;
}

// Auto-detects bank statement vs app backup CSV and parses accordingly.
export function parseImportFile(text: string): ParseReport {
  if (isBackupCsv(text)) return parseBackupCsv(text);
  return parseBankCsv(text);
}

// Generates a realistic sample bank statement (CSV) for the in-app demo.
export function sampleBankStatementCsv(): string {
  const now = new Date();
  const day = (offset: number) => {
    const d = new Date(now);
    d.setDate(d.getDate() - offset);
    return `${String(d.getDate()).padStart(2, '0')}/${String(d.getMonth() + 1).padStart(2, '0')}/${d.getFullYear()}`;
  };

  const lines = [
    'Date,Description,Debit,Credit,Balance',
    `${day(0)},Kopi Kenangan,28000,,4240000`,
    `${day(1)},Gojek Ride to Office,32000,,4268000`,
    `${day(1)},Netflix Subscription,186000,,4300000`,
    `${day(2)},Indomaret Groceries,154000,,4486000`,
    `${day(3)},Salary,,8500000,4640000`,
    `${day(3)},Pertamina SPBU Fuel,150000,,-3859000`,
    `${day(4)},Secure Parking,15000,,4009000`,
    `${day(5)},Tokopedia Order,275000,,4024000`,
    `${day(6)},PLN Electricity Bill,320000,,4299000`,
    `${day(7)},Transfer to Parents,1000000,,4619000`,
    `${day(8)},McDonald's,67000,,5619000`,
    `${day(9)},Kimia Farma Pharmacy,89000,,5686000`,
    `${day(11)},ATM Cash Withdrawal,500000,,5775000`,
    `${day(12)},Spotify Premium,55000,,6275000`,
    `${day(14)},Uniqlo Store,499000,,6330000`,
  ];

  return lines.join('\n');
}
