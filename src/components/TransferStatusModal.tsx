import React from 'react';
import { ActivityIndicator, Modal, StyleSheet, Text, View } from 'react-native';
import { colors, spacing, surface } from '../constants/theme';
import { ProgressBar } from './ProgressBar';

type TransferStatusModalProps = {
  visible: boolean;
  title: string;
  message: string;
  step?: number;
  totalSteps?: number;
};

// Blocking progress overlay for import/export with step + progress bar.
export function TransferStatusModal({
  visible,
  title,
  message,
  step = 1,
  totalSteps = 1,
}: TransferStatusModalProps) {
  const safeTotal = Math.max(1, totalSteps);
  const safeStep = Math.max(1, Math.min(step, safeTotal));
  const progress = safeStep / safeTotal;

  return (
    <Modal visible={visible} transparent animationType="fade" statusBarTranslucent>
      <View style={styles.backdrop} pointerEvents="auto">
        <View style={styles.card}>
          <ActivityIndicator size="large" color={colors.primary} />
          <Text style={styles.title}>{title}</Text>
          <Text style={styles.step}>
            Step {safeStep} of {safeTotal}
          </Text>
          <View style={styles.barWrap}>
            <ProgressBar progress={progress} height={8} duration={280} />
          </View>
          <Text style={styles.message}>{message}</Text>
        </View>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    alignItems: 'center',
    backgroundColor: colors.overlay,
    flex: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
  card: {
    alignItems: 'center',
    gap: spacing.sm,
    maxWidth: 320,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
    width: '100%',
    ...surface('md'),
  },
  title: {
    color: colors.text,
    fontSize: 17,
    fontWeight: '800',
    marginTop: spacing.sm,
    textAlign: 'center',
  },
  step: {
    color: colors.primary,
    fontSize: 12,
    fontWeight: '800',
    letterSpacing: 0.2,
  },
  barWrap: {
    marginTop: spacing.xs,
    width: '100%',
  },
  message: {
    color: colors.subText,
    fontSize: 14,
    lineHeight: 20,
    marginTop: spacing.xs,
    textAlign: 'center',
  },
});
