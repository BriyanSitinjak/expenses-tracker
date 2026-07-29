import { Expense } from '../types';

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
export function onlyExpenses<T extends { type: Expense['type'] }>(items: T[]): T[] {
  return items.filter((item) => item.type === 'expense');
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

// Cash movement for a set of transactions: withdrawals vs cash spending.
function cashMovementStats(transactions: Expense[]): {
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
  const { withdrawn, cashSpent } = cashMovementStats(expenses);
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
