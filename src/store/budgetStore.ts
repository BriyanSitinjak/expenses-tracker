import AsyncStorage from '@react-native-async-storage/async-storage';
import { create } from 'zustand';
import { createJSONStorage, persist } from 'zustand/middleware';
import {
  DEFAULT_CATEGORIES,
  DEFAULT_SUBCATEGORIES,
  FALLBACK_CATEGORY,
} from '../constants/categories';
import { BudgetState, DraftExpense, Expense } from '../types';
import { computeCashOnHand, sumAmount } from '../utils/analytics';
import { getMonthKey, shiftMonthKey } from '../utils/date';

type ImportResult = {
  added: number;
};

type BudgetActions = {
  setMonthlyBudget: (amount: number) => void;
  addExpense: (
    input: Omit<Expense, 'id' | 'date' | 'source' | 'method' | 'type'> & {
      amount: number;
      date?: string;
      source?: Expense['source'];
      method?: Expense['method'];
      type?: Expense['type'];
    }
  ) => void;
  importExpenses: (drafts: DraftExpense[]) => ImportResult;
  deleteExpense: (id: string) => void;
  addCategory: (name: string) => string | null;
  addSubcategory: (parent: string, name: string) => string | null;
  renameCategory: (oldName: string, newName: string) => boolean;
  deleteCategory: (name: string) => void;
  deleteSubcategory: (parent: string, name: string) => void;
  shiftSelectedMonth: (delta: number) => void;
  goToCurrentMonth: () => void;
};

type BudgetSelectors = {
  transactionsForMonth: (monthKey?: string) => Expense[];
  expensesForMonth: (monthKey?: string) => Expense[];
  totalSpent: (monthKey?: string) => number;
  cashOnHand: () => number;
};

type BudgetStore = BudgetState & BudgetActions & BudgetSelectors;

// Sums amounts of a list of transactions.
function sumSpent(expenses: Expense[]): number {
  return sumAmount(expenses);
}

// Creates a stable unique id without external dependency.
function createExpenseId(): string {
  return `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`;
}

// Returns true when two names match ignoring case/whitespace.
function sameName(a: string, b: string): boolean {
  return a.trim().toLowerCase() === b.trim().toLowerCase();
}

// Inserts a category into the list (deduped, case-insensitive) keeping the
// fallback category last. Returns the possibly-updated list.
function withCategory(list: string[], name: string): string[] {
  const trimmed = name.trim();
  if (!trimmed) return list;
  if (list.some((item) => sameName(item, trimmed))) return list;

  const withoutFallback = list.filter((item) => item !== FALLBACK_CATEGORY);
  const hasFallback = list.includes(FALLBACK_CATEGORY);
  return hasFallback
    ? [...withoutFallback, trimmed, FALLBACK_CATEGORY]
    : [...withoutFallback, trimmed];
}

// Inserts a sub-category under a parent (deduped). Returns updated map.
function withSubcategory(
  map: Record<string, string[]>,
  parent: string,
  child: string
): Record<string, string[]> {
  const trimmed = child.trim();
  if (!trimmed) return map;
  const current = map[parent] ?? [];
  if (current.some((item) => sameName(item, trimmed))) return map;
  return { ...map, [parent]: [...current, trimmed] };
}

