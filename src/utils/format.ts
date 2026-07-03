// Currency configuration. IDR is typically shown without decimals.
export const CURRENCY_SYMBOL = 'Rp';
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
