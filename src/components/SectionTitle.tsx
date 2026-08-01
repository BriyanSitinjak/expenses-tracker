import React, { useMemo } from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { ThemeColors } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

type SectionTitleProps = {
  children: React.ReactNode;
  style?: TextStyle;
};

// Shared section heading used across list screens.
export function SectionTitle({ children, style }: SectionTitleProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return <Text style={[styles.title, style]}>{children}</Text>;
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    title: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
      marginBottom: 10,
    },
  });
}
