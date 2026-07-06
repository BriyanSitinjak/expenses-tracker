import React, { PropsWithChildren, useEffect, useRef } from 'react';
import { Animated, Easing, ViewStyle } from 'react-native';
import { Card } from './Card';

type AnimatedCardProps = PropsWithChildren<{
  style?: ViewStyle;
  index?: number;
}>;

// Card that fades and slides in on mount, with optional stagger by index.
export function AnimatedCard({ children, style, index = 0 }: AnimatedCardProps) {
  const opacity = useRef(new Animated.Value(0)).current;
  const translateY = useRef(new Animated.Value(16)).current;

  useEffect(() => {
    const startDelay = index * 90;
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
  }, [opacity, translateY, index]);

  return (
    <Animated.View style={{ opacity, transform: [{ translateY }] }}>
      <Card style={style}>{children}</Card>
    </Animated.View>
  );
}
