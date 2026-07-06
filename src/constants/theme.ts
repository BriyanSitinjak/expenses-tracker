import { Platform, ViewStyle } from 'react-native';

// Shared spacing values for consistent and reusable layout.
export const spacing = {
  xs: 6,
  sm: 10,
  md: 14,
  lg: 18,
  xl: 24,
  xxl: 32,
};

// Shared radius values for consistent, modern cards and inputs.
export const radius = {
  sm: 8,
  md: 12,
  lg: 16,
  xl: 24,
  pill: 999,
};

// Shared color tokens (light, modern fintech palette).
export const colors = {
  bg: '#0B1020',
  bgElevated: '#121A2F',
  card: '#16203A',
  cardAlt: '#1C2747',
  text: '#F8FAFC',
  subText: '#94A3B8',
  muted: '#64748B',
  primary: '#6366F1',
  accent: '#22D3EE',
  success: '#22C55E',
  warning: '#F59E0B',
  danger: '#EF4444',
  gold: '#FACC15',
  border: '#243154',
  track: '#1E293B',
};

// Stable accent color for the built-in categories.
// Legacy keys are kept so older persisted category names still get stable colors.
export const categoryColors: Record<string, string> = {
  Food: '#F97316',
  Groceries: '#FBBF24',
  Transport: '#38BDF8',
  Investment: '#818CF8',
  'Tribute/Offering': '#A78BFA',
  'Self-Reward': '#EC4899',
  'Cash Withdrawal': '#64748B',
  // Legacy names from earlier app versions:
  Fuel: '#EF4444',
  Parking: '#0EA5E9',
  Bills: '#A78BFA',
  Shopping: '#EC4899',
  Health: '#34D399',
  Family: '#F472B6',
  Entertainment: '#FB7185',
  Other: '#94A3B8',
  'Send to Family': '#F472B6',
  'Spending with MySunflow': '#EAB308',
  Cash: '#14B8A6',
  Income: '#22C55E',
};

// Curated palette used to assign stable colors to custom categories.
const PALETTE = [
  '#F97316',
  '#38BDF8',
  '#A78BFA',
  '#EC4899',
  '#34D399',
  '#FB7185',
  '#FBBF24',
  '#22D3EE',
  '#818CF8',
  '#F59E0B',
  '#4ADE80',
  '#E879F9',
];

// Returns a stable color for a category. Built-ins use the curated map;
// custom categories get a deterministic color derived from their name.
export function colorForCategory(category: string): string {
  if (categoryColors[category]) return categoryColors[category];

  let hash = 0;
  for (let i = 0; i < category.length; i += 1) {
    hash = (hash * 31 + category.charCodeAt(i)) | 0;
  }
  return PALETTE[Math.abs(hash) % PALETTE.length];
}

// Cross-platform elevation/shadow helper.
export function shadow(level: 'sm' | 'md' | 'lg' = 'md'): ViewStyle {
  const map = {
    sm: { radius: 6, opacity: 0.18, height: 2, elevation: 2 },
    md: { radius: 14, opacity: 0.25, height: 6, elevation: 6 },
    lg: { radius: 24, opacity: 0.32, height: 12, elevation: 12 },
  } as const;
  const config = map[level];

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: '#000000',
      shadowOffset: { width: 0, height: config.height },
      shadowOpacity: config.opacity,
      shadowRadius: config.radius,
    },
    android: { elevation: config.elevation },
    default: {},
  }) as ViewStyle;
}
