import React, { useEffect, useMemo, useRef } from 'react';
import { Animated, Easing, StyleSheet, Text, View } from 'react-native';
import { ThemeColors, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { Icon } from './Icon';

type AppSplashProps = {
  visible: boolean;
  onFinished: () => void;
};

// Branded launch overlay shown briefly after the native splash hides.
export function AppSplash({ visible, onFinished }: AppSplashProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const opacity = useRef(new Animated.Value(1)).current;
  const lift = useRef(new Animated.Value(12)).current;
  const markScale = useRef(new Animated.Value(0.92)).current;

  useEffect(() => {
    if (!visible) return;

    Animated.parallel([
      Animated.timing(lift, {
        toValue: 0,
        duration: 520,
        easing: Easing.out(Easing.cubic),
        useNativeDriver: true,
      }),
      Animated.spring(markScale, {
        toValue: 1,
        friction: 7,
        tension: 80,
        useNativeDriver: true,
      }),
    ]).start();

    const hold = setTimeout(() => {
      Animated.timing(opacity, {
        toValue: 0,
        duration: 320,
        easing: Easing.in(Easing.cubic),
        useNativeDriver: true,
      }).start(({ finished }) => {
        if (finished) onFinished();
      });
    }, 900);

    return () => clearTimeout(hold);
  }, [lift, markScale, onFinished, opacity, visible]);

  if (!visible) return null;

  return (
    <Animated.View
      pointerEvents="none"
      style={[styles.overlay, { opacity }]}
      accessibilityLabel="App splash screen"
    >
      <Animated.View
        style={[
          styles.content,
          {
            transform: [{ translateY: lift }, { scale: markScale }],
          },
        ]}
      >
        <View style={styles.mark}>
          <Icon name="wallet" size={34} color={colors.onAccent} />
        </View>
        <Text style={styles.brand}>My Expenses</Text>
        <Text style={styles.tagline}>Track spending with clarity</Text>
      </Animated.View>
    </Animated.View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      ...StyleSheet.absoluteFillObject,
      alignItems: 'center',
      backgroundColor: colors.bg,
      justifyContent: 'center',
      zIndex: 100,
    },
    content: {
      alignItems: 'center',
      gap: spacing.sm,
      paddingHorizontal: spacing.xl,
    },
    mark: {
      alignItems: 'center',
      backgroundColor: colors.primary,
      borderRadius: radius.xl,
      elevation: 6,
      height: 72,
      justifyContent: 'center',
      marginBottom: spacing.sm,
      shadowColor: colors.primary,
      shadowOffset: { width: 0, height: 8 },
      shadowOpacity: 0.22,
      shadowRadius: 16,
      width: 72,
    },
    brand: {
      color: colors.text,
      fontSize: 28,
      fontWeight: '900',
      letterSpacing: -0.4,
    },
    tagline: {
      color: colors.subText,
      fontSize: 14,
      fontWeight: '600',
    },
  });
}
