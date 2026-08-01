import React, { useMemo } from 'react';
import { StyleSheet, Text, TextInput, View } from 'react-native';
import { ThemeColors, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';

type TextInputFieldProps = {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  keyboardType?: 'default' | 'numeric';
  placeholder?: string;
};

// Reusable labeled input field for forms.
export function TextInputField({
  label,
  value,
  onChangeText,
  keyboardType = 'default',
  placeholder,
}: TextInputFieldProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>{label}</Text>
      <TextInput
        keyboardType={keyboardType}
        onChangeText={onChangeText}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
        value={value}
      />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.subText,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    input: {
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
  });
}
