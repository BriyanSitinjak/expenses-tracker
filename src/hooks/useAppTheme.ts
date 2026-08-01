import { useMemo } from 'react';
import { darkColors, lightColors, ThemeColors } from '../constants/theme';
import { ThemeMode, useThemeStore } from '../store/themeStore';

export type AppTheme = {
  mode: ThemeMode;
  colors: ThemeColors;
  isDark: boolean;
  setMode: (mode: ThemeMode) => void;
  toggleMode: () => void;
};

// Returns the active palette and helpers for the current theme mode.
export function useAppTheme(): AppTheme {
  const mode = useThemeStore((state) => state.mode);
  const setMode = useThemeStore((state) => state.setMode);
  const toggleMode = useThemeStore((state) => state.toggleMode);

  const colors = useMemo(
    () => (mode === 'dark' ? darkColors : lightColors),
    [mode]
  );

  return {
    mode,
    colors,
    isDark: mode === 'dark',
    setMode,
    toggleMode,
  };
}
