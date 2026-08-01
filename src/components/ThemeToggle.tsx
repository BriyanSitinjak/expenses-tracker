import React from 'react';
import { Pressable, StyleSheet } from 'react-native';
import { useAppTheme } from '../hooks/useAppTheme';
import { Icon } from './Icon';

type ThemeToggleProps = {
  size?: number;
};

// Header control that switches between light and dark themes.
export function ThemeToggle({ size = 22 }: ThemeToggleProps) {
  const { colors, isDark, toggleMode } = useAppTheme();

  return (
    <Pressable
      accessibilityLabel={isDark ? 'Switch to light theme' : 'Switch to dark theme'}
      accessibilityRole="button"
      hitSlop={12}
      onPress={toggleMode}
      style={styles.button}
    >
      <Icon name={isDark ? 'sunny' : 'moon'} size={size} color={colors.text} />
    </Pressable>
  );
}

const styles = StyleSheet.create({
  button: {
    marginRight: 14,
  },
});
