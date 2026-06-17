import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import { BudgetState, Expense } from '../types';
import { getMonthKey } from '../utils/date';

type BudgetActions = {
  setMonthlyBudget: (amount: number) => void;
  addExpense: (input: Omit<Expense, 'id' | 'date'> & { amount: number; date?: string }) => void;
  ensureCurrentMonth: () => void;
  resetCurrentMonth: () => void;
};

type BudgetStore = BudgetState &
  BudgetActions & {
    totalSpent: () => number;
    remaining: () => number;
  };

// Calculates total spent from expense list.
function sumSpent(expenses: Expense[]): number {
  return expenses.reduce((accumulator, item) => accumulator + item.amount, 0);
}

// Creates a stable unique id without external dependency.
function createExpenseId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Main persisted zustand store for budget and expenses.
export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      monthlyBudget: 0,
      currentMonthKey: getMonthKey(),
      expenses: [],

      // Sets monthly budget quota.
      setMonthlyBudget: (amount) => {
        set({ monthlyBudget: amount });
      },

      // Adds one expense and automatically affects computed remaining balance.
      addExpense: ({ amount, category, note, date }) => {
        const newExpense: Expense = {
          id: createExpenseId(),
          amount,
          category,
          note,
          date: date ?? new Date().toISOString(),
        };

        set((state) => ({ expenses: [newExpense, ...state.expenses] }));
      },

      // Ensures month boundary behavior and resets expenses when month changes.
      ensureCurrentMonth: () => {
        const nowKey = getMonthKey();
        const { currentMonthKey } = get();

        if (nowKey !== currentMonthKey) {
          set({ currentMonthKey: nowKey, expenses: [] });
        }
      },

      // Allows manual reset of current month transaction data.
      resetCurrentMonth: () => {
        set({ expenses: [], currentMonthKey: getMonthKey() });
      },

      // Returns computed total spent.
      totalSpent: () => sumSpent(get().expenses),

      // Returns computed remaining budget (can be negative).
      remaining: () => get().monthlyBudget - sumSpent(get().expenses),
    }),
    {
      name: 'expense-budget-store',
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        monthlyBudget: state.monthlyBudget,
        currentMonthKey: state.currentMonthKey,
        expenses: state.expenses,
      }),
    }
  )
);
