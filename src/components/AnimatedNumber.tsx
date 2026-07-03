import React, { useEffect, useRef, useState } from 'react';
import { Animated, Easing, StyleProp, Text, TextStyle } from 'react-native';

type AnimatedNumberProps = {
  value: number;
  format: (value: number) => string;
  duration?: number;
  style?: StyleProp<TextStyle>;
  adjustsFontSizeToFit?: boolean;
  numberOfLines?: number;
};

// Smoothly counts from the previous value to the new value when it changes.
export function AnimatedNumber({
  value,
  format,
  duration = 900,
  style,
  adjustsFontSizeToFit,
  numberOfLines,
}: AnimatedNumberProps) {
  const animated = useRef(new Animated.Value(value)).current;
  const [display, setDisplay] = useState(value);

  useEffect(() => {
    const id = animated.addListener(({ value: current }) => setDisplay(current));

    Animated.timing(animated, {
      toValue: value,
      duration,
      easing: Easing.out(Easing.cubic),
      useNativeDriver: false,
    }).start();

    return () => animated.removeListener(id);
  }, [value, duration, animated]);

  return (
    <Text style={style} adjustsFontSizeToFit={adjustsFontSizeToFit} numberOfLines={numberOfLines}>
      {format(display)}
    </Text>
  );
}
