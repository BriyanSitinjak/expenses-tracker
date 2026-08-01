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

export type ThemeColors = {
  bg: string;
  bgElevated: string;
  card: string;
  cardAlt: string;
  text: string;
  subText: string;
  muted: string;
  primary: string;
  accent: string;
  success: string;
  warning: string;
  danger: string;
  border: string;
  track: string;
  onAccent: string;
  overlay: string;
};

// Warm cream Scandinavian palette inspired by terracotta-on-parchment branding.
export const lightColors: ThemeColors = {
  bg: '#F9F6F2',
  bgElevated: '#F3EEE6',
  card: '#FFFFFF',
  cardAlt: '#EFE9E0',
  text: '#2C2926',
  subText: '#6B6661',
  muted: '#9A948C',
  primary: '#D6765D',
  accent: '#B25C48',
  success: '#6F8F6A',
  warning: '#C4964A',
  danger: '#B85C4E',
  border: '#D1CDC7',
  track: '#E8E2D8',
  onAccent: '#FFFFFF',
  overlay: 'rgba(44, 41, 38, 0.45)',
};

// Night counterpart that keeps the terracotta accent on deep warm neutrals.
export const darkColors: ThemeColors = {
  bg: '#171513',
  bgElevated: '#211E1B',
  card: '#2A2622',
  cardAlt: '#342F2A',
  text: '#F3EEE6',
  subText: '#B8B2A8',
  muted: '#8A847C',
  primary: '#E08B74',
  accent: '#D6765D',
  success: '#8FAF8A',
  warning: '#D4A85A',
  danger: '#D07060',
  border: '#3F3A35',
  track: '#3A3530',
  onAccent: '#FFFFFF',
  overlay: 'rgba(0, 0, 0, 0.55)',
};

/** @deprecated Prefer useAppTheme().colors — kept as light default for non-UI helpers. */
export const colors = lightColors;

// Appends an alpha channel to a #RRGGBB color (alpha is 0..1).
export function withAlpha(hex: string, alpha: number): string {
  const cleaned = hex.replace('#', '').slice(0, 6);
  const a = Math.round(Math.max(0, Math.min(1, alpha)) * 255)
    .toString(16)
    .padStart(2, '0');
  return `#${cleaned}${a}`;
}

// Warm clay / ochre / berry tones reserved for CATEGORY badges only.
const CATEGORY_PALETTE = [
  '#D6765D',
  '#C4964A',
  '#B25C48',
  '#A67C52',
  '#C06A3D',
  '#8E4B5A',
  '#B08948',
  '#9C5A44',
  '#D08A3C',
  '#A35D6A',
  '#8B5E3C',
  '#B76E79',
  '#7A4E3A',
  '#C9892E',
] as const;

// Cool sage / slate / mist tones reserved for SUB-CATEGORY badges only.
// Intentionally disjoint from CATEGORY_PALETTE — no shared hex values.
const SUBCATEGORY_PALETTE = [
  '#7A9E8E',
  '#8DA3A6',
  '#6F8F6A',
  '#7B8F9E',
  '#5E8B7E',
  '#8A968F',
  '#6B7F8C',
  '#73948A',
  '#5A738C',
  '#9CAF88',
  '#708090',
  '#4E7A86',
  '#667E9B',
  '#557C69',
] as const;

// Stable accent color for the built-in categories (all from CATEGORY_PALETTE).
// Legacy keys are kept so older persisted category names still get stable colors.
const categoryColors: Record<string, string> = {
  Food: '#D6765D',
  Groceries: '#C4964A',
  Transport: '#A67C52',
  Investment: '#8B5E3C',
  'Tribute/Offering': '#B76E79',
  'Self-Reward': '#B08948',
  'Cash Withdrawal': '#7A4E3A',
  // Legacy names from earlier app versions:
  Fuel: '#C06A3D',
  Parking: '#A67C52',
  Bills: '#A35D6A',
  Shopping: '#8E4B5A',
  Health: '#D08A3C',
  Family: '#9C5A44',
  Entertainment: '#B25C48',
  Other: '#A67C52',
  'Send to Family': '#A35D6A',
  'Spending with MySunflow': '#C9892E',
  Cash: '#8B5E3C',
  Income: '#C4964A',
};

function hashName(value: string): number {
  let hash = 0;
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) | 0;
  }
  return Math.abs(hash);
}

function pickFromPalette(name: string, palette: readonly string[]): string {
  return palette[hashName(name) % palette.length];
}

// Returns a stable warm color for a category badge.
export function colorForCategory(category: string): string {
  if (categoryColors[category]) return categoryColors[category];
  return pickFromPalette(category, CATEGORY_PALETTE);
}

// Returns a stable cool color for a sub-category badge.
// Uses a separate palette so category and sub-category never share a color.
export function colorForSubcategory(subcategory: string, parentCategory?: string): string {
  const key = parentCategory ? `${parentCategory}::${subcategory}` : subcategory;
  return pickFromPalette(key, SUBCATEGORY_PALETTE);
}

// Cross-platform elevation/shadow helper (softened for Scandinavian UI).
export function shadow(
  level: 'sm' | 'md' = 'md',
  palette: ThemeColors = lightColors
): ViewStyle {
  const map = {
    sm: { radius: 6, opacity: 0.06, height: 2, elevation: 1 },
    md: { radius: 12, opacity: 0.1, height: 4, elevation: 3 },
  } as const;
  const config = map[level];
  const isDark = palette.bg === darkColors.bg;
  const shadowOpacity = isDark ? config.opacity * 2.2 : config.opacity;

  return Platform.select<ViewStyle>({
    ios: {
      shadowColor: isDark ? '#000000' : palette.text,
      shadowOffset: { width: 0, height: config.height },
      shadowOpacity,
      shadowRadius: config.radius,
    },
    android: { elevation: config.elevation },
    default: {},
  }) as ViewStyle;
}

// Shared card/surface chrome used by cards and action tiles.
export function surface(
  level: 'sm' | 'md' = 'md',
  options?: { radius?: keyof typeof radius },
  palette: ThemeColors = lightColors
): ViewStyle {
  return {
    backgroundColor: palette.card,
    borderColor: palette.border,
    borderRadius: radius[options?.radius ?? 'lg'],
    borderWidth: 1,
    ...shadow(level, palette),
  };
}
