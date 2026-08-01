import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { IconName } from './Icon';
import { IconTile } from './IconTile';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
};

// Shared empty list / empty section placeholder.
export function EmptyState({ icon, title, message }: EmptyStateProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrap}>
      <IconTile name={icon} color={colors.muted} size="lg" elevated={false} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingVertical: spacing.xl,
    },
    title: {
      color: colors.text,
      fontSize: 17,
      fontWeight: '800',
    },
    message: {
      color: colors.subText,
      paddingHorizontal: spacing.lg,
      textAlign: 'center',
    },
  });
}
