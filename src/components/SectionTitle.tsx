import React from 'react';
import { StyleSheet, Text, TextStyle } from 'react-native';
import { colors } from '../constants/theme';

type SectionTitleProps = {
  children: React.ReactNode;
  style?: TextStyle;
};

// Shared section heading used across list screens.
export function SectionTitle({ children, style }: SectionTitleProps) {
  return <Text style={[styles.title, style]}>{children}</Text>;
}

const styles = StyleSheet.create({
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginBottom: 10,
  },
});
