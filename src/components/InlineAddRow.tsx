import React, { useMemo } from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { ThemeColors, radius, spacing } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { Button } from './Button';

type InlineAddRowProps = {
  visible: boolean;
  value: string;
  onChangeText: (value: string) => void;
  onSubmit: () => void;
  placeholder: string;
};

// Inline "type a name + Add" row used for adding categories / sub-categories.
export function InlineAddRow({
  visible,
  value,
  onChangeText,
  onSubmit,
  placeholder,
}: InlineAddRowProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);

  if (!visible) return null;

  return (
    <View style={styles.row}>
      <TextInput
        autoFocus
        value={value}
        onChangeText={onChangeText}
        onSubmitEditing={onSubmit}
        placeholder={placeholder}
        placeholderTextColor={colors.muted}
        style={styles.input}
      />
      <Button label="Add" onPress={onSubmit} style={styles.button} />
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
      marginBottom: spacing.md,
    },
    input: {
      flex: 1,
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      color: colors.text,
      fontSize: 16,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    button: {
      justifyContent: 'center',
    },
  });
}
