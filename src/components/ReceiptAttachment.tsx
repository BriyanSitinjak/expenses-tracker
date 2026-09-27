import React, { useMemo, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { ThemeColors, radius, spacing, withAlpha } from '../constants/theme';
import { useAppTheme } from '../hooks/useAppTheme';
import { pickReceiptFromLibrary, takeReceiptPhoto } from '../utils/receipt';
import { Icon } from './Icon';

type ReceiptAttachmentProps = {
  uri?: string;
  onChange: (uri: string | undefined) => void;
  disabled?: boolean;
};

// Camera / gallery picker for attaching an optional receipt photo to an expense.
export function ReceiptAttachment({ uri, onChange, disabled = false }: ReceiptAttachmentProps) {
  const { colors } = useAppTheme();
  const styles = useMemo(() => createStyles(colors), [colors]);
  const [busy, setBusy] = useState(false);

  async function handleResult(
    action: () => ReturnType<typeof takeReceiptPhoto>
  ) {
    if (disabled || busy) return;
    setBusy(true);
    try {
      const result = await action();
      if (result.ok) {
        onChange(result.uri);
        return;
      }
      if (result.reason === 'cancelled') return;
      Alert.alert(
        result.reason === 'permission' ? 'Permission needed' : 'Could not attach receipt',
        result.message ?? 'Please try again.'
      );
    } finally {
      setBusy(false);
    }
  }

  function openSourceMenu() {
    if (disabled || busy) return;
    Alert.alert('Attach receipt', 'Photograph a receipt or pick one from your library.', [
      { text: 'Take photo', onPress: () => void handleResult(takeReceiptPhoto) },
      { text: 'Choose photo', onPress: () => void handleResult(pickReceiptFromLibrary) },
      { text: 'Cancel', style: 'cancel' },
    ]);
  }

  return (
    <View style={styles.wrap}>
      <Text style={styles.label}>Receipt (optional)</Text>
      <Text style={styles.hint}>Ready for AI scan later — attach a photo for now.</Text>

      {uri ? (
        <View style={styles.previewCard}>
          <Image source={{ uri }} style={styles.preview} resizeMode="cover" />
          <View style={styles.previewActions}>
            <Pressable
              onPress={openSourceMenu}
              disabled={disabled || busy}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.pressed,
                (disabled || busy) && styles.disabled,
              ]}
            >
              <Icon name="camera" size={16} color={colors.primary} />
              <Text style={styles.actionText}>Replace</Text>
            </Pressable>
            <Pressable
              onPress={() => onChange(undefined)}
              disabled={disabled || busy}
              style={({ pressed }) => [
                styles.actionBtn,
                pressed && styles.pressed,
                (disabled || busy) && styles.disabled,
              ]}
            >
              <Icon name="trash" size={16} color={colors.danger} />
              <Text style={[styles.actionText, styles.removeText]}>Remove</Text>
            </Pressable>
          </View>
        </View>
      ) : (
        <Pressable
          onPress={openSourceMenu}
          disabled={disabled || busy}
          style={({ pressed }) => [
            styles.emptyBtn,
            pressed && styles.pressed,
            (disabled || busy) && styles.disabled,
          ]}
          accessibilityRole="button"
          accessibilityLabel="Open camera or photo library"
        >
          {busy ? (
            <ActivityIndicator color={colors.primary} />
          ) : (
            <>
              <View style={styles.emptyIcon}>
                <Icon name="camera" size={22} color={colors.primary} />
              </View>
              <View style={styles.emptyCopy}>
                <Text style={styles.emptyTitle}>Open camera</Text>
                <Text style={styles.emptySubtitle}>Or choose a photo from your library</Text>
              </View>
              <Icon name="chevron-forward" size={18} color={colors.muted} />
            </>
          )}
        </Pressable>
      )}
    </View>
  );
}

function createStyles(colors: ThemeColors) {
  return StyleSheet.create({
    wrap: {
      marginBottom: spacing.md,
    },
    label: {
      color: colors.subText,
      fontWeight: '600',
      marginBottom: spacing.xs,
    },
    hint: {
      color: colors.muted,
      fontSize: 12,
      lineHeight: 16,
      marginBottom: spacing.sm,
    },
    emptyBtn: {
      alignItems: 'center',
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderStyle: 'dashed',
      borderWidth: 1,
      flexDirection: 'row',
      gap: spacing.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
    },
    emptyIcon: {
      alignItems: 'center',
      backgroundColor: withAlpha(colors.primary, 0.12),
      borderRadius: radius.md,
      height: 44,
      justifyContent: 'center',
      width: 44,
    },
    emptyCopy: {
      flex: 1,
      gap: 2,
      minWidth: 0,
    },
    emptyTitle: {
      color: colors.text,
      fontSize: 15,
      fontWeight: '800',
    },
    emptySubtitle: {
      color: colors.subText,
      fontSize: 12,
    },
    previewCard: {
      backgroundColor: colors.bgElevated,
      borderColor: colors.border,
      borderRadius: radius.lg,
      borderWidth: 1,
      overflow: 'hidden',
    },
      preview: {
      backgroundColor: colors.cardAlt,
      height: 160,
      width: '100%',
    },
    previewActions: {
      flexDirection: 'row',
      gap: spacing.sm,
      padding: spacing.sm,
    },
    actionBtn: {
      alignItems: 'center',
      backgroundColor: colors.card,
      borderColor: colors.border,
      borderRadius: radius.md,
      borderWidth: 1,
      flex: 1,
      flexDirection: 'row',
      gap: spacing.xs,
      justifyContent: 'center',
      paddingVertical: spacing.sm,
    },
    actionText: {
      color: colors.primary,
      fontSize: 13,
      fontWeight: '700',
    },
    removeText: {
      color: colors.danger,
    },
    pressed: {
      opacity: 0.75,
    },
    disabled: {
      opacity: 0.45,
    },
  });
}
