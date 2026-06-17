// Represents a single expense transaction in the app.
export type Expense = {
  id: string;
  date: string;
  amount: number;
  category: string;
  note?: string;
};

// Represents persisted budget state for a given month.
export type BudgetState = {
  monthlyBudget: number;
  currentMonthKey: string;
  expenses: Expense[];
};
