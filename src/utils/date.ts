// Returns month key in "YYYY-MM" format for monthly grouping.
export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

// Returns a local day key in "YYYY-MM-DD" format for streak/day grouping.
export function getDayKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(
    date.getDate()
  ).padStart(2, '0')}`;
}

// Human-friendly month label, e.g. "June 2026".
export function getMonthLabel(monthKey: string): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, 1);
  return date.toLocaleDateString(undefined, { month: 'long', year: 'numeric' });
}

// Tries hard to parse messy date strings found in bank statements.
// Supports ISO, DD/MM/YYYY, MM/DD/YYYY, DD-MM-YYYY, and YYYY/MM/DD.
export function parseFlexibleDate(raw: string): Date | null {
  const value = raw.trim();
  if (!value) return null;

  const iso = new Date(value);
  if (!Number.isNaN(iso.getTime()) && /\d{4}-\d{2}-\d{2}/.test(value)) {
    return iso;
  }

  const parts = value.split(/[\/\-.]/).map((part) => part.trim());
  if (parts.length === 3) {
    let [a, b, c] = parts.map((part) => parseInt(part, 10));

    if (parts[0].length === 4) {
      // YYYY/MM/DD
      return safeDate(a, b - 1, c);
    }

    if (c < 100) c += 2000;

    // Heuristic: if first part > 12 it must be the day (DD/MM/YYYY).
    if (a > 12) return safeDate(c, b - 1, a);
    // Otherwise default to DD/MM/YYYY (most common outside the US).
    return safeDate(c, b - 1, a);
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

// Builds a Date only when the values produce a real calendar date.
function safeDate(year: number, monthIndex: number, day: number): Date | null {
  const date = new Date(year, monthIndex, day);
  return Number.isNaN(date.getTime()) ? null : date;
}
