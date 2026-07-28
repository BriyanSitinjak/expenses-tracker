// Returns month key in "YYYY-MM" format for monthly grouping.
export function getMonthKey(date = new Date()): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`;
}

function getFirstDayOfMonth(monthKey: string): string {
  return `${monthKey}-01`;
}

// Returns today's date when the month is current, otherwise the first day of the month.
export function defaultDateForMonth(monthKey: string): string {
  const today = new Date();
  const todayKey = getMonthKey(today);
  if (monthKey !== todayKey) return getFirstDayOfMonth(monthKey);
  return getDayKey(today);
}

// Number of calendar days in a month key ("YYYY-MM").
export function getDaysInMonth(monthKey: string): number {
  const [year, month] = monthKey.split('-').map(Number);
  return new Date(year, month, 0).getDate();
}

function dayKeyInMonth(monthKey: string, day: number): string {
  const max = getDaysInMonth(monthKey);
  const safeDay = Math.max(1, Math.min(day, max));
  return `${monthKey}-${String(safeDay).padStart(2, '0')}`;
}

// Shifts a day key by N days, staying inside the same month.
export function shiftDayInMonth(dayKey: string, delta: number): string {
  const monthKey = dayKey.slice(0, 7);
  const day = Number(dayKey.slice(8, 10));
  return dayKeyInMonth(monthKey, day + delta);
}

// Human label for a day key, e.g. "28 Jul 2026".
export function formatDayLabel(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1);
  return date.toLocaleDateString(undefined, {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  });
}

// How a month key relates to the real calendar month.
export function monthRelation(monthKey: string): 'past' | 'current' | 'future' {
  const current = getMonthKey();
  if (monthKey < current) return 'past';
  if (monthKey > current) return 'future';
  return 'current';
}

// Shifts a month key by a number of months.
export function shiftMonthKey(monthKey: string, delta: number): string {
  const [year, month] = monthKey.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1 + delta, 1);
  return getMonthKey(date);
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

// Converts a day key ("YYYY-MM-DD") to a stable local noon ISO timestamp.
export function dayKeyToIso(dayKey: string): string {
  const [year, month, day] = dayKey.split('-').map(Number);
  const date = new Date(year, (month ?? 1) - 1, day ?? 1, 12, 0, 0);
  return date.toISOString();
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
      return safeDate(a, b - 1, c);
    }

    if (c < 100) c += 2000;

    if (a > 12) return safeDate(c, b - 1, a);
    return safeDate(c, b - 1, a);
  }

  const fallback = new Date(value);
  return Number.isNaN(fallback.getTime()) ? null : fallback;
}

function safeDate(year: number, monthIndex: number, day: number): Date | null {
  const date = new Date(year, monthIndex, day);
  return Number.isNaN(date.getTime()) ? null : date;
}
