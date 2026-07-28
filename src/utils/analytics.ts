import { Expense } from '../types';
import { getDayKey, getMonthKey } from './date';

// Totals spending per category, returned as [name, amount] sorted high to low.
export function sumByCategory(expenses: Expense[]): [string, number][] {
  const map: Record<string, number> = {};
  for (const item of expenses) {
    map[item.category] = (map[item.category] || 0) + item.amount;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}

// Sums the amount field across a list of transactions.
export function sumAmount(items: { amount: number }[]): number {
  return items.reduce((sum, item) => sum + item.amount, 0);
}

// Keeps only real spending rows (excludes cash withdrawals).
export function onlyExpenses(expenses: Expense[]): Expense[] {
  return expenses.filter((item) => item.type === 'expense');
}

// Totals cash vs debit spending for expense rows.
export function sumByMethod(expenses: Expense[]): { cash: number; debit: number } {
  let cash = 0;
  let debit = 0;
  for (const item of onlyExpenses(expenses)) {
    if (item.method === 'cash') cash += item.amount;
    else debit += item.amount;
  }
  return { cash, debit };
}

// Monthly cash movement: withdrawals and cash spending in the selected period.
export function monthCashStats(transactions: Expense[]): {
  withdrawn: number;
  cashSpent: number;
} {
  let withdrawn = 0;
  let cashSpent = 0;
  for (const item of transactions) {
    if (item.type === 'withdrawal') withdrawn += item.amount;
    else if (item.method === 'cash') cashSpent += item.amount;
  }
  return { withdrawn, cashSpent };
}

// All-time cash on hand = withdrawals minus cash spending.
export function computeCashOnHand(expenses: Expense[]): number {
  const { withdrawn, cashSpent } = monthCashStats(expenses);
  return withdrawn - cashSpent;
}

// Budget progress for a single month.
export function budgetSnapshot(spent: number, monthlyBudget: number): {
  remaining: number;
  overBudget: boolean;
  usage: number;
} {
  const remaining = monthlyBudget - spent;
  return {
    remaining,
    overBudget: remaining < 0,
    usage: monthlyBudget > 0 ? spent / monthlyBudget : 0,
  };
}

// Active day streak ending today (or yesterday if today is empty).
function computeStreak(dayKeys: Set<string>): number {
  if (dayKeys.size === 0) return 0;

  const cursor = new Date();
  const todayKey = getDayKey(cursor);

  if (!dayKeys.has(todayKey)) {
    cursor.setDate(cursor.getDate() - 1);
    if (!dayKeys.has(getDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (dayKeys.has(getDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// Lightweight tracking metrics used by the Stats screen.
export function trackingStats(expenses: Expense[]): {
  daysTracked: number;
  streak: number;
} {
  const dayKeys = new Set<string>();
  for (const item of expenses) {
    dayKeys.add(getDayKey(new Date(item.date)));
  }
  return {
    daysTracked: dayKeys.size,
    streak: computeStreak(dayKeys),
  };
}

// Aggregated payment + category stats used by Excel export.
export function paymentStats(expenses: Expense[]): {
  totalSpent: number;
  cashSpent: number;
  debitSpent: number;
  withdrawn: number;
  cashOnHand: number;
  byCategory: Record<string, number>;
  byMonth: Record<string, number>;
} {
  const spending = onlyExpenses(expenses);
  const totalSpent = sumAmount(spending);
  const { cash: cashSpent, debit: debitSpent } = sumByMethod(expenses);

  let withdrawn = 0;
  const byCategory: Record<string, number> = {};
  const byMonth: Record<string, number> = {};

  for (const item of expenses) {
    if (item.type === 'withdrawal') {
      withdrawn += item.amount;
      continue;
    }
    byCategory[item.category] = (byCategory[item.category] ?? 0) + item.amount;
    const key = getMonthKey(new Date(item.date));
    byMonth[key] = (byMonth[key] ?? 0) + item.amount;
  }

  return {
    totalSpent,
    cashSpent,
    debitSpent,
    withdrawn,
    cashOnHand: withdrawn - cashSpent,
    byCategory,
    byMonth,
  };
}
