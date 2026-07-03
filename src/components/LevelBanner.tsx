import React from 'react';
import { StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
import { GamificationState } from '../utils/gamification';
import { ProgressBar } from './ProgressBar';

type LevelBannerProps = {
  game: GamificationState;
};

// Hero gamification banner: level, XP progress, and active streak.
export function LevelBanner({ game }: LevelBannerProps) {
  return (
    <View>
      <View style={styles.header}>
        <View style={styles.levelBadge}>
          <Text style={styles.levelNumber}>{game.level}</Text>
        </View>
        <View style={styles.headerText}>
          <Text style={styles.title}>{game.levelTitle}</Text>
          <Text style={styles.subtitle}>
            {game.xp} XP · {game.unlockedCount} badges
          </Text>
        </View>
        <View style={styles.streak}>
          <Text style={styles.streakFlame}>{game.streak > 0 ? '🔥' : '🧊'}</Text>
          <Text style={styles.streakValue}>{game.streak}d</Text>
        </View>
      </View>

      <View style={styles.progressRow}>
        <ProgressBar progress={game.progress} color={colors.gold} height={10} />
      </View>
      <Text style={styles.progressLabel}>
        {game.xpIntoLevel}/{game.xpForLevel} XP to level {game.level + 1}
      </Text>
    </View>
  );
}

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  levelBadge: {
    width: 52,
    height: 52,
    borderRadius: radius.lg,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  levelNumber: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '800',
  },
  headerText: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 18,
    fontWeight: '800',
  },
  subtitle: {
    color: colors.subText,
    marginTop: 2,
  },
  streak: {
    alignItems: 'center',
  },
  streakFlame: {
    fontSize: 22,
  },
  streakValue: {
    color: colors.gold,
    fontWeight: '800',
    marginTop: 2,
  },
  progressRow: {
    marginTop: spacing.md,
  },
  progressLabel: {
    color: colors.subText,
    fontSize: 12,
    marginTop: spacing.xs,
  },
});
