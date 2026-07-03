import { Expense } from '../types';

// Totals spending per category, returned as [name, amount] sorted high to low.
export function sumByCategory(expenses: Expense[]): [string, number][] {
  const map: Record<string, number> = {};
  for (const item of expenses) {
    map[item.category] = (map[item.category] || 0) + item.amount;
  }
  return Object.entries(map).sort((a, b) => b[1] - a[1]);
}
