// Default categories for quick manual entry.
// Note: "Cash" is intentionally NOT a category — cash is a payment method.
export const DEFAULT_CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Investment',
  'Tribute/Offering',
  'Self-Reward',
];

export const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {};

// Category kept for imports/deletes when no better match exists.
export const FALLBACK_CATEGORY = 'Self-Reward';

export const WITHDRAWAL_CATEGORY = 'Cash Withdrawal';

export const WITHDRAWAL_KEYWORDS = [
  'atm',
  'cash withdrawal',
  'withdrawal',
  'tarik tunai',
  'penarikan tunai',
  'tunai',
  'cardless',
];

export function isWithdrawal(description: string): boolean {
  const text = description.toLowerCase();
  return WITHDRAWAL_KEYWORDS.some((keyword) => text.includes(keyword));
}

export const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  {
    category: 'Groceries',
    keywords: ['supermarket', 'grocery', 'groceries', 'mart', 'minimart', 'indomaret', 'alfamart', 'superindo', 'hypermart', 'hero', 'ranch market', 'market'],
  },
  {
    category: 'Food',
    keywords: ['restaurant', 'cafe', 'coffee', 'starbucks', 'mcdonald', 'kfc', 'burger', 'pizza', 'gofood', 'grabfood', 'food', 'dinner', 'lunch', 'bakery', 'resto', 'warung', 'kopi'],
  },
  {
    category: 'Transport',
    keywords: ['uber', 'grab', 'gojek', 'gocar', 'taxi', 'mrt', 'train', 'transit', 'flight', 'airlines', 'fuel', 'petrol', 'gas station', 'shell', 'pertamina', 'spbu', 'parking', 'parkir', 'toll', 'tol '],
  },
  {
    category: 'Investment',
    keywords: ['invest', 'stock', 'crypto', 'reksadana', 'saham', 'bibit', 'ajaib', 'pluang', 'trading', 'broker', 'etf', 'mutual fund'],
  },
  {
    category: 'Tribute/Offering',
    keywords: ['donation', 'charity', 'church', 'mosque', 'temple', 'zakat', 'infak', 'sedekah', 'offering', 'tithe', 'donasi', 'sumbangan'],
  },
  {
    category: 'Self-Reward',
    keywords: ['netflix', 'spotify', 'cinema', 'movie', 'game', 'shopping', 'shopee', 'tokopedia', 'mall', 'fashion', 'spa', 'hobby', 'concert'],
  },
];

export function autoCategory(description: string): string {
  const text = description.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }

  return FALLBACK_CATEGORY;
}