// Main persisted zustand store for budget and transactions.
export const useBudgetStore = create<BudgetStore>()(
  persist(
    (set, get) => ({
      monthlyBudget: 0,
      selectedMonthKey: getMonthKey(),
      expenses: [],
      categories: [...DEFAULT_CATEGORIES],
      subcategories: { ...DEFAULT_SUBCATEGORIES },

      // Sets monthly budget quota.
      setMonthlyBudget: (amount) => {
        set({ monthlyBudget: amount });
      },

      // Adds one transaction, registering its category/sub-category if new.
      addExpense: ({ amount, category, subcategory, note, merchant, date, source, method, type }) => {
        const newExpense: Expense = {
          id: createExpenseId(),
          amount,
          category,
          subcategory,
          note,
          merchant,
          source: source ?? 'manual',
          method: method ?? 'debit',
          type: type ?? 'expense',
          date: date ?? new Date().toISOString(),
        };

        set((state) => ({
          expenses: [newExpense, ...state.expenses],
          categories: withCategory(state.categories, category),
          subcategories: subcategory
            ? withSubcategory(state.subcategories, category, subcategory)
            : state.subcategories,
        }));
      },

      // Adds a new custom category. Returns the stored name, or null if invalid.
      addCategory: (name) => {
        const trimmed = name.trim();
        if (!trimmed) return null;

        const existing = get().categories.find((item) => sameName(item, trimmed));
        if (existing) return existing;

        set((state) => ({ categories: withCategory(state.categories, trimmed) }));
        return trimmed;
      },

      // Adds a sub-category under a parent. Returns the stored name or null.
      addSubcategory: (parent, name) => {
        const trimmed = name.trim();
        if (!trimmed || !parent) return null;

        const existing = (get().subcategories[parent] ?? []).find((item) =>
          sameName(item, trimmed)
        );
        if (existing) return existing;

        set((state) => ({
          subcategories: withSubcategory(state.subcategories, parent, trimmed),
        }));
        return trimmed;
      },

      // Renames a category everywhere (list, sub-categories, transactions).
      // Returns false if the name is empty, is the fallback, or already taken.
      renameCategory: (oldName, newName) => {
        const trimmed = newName.trim();
        if (!trimmed || oldName === FALLBACK_CATEGORY) return false;

        const state = get();
        const collides =
          !sameName(oldName, trimmed) &&
          state.categories.some((item) => sameName(item, trimmed));
        if (collides) return false;

        const nextSubs: Record<string, string[]> = {};
        for (const [parent, children] of Object.entries(state.subcategories)) {
          nextSubs[parent === oldName ? trimmed : parent] = children;
        }

        set({
          categories: state.categories.map((item) => (item === oldName ? trimmed : item)),
          subcategories: nextSubs,
          expenses: state.expenses.map((item) =>
            item.category === oldName ? { ...item, category: trimmed } : item
          ),
        });
        return true;
      },

      // Deletes a category, reassigning its transactions to the fallback.
      deleteCategory: (name) => {
        if (name === FALLBACK_CATEGORY) return;

        set((state) => {
          const nextSubs = { ...state.subcategories };
          delete nextSubs[name];

          const remaining = state.categories.filter((item) => item !== name);
          const categories = remaining.includes(FALLBACK_CATEGORY)
            ? remaining
            : [...remaining, FALLBACK_CATEGORY];

          return {
            categories,
            subcategories: nextSubs,
            expenses: state.expenses.map((item) =>
              item.category === name
                ? { ...item, category: FALLBACK_CATEGORY, subcategory: undefined }
                : item
            ),
          };
        });
      },

      // Deletes a sub-category, clearing it from any transactions that used it.
      deleteSubcategory: (parent, name) => {
        set((state) => {
          const list = (state.subcategories[parent] ?? []).filter((item) => item !== name);
          return {
            subcategories: { ...state.subcategories, [parent]: list },
            expenses: state.expenses.map((item) =>
              item.category === parent && item.subcategory === name
                ? { ...item, subcategory: undefined }
                : item
            ),
          };
        });
      },

      // Bulk-imports drafts. Same-day identical amounts are kept — legitimate repeats happen.
      importExpenses: (drafts) => {
        if (drafts.length === 0) return { added: 0 };

        const accepted: Expense[] = drafts.map((draft) => ({
          id: createExpenseId(),
          date: draft.date,
          amount: draft.amount,
          category: draft.category,
          subcategory: draft.subcategory,
          merchant: draft.merchant,
          note: draft.note,
          source: draft.source,
          method: draft.method,
          type: draft.type,
        }));

        set((state) => {
          let categories = state.categories;
          let subcategories = state.subcategories;
          for (const item of accepted) {
            categories = withCategory(categories, item.category);
            if (item.subcategory) {
              subcategories = withSubcategory(subcategories, item.category, item.subcategory);
            }
          }
          return {
            expenses: [...accepted, ...state.expenses].sort(
              (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
            ),
            categories,
            subcategories,
          };
        });

        return { added: accepted.length };
      },

      // Removes one transaction by id.
      deleteExpense: (id) => {
        set((state) => ({ expenses: state.expenses.filter((item) => item.id !== id) }));
      },

      // Moves the viewed month backward or forward.
      shiftSelectedMonth: (delta) => {
        set({ selectedMonthKey: shiftMonthKey(get().selectedMonthKey, delta) });
      },

      // Jumps back to the real current calendar month.
      goToCurrentMonth: () => {
        set({ selectedMonthKey: getMonthKey() });
      },

      // Returns ALL transactions for a month (expenses + withdrawals).
      transactionsForMonth: (monthKey) => {
        const key = monthKey ?? get().selectedMonthKey;
        return get().expenses.filter((item) => getMonthKey(new Date(item.date)) === key);
      },

      // Returns only real spending for a month (excludes cash withdrawals).
      expensesForMonth: (monthKey) => {
        return get()
          .transactionsForMonth(monthKey)
          .filter((item) => item.type === 'expense');
      },

      // Total spent for a month (defaults to active month, excludes withdrawals).
      totalSpent: (monthKey) => sumSpent(get().expensesForMonth(monthKey)),

      // Cash on hand = all cash withdrawn minus all cash spent (all-time).
      cashOnHand: () => computeCashOnHand(get().expenses),
    }),
    {
      name: 'expense-budget-store',
      version: 7,
      storage: createJSONStorage(() => AsyncStorage),
      partialize: (state) => ({
        monthlyBudget: state.monthlyBudget,
        selectedMonthKey: state.selectedMonthKey,
        expenses: state.expenses,
        categories: state.categories,
        subcategories: state.subcategories,
      }),
      migrate: (persisted) => {
        const state = (persisted ?? {}) as Partial<BudgetState> & {
          expenses?: Partial<Expense>[];
          currentMonthKey?: string;
        };
        const expenses: Expense[] = (state.expenses ?? []).map((item) => ({
          id: item.id ?? `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
          date: item.date ?? new Date().toISOString(),
          amount: item.amount ?? 0,
          category: item.category ?? FALLBACK_CATEGORY,
          subcategory: item.subcategory,
          note: item.note,
          merchant: item.merchant,
          source: item.source ?? 'manual',
          method: item.method ?? 'debit',
          type: item.type ?? 'expense',
        }));

        // Reset to new default categories, then add any categories used by saved transactions.
        let categories = [...DEFAULT_CATEGORIES];
        for (const item of expenses) categories = withCategory(categories, item.category);

        // Merge saved sub-categories on top of defaults.
        let subcategories: Record<string, string[]> = { ...DEFAULT_SUBCATEGORIES };
        for (const [parent, children] of Object.entries(state.subcategories ?? {})) {
          for (const child of children) subcategories = withSubcategory(subcategories, parent, child);
        }

        return {
          monthlyBudget: state.monthlyBudget ?? 0,
          // TECHDEBT: Remove currentMonthKey fallback after all clients migrate to v6.
          selectedMonthKey: state.selectedMonthKey ?? state.currentMonthKey ?? getMonthKey(),
          expenses,
          categories,
          subcategories,
        } as BudgetState;
      },
    }
  )
);
