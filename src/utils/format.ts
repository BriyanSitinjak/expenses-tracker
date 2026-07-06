// Currency configuration. IDR is typically shown without decimals.
const CURRENCY_SYMBOL = 'Rp';
const LOCALE = 'id-ID';

// Formats a number as an IDR currency-style string, e.g. "Rp 25.000".
export function formatCurrency(amount: number, withSymbol = true): string {
  const formatted = Math.round(Math.abs(amount)).toLocaleString(LOCALE, {
    maximumFractionDigits: 0,
  });
  const sign = amount < 0 ? '-' : '';
  return withSymbol ? `${sign}${CURRENCY_SYMBOL} ${formatted}` : `${sign}${formatted}`;
}

// Compact IDR for tight UI spots, e.g. "Rp 3jt", "Rp 500rb".
export function formatCompact(amount: number): string {
  const abs = Math.abs(amount);
  const sign = amount < 0 ? '-' : '';

  if (abs >= 1_000_000_000) return `${sign}${CURRENCY_SYMBOL} ${(abs / 1_000_000_000).toFixed(1)}M`;
  if (abs >= 1_000_000) return `${sign}${CURRENCY_SYMBOL} ${(abs / 1_000_000).toFixed(abs % 1_000_000 === 0 ? 0 : 1)}jt`;
  if (abs >= 1_000) return `${sign}${CURRENCY_SYMBOL} ${(abs / 1_000).toFixed(abs % 1_000 === 0 ? 0 : 1)}rb`;
  return `${sign}${CURRENCY_SYMBOL} ${abs.toFixed(0)}`;
}

// Strips non-digits from a formatted amount input.
export function stripAmountInput(value: string): string {
  return value.replace(/\D/g, '');
}

// Formats digit-only input with locale thousand separators, e.g. "25000" -> "25.000".
export function formatAmountInput(digits: string): string {
  if (!digits) return '';
  const num = Number(digits);
  if (Number.isNaN(num)) return '';
  return num.toLocaleString(LOCALE, { maximumFractionDigits: 0 });
}

// Parses a formatted amount input back to a number.
export function parseAmountInput(value: string): number {
  const digits = stripAmountInput(value);
  return digits ? Number(digits) : 0;
}
