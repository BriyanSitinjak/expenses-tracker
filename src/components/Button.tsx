import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';

type ButtonVariant = 'primary' | 'secondary' | 'ghost';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: string;
  style?: ViewStyle;
};

// Reusable button with a tactile press-scale animation.
export function Button({
  label,
  onPress,
  disabled,
  variant = 'primary',
  icon,
  style,
}: ButtonProps) {
  const scale = useRef(new Animated.Value(1)).current;

  const animateTo = (value: number) => {
    Animated.spring(scale, {
      toValue: value,
      useNativeDriver: true,
      speed: 40,
      bounciness: 6,
    }).start();
  };

  const variantStyle =
    variant === 'primary'
      ? styles.primary
      : variant === 'secondary'
        ? styles.secondary
        : styles.ghost;
  const textStyle = variant === 'primary' ? styles.primaryText : styles.secondaryText;

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrapper, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={[styles.button, variantStyle, disabled ? styles.disabled : null]}
      >
        <Text style={[styles.label, textStyle]}>
          {icon ? `${icon}  ` : ''}
          {label}
        </Text>
      </Pressable>
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    borderRadius: radius.lg,
  },
  button: {
    borderRadius: radius.lg,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  primary: {
    backgroundColor: colors.primary,
    ...shadow('sm'),
  },
  secondary: {
    backgroundColor: colors.cardAlt,
    borderWidth: 1,
    borderColor: colors.border,
  },
  ghost: {
    backgroundColor: 'transparent',
  },
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: '#FFFFFF',
  },
  secondaryText: {
    color: colors.text,
  },
  disabled: {
    opacity: 0.45,
  },
});
