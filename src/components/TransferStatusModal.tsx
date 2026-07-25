import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { colors, radius, spacing } from '../constants/theme';

type TransferStatusModalProps = {
  visible: boolean;
  title: string;
  message: string;
};

// Blocking progress overlay for import/export so the UI can show work in progress.
export function TransferStatusModal({ visible, title, message }: TransferStatusModalProps) {
  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop}>
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: 'rgba(15, 23, 42, 0.45)',
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignItems: 'center',
    backgroundColor: colors.card,
    borderColor: colors.border,
    borderRadius: radius.lg,
    borderWidth: 1,
    gap: spacing.sm,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: '100%',
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  message: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    textAlign: 'center',
  },
});
