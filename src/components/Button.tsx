import React, { useRef } from 'react';
import { Animated, Pressable, StyleSheet, Text, View, ViewStyle } from 'react-native';
import { colors, radius, shadow, spacing } from '../constants/theme';
import { Icon, IconName } from './Icon';

type ButtonVariant = 'primary' | 'secondary';

type ButtonProps = {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  variant?: ButtonVariant;
  icon?: IconName;
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

  const isPrimary = variant === 'primary';

  return (
    <Animated.View style={[{ transform: [{ scale }] }, styles.wrapper, style]}>
      <Pressable
        onPress={onPress}
        disabled={disabled}
        onPressIn={() => animateTo(0.96)}
        onPressOut={() => animateTo(1)}
        style={[
          styles.button,
          isPrimary ? styles.primary : styles.secondary,
          disabled ? styles.disabled : null,
        ]}
      >
        <View style={styles.content}>
          {icon ? (
            <Icon name={icon} size={18} color={isPrimary ? colors.onAccent : colors.text} />
          ) : null}
          <Text style={[styles.label, isPrimary ? styles.primaryText : styles.secondaryText]}>
            {label}
          </Text>
        </View>
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
  content: {
    alignItems: 'center',
    flexDirection: 'row',
    gap: spacing.sm,
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
  label: {
    fontSize: 16,
    fontWeight: '700',
  },
  primaryText: {
    color: colors.onAccent,
  },
  secondaryText: {
    color: colors.text,
  },
  disabled: {
    opacity: 0.45,
  },
});
