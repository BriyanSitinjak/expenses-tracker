import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { radius } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

type ProgressBarProps = {
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
  duration?: number;
};

// Animated horizontal progress bar with a smooth fill transition.
export function ProgressBar({
  progress,
  color,
  trackColor,
  height = 12,
  duration = 900,
}: ProgressBarProps) {
  const { colors } = useAppTheme();
  const fillColor = color ?? colors.primary;
  const track = trackColor ?? colors.track;
  const animated = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(animated, {
      toValue: clamped,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, animated, duration]);

  const width = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { backgroundColor: track, height, borderRadius: height }]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: fillColor, width, borderRadius: height }]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    overflow: 'hidden',
    width: '100%',
    borderRadius: radius.pill,
  },
  fill: {
    height: '100%',
  },
});
