import React, { useMemo } from 'react';
import { Pressable, StyleSheet, Text } from 'react-native';
import { ThemeColors, spacing, surface } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { IconName } from './Icon';
import { IconTile } from './IconTile';

type ActionCardProps = {
  title: string;
  subtitle: string;
  icon: IconName;
  iconColor: string;
  onPress: () => void;
  disabled?: boolean;
};

// Compact dashboard action card with a solid icon tile that has depth.
export function ActionCard({
  title,
  subtitle,
  icon,
  iconColor,
  onPress,
  disabled,
}: ActionCardProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled}
      style={({ pressed }) => [
        styles.card,
        pressed && styles.pressed,
        disabled && styles.disabled,
      ]}
    >
      <IconTile name={icon} color={iconColor} size="md" />
      <Text style={styles.title}>{title}</Text>
      <Text style={styles.subtitle}>{subtitle}</Text>
    </Pressable>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      flex: 1,
      gap: spacing.sm,
      padding: spacing.md,
      ...surface('md', undefined, colors),
    },
    pressed: {
      backgroundColor: colors.cardAlt,
      transform: [{ scale: 0.98 }],
    },
    disabled: {
      opacity: 0.55,
    },
    title: {
      color: colors.text,
      fontSize: 14,
      fontWeight: '800',
    },
    subtitle: {
      color: colors.subText,
      fontSize: 11,
      marginTop: -4,
    },
  });
}
