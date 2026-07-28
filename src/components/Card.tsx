import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';
import { spacing, surface } from '../constants/theme';

type CardProps = React.PropsWithChildren<{
  style?: ViewStyle;
}>;

// Reusable container card for grouped content sections.
export function Card({ children, style }: CardProps) {
  return <View style={[styles.card, style]}>{children}</View>;
}

const styles = StyleSheet.create({
  card: {
    padding: spacing.lg,
    ...surface('md', { radius: 'xl' }),
  },
});
