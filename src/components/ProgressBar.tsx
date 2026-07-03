import React, { useEffect, useRef } from 'react';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { colors, radius } from '../constants/theme';

type ProgressBarProps = {
  progress: number; // 0..1
  color?: string;
  trackColor?: string;
  height?: number;
};

// Animated horizontal progress bar with a smooth fill transition.
export function ProgressBar({
  progress,
  color = colors.primary,
  trackColor = colors.track,
  height = 12,
}: ProgressBarProps) {
  const animated = useRef(new Animated.Value(0)).current;
  const clamped = Math.max(0, Math.min(1, progress));

  useEffect(() => {
    Animated.timing(animated, {
      toValue: clamped,
      duration: 900,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();
  }, [clamped, animated]);

  const width = animated.interpolate({
    inputRange: [0, 1],
    outputRange: ['0%', '100%'],
  });

  return (
    <View style={[styles.track, { backgroundColor: trackColor, height, borderRadius: height }]}>
      <Animated.View
        style={[styles.fill, { backgroundColor: color, width, borderRadius: height }]}
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
