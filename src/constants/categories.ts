// Default categories should be small enough for quick manual entry.
// Imports can still create more specific categories when the rules match.
// Note: "Cash" is intentionally NOT a category anymore — cash is a payment
// method, and withdrawing cash is a transfer (see WITHDRAWAL_CATEGORY).
export const DEFAULT_CATEGORIES = [
  'Food',
  'Groceries',
  'Transport',
  'Fuel',
  'Parking',
  'Bills',
  'Shopping',
  'Health',
  'Family',
  'Entertainment',
  'Other',
];

// Start without sub-categories; users can add only the detail they actually use.
export const DEFAULT_SUBCATEGORIES: Record<string, string[]> = {};

// Category that should always be available and kept last in the list.
export const FALLBACK_CATEGORY = 'Other';

// Special system category used for cash withdrawals (transfers, not spending).
export const WITHDRAWAL_CATEGORY = 'Cash Withdrawal';

// Descriptions that indicate a cash withdrawal / transfer rather than a purchase.
export const WITHDRAWAL_KEYWORDS = [
  'atm',
  'cash withdrawal',
  'withdrawal',
  'tarik tunai',
  'penarikan tunai',
  'tunai',
  'cardless',
];

// Returns true when a statement line looks like a cash withdrawal.
export function isWithdrawal(description: string): boolean {
  const text = description.toLowerCase();
  return WITHDRAWAL_KEYWORDS.some((keyword) => text.includes(keyword));
}

// Keyword rules used to auto-categorize imported bank transactions.
// Order matters: the first matching rule wins, so put specific ones first.
export const CATEGORY_RULES: { category: string; keywords: string[] }[] = [
  {
    category: 'Family',
    keywords: ['transfer to', 'send to', 'kirim', 'parents', 'family', 'home', 'mom', 'dad', 'ibu', 'ayah', 'orang tua'],
  },
  {
    category: 'Fuel',
    keywords: ['fuel', 'petrol', 'gas station', 'shell', 'pertamina', 'spbu', 'bensin', 'pertalite', 'pertamax', 'bp '],
  },
  {
    category: 'Parking',
    keywords: ['parking', 'parkir', 'toll', 'tol ', 'e-toll', 'etoll', 'secure parking'],
  },
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
    keywords: ['uber', 'grab', 'gojek', 'gocar', 'taxi', 'mrt', 'train', 'transit', 'flight', 'airlines', 'airways', 'krl', 'busway', 'transjakarta'],
  },
  {
    category: 'Entertainment',
    keywords: ['netflix', 'spotify', 'youtube', 'disney', 'cinema', 'movie', 'game', 'steam', 'playstation', 'cinemaxx', 'xxi', 'concert', 'hbo'],
  },
  {
    category: 'Shopping',
    keywords: ['amazon', 'shopee', 'tokopedia', 'lazada', 'store', 'mall', 'fashion', 'uniqlo', 'zara', 'h&m', 'ikea', 'shop', 'apple store', 'electronics', 'blibli'],
  },
  {
    category: 'Health',
    keywords: ['pharmacy', 'clinic', 'hospital', 'doctor', 'dental', 'apotek', 'guardian', 'kimia farma', 'health', 'gym', 'fitness'],
  },
  {
    category: 'Bills',
    keywords: ['electric', 'water', 'internet', 'wifi', 'telkom', 'indihome', 'pln', 'pdam', 'phone', 'pulsa', 'mobile', 'insurance', 'rent', 'mortgage', 'subscription', 'utility', 'tax', 'bpjs'],
  },
];

// Picks the most likely category for a transaction description.
export function autoCategory(description: string): string {
  const text = description.toLowerCase();

  for (const rule of CATEGORY_RULES) {
    if (rule.keywords.some((keyword) => text.includes(keyword))) {
      return rule.category;
    }
  }

  return FALLBACK_CATEGORY;
}
