import * as XLSX from 'xlsx';
import { autoCategory, isWithdrawal, WITHDRAWAL_CATEGORY } from '../constants/categories';
import { DraftExpense, ExpenseSource, PaymentMethod, TxType } from '../types';
import { isBackupCsv, isBackupHeaders } from './backup';
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

type ImportFormat = 'bank' | 'backup';

export type ParseReport = {
  drafts: DraftExpense[];
  format: ImportFormat;
  totalRows: number;
  incomeSkipped: number;
  invalidSkipped: number;
  withdrawals: number;
};

// Converts raw CSV text from a bank statement export into draft expenses.
function parseBankCsv(text: string): ParseReport {
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

function emptyReport(format: ImportFormat): ParseReport {
  return {
    drafts: [],
    format,
    totalRows: 0,
    incomeSkipped: 0,
    invalidSkipped: 0,
    withdrawals: 0,
  };
}

function normalizeType(raw: string): TxType {
  const value = raw.trim().toLowerCase();
  if (value === 'withdrawal' || value === 'transfer' || value === 'atm') return 'withdrawal';
  return 'expense';
}

function normalizeMethod(raw: string): PaymentMethod {
  const value = raw.trim().toLowerCase();
  if (value === 'cash') return 'cash';
  return 'debit';
}

function normalizeSource(raw: string): ExpenseSource {
  const value = raw.trim().toLowerCase();
  if (value === 'manual' || value === 'import' || value === 'bank') return value;
  return 'import';
}

function cellLookup(headers: string[], ...names: string[]): number {
  return headers.findIndex((header) => names.includes(header));
}

function rowValue(row: Record<string, unknown>, ...names: string[]): string {
  const entries = Object.entries(row);
  for (const name of names) {
    const match = entries.find(([key]) => key.trim().toLowerCase() === name);
    if (match) return String(match[1] ?? '').trim();
  }
  return '';
}

function pushBackupDraft(
  report: ParseReport,
  fields: {
    dateRaw: string;
    amountRaw: string;
    category: string;
    subcategory?: string;
    merchant?: string;
    note?: string;
    typeRaw: string;
    methodRaw: string;
    sourceRaw: string;
  }
) {
  report.totalRows += 1;

  const date = parseFlexibleDate(fields.dateRaw) ?? new Date(fields.dateRaw);
  const amount = parseAmount(fields.amountRaw);
  const category = fields.category.trim();

  if (Number.isNaN(date.getTime()) || Number.isNaN(amount) || amount <= 0 || !category) {
    report.invalidSkipped += 1;
    return;
  }

  const type = normalizeType(fields.typeRaw || 'expense');
  const method = normalizeMethod(fields.methodRaw || 'debit');
  const source = normalizeSource(fields.sourceRaw || 'import');
  if (type === 'withdrawal') report.withdrawals += 1;

  report.drafts.push({
    date: date.toISOString(),
    amount,
    category,
    subcategory: fields.subcategory?.trim() || undefined,
    merchant: fields.merchant?.trim() || undefined,
    note: fields.note?.trim() || undefined,
    source,
    method,
    type,
  });
}

// Parses a matrix (header row + data) in the app backup column format.
function parseBackupMatrix(rows: string[][]): ParseReport {
  const report = emptyReport('backup');
  if (rows.length === 0) return report;

  const headers = rows[0].map((cell) => cell.trim().toLowerCase());
  const dateCol = cellLookup(headers, 'date');
  const amountCol = cellLookup(headers, 'amount', 'amount (idr)');
  const categoryCol = cellLookup(headers, 'category');
  const subcategoryCol = cellLookup(headers, 'subcategory');
  const merchantCol = cellLookup(headers, 'merchant');
  const typeCol = cellLookup(headers, 'type');
  const methodCol = cellLookup(headers, 'method');
  const sourceCol = cellLookup(headers, 'source');
  const noteCol = cellLookup(headers, 'note');

  for (const cells of rows.slice(1)) {
    pushBackupDraft(report, {
      dateRaw: cells[dateCol] ?? '',
      amountRaw: cells[amountCol] ?? '',
      category: cells[categoryCol] ?? '',
      subcategory: cells[subcategoryCol],
      merchant: cells[merchantCol],
      note: cells[noteCol],
      typeRaw: cells[typeCol] ?? 'expense',
      methodRaw: cells[methodCol] ?? 'debit',
      sourceRaw: cells[sourceCol] ?? 'import',
    });
  }

  return report;
}

// Parses a CSV produced by exportTransactionsBackup (app backup format).
function parseBackupCsv(text: string): ParseReport {
  return parseBackupMatrix(parseCsv(text));
}

// Parses the human-readable "Transactions" sheet from Excel report exports.
function parseExcelTransactionsSheet(rows: Record<string, unknown>[]): ParseReport {
  const report = emptyReport('backup');

  for (const row of rows) {
    const datePart = rowValue(row, 'date');
    const timePart = rowValue(row, 'time');
    const dateRaw = timePart ? `${datePart} ${timePart}` : datePart;

    pushBackupDraft(report, {
      dateRaw,
      amountRaw: rowValue(row, 'amount (idr)', 'amount'),
      category: rowValue(row, 'category'),
      subcategory: rowValue(row, 'subcategory'),
      merchant: rowValue(row, 'merchant'),
      note: rowValue(row, 'note'),
      typeRaw: rowValue(row, 'type') || 'expense',
      methodRaw: rowValue(row, 'method') || 'debit',
      sourceRaw: rowValue(row, 'source') || 'import',
    });
  }

  return report;
}

function sheetToMatrix(sheet: XLSX.WorkSheet): string[][] {
  const rows = XLSX.utils.sheet_to_json<(string | number | boolean | null | undefined)[]>(sheet, {
    header: 1,
    defval: '',
    raw: false,
  });
  return rows.map((row) => row.map((cell) => String(cell ?? '').trim()));
}

function sheetLooksLikeBackup(sheet: XLSX.WorkSheet): boolean {
  const matrix = sheetToMatrix(sheet);
  if (matrix.length === 0) return false;
  return isBackupHeaders(matrix[0]);
}

// Parses an Excel workbook (.xlsx/.xls) exported by the app or a simple bank sheet.
export function parseImportExcel(data: ArrayBuffer | string, dataType: 'array' | 'base64'): ParseReport {
  const workbook = XLSX.read(data, { type: dataType, cellDates: true });
  const names = workbook.SheetNames;

  const backupName = names.find((name) => name.trim().toLowerCase() === 'backup');
  if (backupName) {
    const matrix = sheetToMatrix(workbook.Sheets[backupName]);
    const report = parseBackupMatrix(matrix);
    if (report.drafts.length > 0 || report.totalRows > 0) return report;
  }

  const namedBackup = names.find((name) => sheetLooksLikeBackup(workbook.Sheets[name]));
  if (namedBackup) {
    return parseBackupMatrix(sheetToMatrix(workbook.Sheets[namedBackup]));
  }

  const txName = names.find((name) => name.trim().toLowerCase() === 'transactions');
  if (txName) {
    const json = XLSX.utils.sheet_to_json<Record<string, unknown>>(workbook.Sheets[txName], {
      defval: '',
      raw: false,
    });
    const report = parseExcelTransactionsSheet(json);
    if (report.drafts.length > 0) return report;
  }

  // Fall back to treating the first sheet as a bank-style CSV.
  const first = names[0];
  if (!first) return emptyReport('bank');
  const csv = XLSX.utils.sheet_to_csv(workbook.Sheets[first]);
  return parseBankCsv(csv);
}

export function isExcelFileName(name: string): boolean {
  const lower = name.trim().toLowerCase();
  return lower.endsWith('.xlsx') || lower.endsWith('.xls');
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
