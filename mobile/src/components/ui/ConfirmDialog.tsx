import React from 'react';
import {
  Modal as RNModal,
  View,
  Pressable,
  StyleSheet,
  Platform,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { Typography } from './Typography';
import { colors } from '@/theme/colors';
import { spacing } from '@/theme/spacing';

type Props = {
  visible: boolean;
  title: string;
  message?: string;
  confirmLabel?: string;
  cancelLabel?: string;
  destructive?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

export function ConfirmDialog({
  visible,
  title,
  message,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  destructive = false,
  onConfirm,
  onCancel,
}: Props) {
  return (
    <RNModal visible={visible} transparent animationType="fade" onRequestClose={onCancel}>
      <Pressable style={styles.overlay} onPress={onCancel}>
        {Platform.OS === 'ios' || Platform.OS === 'android' ? (
          <BlurView intensity={40} tint="dark" style={StyleSheet.absoluteFill} />
        ) : null}
        <View style={styles.dim} />
      </Pressable>

      <View style={styles.centered} pointerEvents="box-none">
        <Pressable style={styles.card} onPress={(e) => e.stopPropagation()}>
          {Platform.OS === 'ios' || Platform.OS === 'android' ? (
            <BlurView intensity={70} tint="dark" style={styles.cardBlur}>
              <DialogContent
                title={title}
                message={message}
                confirmLabel={confirmLabel}
                cancelLabel={cancelLabel}
                destructive={destructive}
                onConfirm={onConfirm}
                onCancel={onCancel}
              />
            </BlurView>
          ) : (
            <View style={[styles.cardBlur, styles.cardSolid]}>
              <DialogContent
                title={title}
                message={message}
                confirmLabel={confirmLabel}
                cancelLabel={cancelLabel}
                destructive={destructive}
                onConfirm={onConfirm}
                onCancel={onCancel}
              />
            </View>
          )}
        </Pressable>
      </View>
    </RNModal>
  );
}

type ContentProps = {
  title: string;
  message?: string;
  confirmLabel: string;
  cancelLabel: string;
  destructive: boolean;
  onConfirm: () => void;
  onCancel: () => void;
};

function DialogContent({
  title,
  message,
  confirmLabel,
  cancelLabel,
  destructive,
  onConfirm,
  onCancel,
}: ContentProps) {
  return (
    <>
      <Typography variant="sectionTitle" style={styles.title}>
        {title}
      </Typography>
      {message ? (
        <Typography variant="postContent" style={styles.message}>
          {message}
        </Typography>
      ) : null}
      <View style={styles.actions}>
        <Pressable
          style={styles.cancelButton}
          onPress={onCancel}
          accessibilityRole="button"
          accessibilityLabel={cancelLabel}
        >
          <Typography variant="button" style={styles.cancelText}>
            {cancelLabel}
          </Typography>
        </Pressable>
        <Pressable
          style={[styles.confirmButton, destructive && styles.confirmDestructive]}
          onPress={onConfirm}
          accessibilityRole="button"
          accessibilityLabel={confirmLabel}
        >
          <Typography variant="button" style={styles.confirmText}>
            {confirmLabel}
          </Typography>
        </Pressable>
      </View>
    </>
  );
}

const styles = StyleSheet.create({
  overlay: {
    ...StyleSheet.absoluteFill,
  },
  dim: {
    ...StyleSheet.absoluteFill,
    backgroundColor: 'rgba(0,0,0,0.45)',
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.xl,
  },
  card: {
    width: '100%',
    maxWidth: 340,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.08)',
  },
  cardBlur: {
    backgroundColor: 'rgba(20,22,35,0.55)',
    padding: spacing.xl,
  },
  cardSolid: {
    backgroundColor: 'rgba(20,22,35,0.95)',
  },
  title: {
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  message: {
    textAlign: 'center',
    color: 'rgba(255,255,255,0.65)',
    marginBottom: spacing.lg,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.md,
  },
  cancelButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.15)',
    alignItems: 'center',
  },
  cancelText: {
    color: colors.textPrimary,
  },
  confirmButton: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: 12,
    backgroundColor: colors.primary,
    alignItems: 'center',
  },
  confirmDestructive: {
    backgroundColor: 'rgba(244,63,94,0.25)',
    borderWidth: 1,
    borderColor: 'rgba(244,63,94,0.5)',
  },
  confirmText: {
    color: colors.textPrimary,
  },
});
