// Where a tracked transaction originated from.
// TECHDEBT: 'bank' is reserved for a dedicated bank-sync source; imports currently use 'import'.
export type ExpenseSource = 'manual' | 'import' | 'bank';

// How a transaction was paid.
export type PaymentMethod = 'debit' | 'cash';

// Whether a record is real spending or money movement (cash withdrawal).
// Withdrawals are transfers (debit -> cash wallet) and are excluded from spend.
export type TxType = 'expense' | 'withdrawal';

// Represents a single transaction in the app (expense or withdrawal).
export type Expense = {
  id: string;
  date: string; // ISO timestamp
  amount: number;
  category: string;
  subcategory?: string;
  note?: string;
  merchant?: string;
  source: ExpenseSource;
  method: PaymentMethod;
  type: TxType;
};

// A parsed-but-not-yet-saved transaction (e.g. from a bank statement import).
export type DraftExpense = {
  date: string; // ISO timestamp
  amount: number;
  category: string;
  subcategory?: string;
  merchant?: string;
  note?: string;
  source: ExpenseSource;
  method: PaymentMethod;
  type: TxType;
};

// Persisted application state.
export type BudgetState = {
  monthlyBudget: number;
  selectedMonthKey: string;
  expenses: Expense[];
  categories: string[];
  subcategories: Record<string, string[]>;
};
