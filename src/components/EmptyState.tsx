import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, spacing } from '../constants/theme';
import { IconName } from './Icon';
import { IconTile } from './IconTile';

type EmptyStateProps = {
  icon: IconName;
  title: string;
  message: string;
};

// Shared empty list / empty section placeholder.
export function EmptyState({ icon, title, message }: EmptyStateProps) {
  return (
    <View style={styles.wrap}>
      <IconTile name={icon} color={colors.muted} size="lg" elevated={false} />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.message}>{message}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
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
