import React, { useMemo } from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { ThemeColors, radius, spacing, withAlpha } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { Icon } from './Icon';

type AiComingSoonBannerProps = {
  /** Compact inline note vs. padded callout card. */
  compact?: boolean;
};

// Soft announcement that AI features are planned for a later release.
export function AiComingSoonBanner({ compact = false }: AiComingSoonBannerProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (compact) {
    return (
      <Text style={styles.compact}>
        AI insights coming soon — smarter tips and auto-categorization.
      </Text>
    );
  }

  return (
    <View style={styles.card} accessibilityRole="text">
      <View style={styles.iconWrap}>
        <Icon name="sparkles" size={18} color={colors.accent} />
      </View>
      <View style={styles.body}>
        <Text style={styles.eyebrow}>Coming soon</Text>
        <Text style={styles.title}>AI-powered insights</Text>
        <Text style={styles.copy}>
          We&apos;ll soon help you spot spending patterns, suggest categories, and summarize your
          month — right inside this app.
        </Text>
      </View>
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    card: {
      alignItems: 'flex-start',
      backgroundColor: withAlpha(colors.accent, 0.08),
      borderColor: withAlpha(colors.accent, 0.28),
      borderRadius: radius.lg,
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.md,
      marginBottom: spacing.md,
      padding: spacing.md,
    },
    iconWrap: {
      alignItems: 'center',
      backgroundColor: withAlpha(colors.accent, 0.14),
      borderRadius: radius.md,
      height: 36,
      justifyContent: 'center',
      width: 36,
    },
    body: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    eyebrow: {
      color: colors.accent,
      fontSize: 11,
      fontWeight: '800',
      letterSpacing: 0.4,
      textTransform: 'uppercase',
    },
    title: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    copy: {
      color: colors.subText,
      fontSize: 13,
      lineHeight: 18,
      marginTop: 2,
    },
    compact: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 17,
      marginTop: spacing.sm,
      textAlign: 'center',
    },
  });
}
