import { Expense } from '../types';
import { getDayKey, getMonthKey } from './date';

export type Achievement = {
  id: string;
  title: string;
  description: string;
  icon: string;
  unlocked: boolean;
};

export type GamificationState = {
  xp: number;
  level: number;
  levelTitle: string;
  xpIntoLevel: number;
  xpForLevel: number;
  progress: number; // 0..1 toward next level
  streak: number;
  daysTracked: number;
  achievements: Achievement[];
  unlockedCount: number;
};

const XP_PER_LEVEL = 250;

const LEVEL_TITLES = [
  'Rookie Saver',
  'Budget Cadet',
  'Money Scout',
  'Coin Keeper',
  'Finance Pro',
  'Wealth Warden',
  'Savings Sage',
  'Budget Master',
];

// Returns a flavor title for a given level.
export function levelTitle(level: number): string {
  return LEVEL_TITLES[Math.min(level - 1, LEVEL_TITLES.length - 1)] ?? 'Money Legend';
}

// Computes the longest active day-streak ending today (or yesterday).
function computeStreak(dayKeys: Set<string>): number {
  if (dayKeys.size === 0) return 0;

  const cursor = new Date();
  const todayKey = getDayKey(cursor);

  if (!dayKeys.has(todayKey)) {
    // Allow the streak to "hold" if yesterday was tracked.
    cursor.setDate(cursor.getDate() - 1);
    if (!dayKeys.has(getDayKey(cursor))) return 0;
  }

  let streak = 0;
  while (dayKeys.has(getDayKey(cursor))) {
    streak += 1;
    cursor.setDate(cursor.getDate() - 1);
  }

  return streak;
}

// Derives all gamification state from the raw expense list and budget.
export function computeGamification(
  expenses: Expense[],
  monthlyBudget: number
): GamificationState {
  const dayKeys = new Set<string>();
  const categories = new Set<string>();
  const monthTotals: Record<string, number> = {};
  let importedCount = 0;

  for (const item of expenses) {
    dayKeys.add(getDayKey(new Date(item.date)));
    categories.add(item.category);
    const mk = getMonthKey(new Date(item.date));
    monthTotals[mk] = (monthTotals[mk] ?? 0) + item.amount;
    if (item.source === 'import' || item.source === 'bank') importedCount += 1;
  }

  const streak = computeStreak(dayKeys);
  const daysTracked = dayKeys.size;
  const underBudgetMonths =
    monthlyBudget > 0
      ? Object.values(monthTotals).filter((total) => total <= monthlyBudget).length
      : 0;

  const stats = {
    count: expenses.length,
    importedCount,
    categories: categories.size,
    streak,
    daysTracked,
    underBudgetMonths,
  };

  const achievements: Achievement[] = [
    {
      id: 'first_step',
      title: 'First Step',
      description: 'Track your first expense',
      icon: '🌱',
      unlocked: stats.count >= 1,
    },
    {
      id: 'getting_serious',
      title: 'Getting Serious',
      description: 'Track 10 transactions',
      icon: '🔥',
      unlocked: stats.count >= 10,
    },
    {
      id: 'centurion',
      title: 'Centurion',
      description: 'Track 100 transactions',
      icon: '💯',
      unlocked: stats.count >= 100,
    },
    {
      id: 'bank_linked',
      title: 'Synced Up',
      description: 'Import from a bank statement',
      icon: '🏦',
      unlocked: stats.importedCount >= 1,
    },
    {
      id: 'power_importer',
      title: 'Power Importer',
      description: 'Import 10+ transactions',
      icon: '⚡',
      unlocked: stats.importedCount >= 10,
    },
    {
      id: 'diversified',
      title: 'Well Rounded',
      description: 'Use 5 different categories',
      icon: '🎯',
      unlocked: stats.categories >= 5,
    },
    {
      id: 'week_streak',
      title: 'On a Roll',
      description: '7-day tracking streak',
      icon: '📅',
      unlocked: stats.streak >= 7,
    },
    {
      id: 'consistent',
      title: 'Consistent',
      description: 'Track on 14 different days',
      icon: '🧭',
      unlocked: stats.daysTracked >= 14,
    },
    {
      id: 'budget_keeper',
      title: 'Budget Keeper',
      description: 'Finish a month within budget',
      icon: '🛡️',
      unlocked: stats.underBudgetMonths >= 1,
    },
  ];

  const unlockedCount = achievements.filter((a) => a.unlocked).length;

  const xp =
    stats.count * 12 +
    stats.importedCount * 8 +
    stats.streak * 5 +
    unlockedCount * 100;

  const level = Math.floor(xp / XP_PER_LEVEL) + 1;
  const xpIntoLevel = xp - (level - 1) * XP_PER_LEVEL;
  const xpForLevel = XP_PER_LEVEL;
  const progress = Math.max(0, Math.min(1, xpIntoLevel / xpForLevel));

  return {
    xp,
    level,
    levelTitle: levelTitle(level),
    xpIntoLevel,
    xpForLevel,
    progress,
    streak,
    daysTracked,
    achievements,
    unlockedCount,
  };
}
