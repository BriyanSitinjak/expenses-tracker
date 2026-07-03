import React, { useEffect, useRef } from 'react';
import { Animated, Easing, Modal, Pressable, StyleSheet, Text, View } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';
import { Achievement } from '../utils/gamification';

type AchievementModalProps = {
  achievements: Achievement[];
  onClose: () => void;
};

// Celebratory popup shown when the user unlocks new achievements.
export function AchievementModal({ achievements, onClose }: AchievementModalProps) {
  const scale = useRef(new Animated.Value(0.6)).current;
  const opacity = useRef(new Animated.Value(0)).current;
  const visible = achievements.length > 0;

  useEffect(() => {
    if (!visible) return;
    scale.setValue(0.6);
    opacity.setValue(0);
    Animated.parallel([
      Animated.spring(scale, { toValue: 1, useNativeDriver: true, bounciness: 12, speed: 12 }),
      Animated.timing(opacity, {
        toValue: 1,
        duration: 220,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [visible, scale, opacity]);

  if (!visible) return null;

  return (
    <Modal transparent animationType="fade" visible={visible} onRequestClose={onClose}>
      <Pressable style={styles.backdrop} onPress={onClose}>
        <Animated.View style={[styles.card, { opacity, transform: [{ scale }] }]}>
          <Text style={styles.kicker}>ACHIEVEMENT UNLOCKED</Text>
          {achievements.map((item) => (
            <View key={item.id} style={styles.row}>
              <Text style={styles.icon}>{item.icon}</Text>
              <View style={styles.textWrap}>
                <Text style={styles.title}>{item.title}</Text>
                <Text style={styles.desc}>{item.description}</Text>
              </View>
              <Text style={styles.plus}>+100 XP</Text>
            </View>
          ))}
          <Pressable style={styles.button} onPress={onClose}>
            <Text style={styles.buttonText}>Nice!</Text>
          </Pressable>
        </Animated.View>
      </Pressable>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(2, 6, 23, 0.7)',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    backgroundColor: colors.card,
    borderRadius: radius.xl,
    borderWidth: 1,
    borderColor: colors.gold,
    padding: spacing.xl,
    ...shadow('lg'),
  },
  kicker: {
    color: colors.gold,
    fontWeight: '800',
    letterSpacing: 1.5,
    fontSize: 12,
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.sm,
  },
  icon: {
    fontSize: 34,
  },
  textWrap: {
    flex: 1,
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
  },
  desc: {
    color: colors.subText,
    marginTop: 2,
  },
  plus: {
    color: colors.gold,
    fontWeight: '800',
  },
  button: {
    marginTop: spacing.lg,
    backgroundColor: colors.primary,
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  buttonText: {
    color: '#FFFFFF',
    fontWeight: '800',
    fontSize: 16,
  },
});
