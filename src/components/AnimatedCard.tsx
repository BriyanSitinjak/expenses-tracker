import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';

type AnimatedCardProps = PropsWithChildren<{
  style?: ViewStyle;
  index?: number;
  delay?: number;
}>;

// Card that fades and slides in on mount, with optional stagger by index.
export function AnimatedCard({ children, style, index = 0, delay = 0 }: AnimatedCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const startDelay = delay + index * 90;
    Animated.parallel([
      Animated.timing(opacity, {
        toValue: 1,
        duration: 420,
        delay: startDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.timing(translateY, {
        toValue: 0,
        duration: 420,
        delay: startDelay,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
    ]).start();
  }, [opacity, translateY, index, delay]);

  return (
    <Animated.View style={[styles.card, style, { opacity, transform: [{ translateY }] }]}>
      {children}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.xl,
    borderWidth: 1,
    padding: spacing.lg,
    ...shadow('md'),
  },
});
