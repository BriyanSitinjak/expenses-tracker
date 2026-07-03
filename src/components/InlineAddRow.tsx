import React from 'react';
import { StyleSheet, TextInput, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';
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

const styles = StyleSheet.create({
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
