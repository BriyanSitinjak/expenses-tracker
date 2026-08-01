import React, { useMemo } from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { ThemeColors, spacing, surface } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

type CardProps = React.PropsWithChildren<{
  style?: ViewStyle;
}>;

// Reusable container card for grouped content sections.
export function Card({ children, style }: CardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <View style={[styles.card, style]}>{children}</View>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      padding: spacing.lg,
      ...surface('md', { radius: 'xl' }, colors),
    },
  });
}
