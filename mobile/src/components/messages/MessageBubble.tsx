import React from 'react';
import { View, StyleSheet, Platform } from 'react-native';
import { BlurView } from 'expo-blur';
import { Ionicons } from '@expo/vector-icons';
import { Typography } from '@/components/ui';
import { feedGlass } from '@/theme/glass';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

export type DisplayMessage = {
  _id: string;
  text: string;
  createdAt: string;
  readAt?: string | null;
  isOwn: boolean;
  pending?: boolean;
};

type Props = {
  message: DisplayMessage;
  groupedWithPrevious?: boolean;
};

export function MessageBubble({ message, groupedWithPrevious = false }: Props) {
  const { isOwn, text, readAt, pending } = message;

  const statusIcon =
    isOwn && !pending ? (
      readAt ? (
        <Ionicons name="checkmark-done" size={12} color="#5DCAA5" style={styles.statusIcon} />
      ) : (
        <Ionicons name="checkmark" size={12} color="rgba(255,255,255,0.45)" style={styles.statusIcon} />
      )
    ) : null;

  const bubbleContent = (
    <>
      <Typography variant="postContent" style={[styles.text, isOwn ? styles.sentText : styles.receivedText]}>
        {text}
      </Typography>
      {statusIcon}
    </>
  );

  if (isOwn) {
    return (
      <View
        style={[
          styles.row,
          styles.rowOwn,
          groupedWithPrevious ? styles.groupedRow : null,
          pending && styles.pending,
        ]}
      >
        <View style={[styles.bubble, styles.sentBubble]}>{bubbleContent}</View>
      </View>
    );
  }

  return (
    <View style={[styles.row, styles.rowOther, groupedWithPrevious ? styles.groupedRow : null]}>
      {Platform.OS === 'ios' || Platform.OS === 'android' ? (
        <BlurView intensity={feedGlass.blurIntensity} tint="dark" style={[styles.bubble, styles.receivedBubble]}>
          {bubbleContent}
        </BlurView>
      ) : (
        <View style={[styles.bubble, styles.receivedBubble, styles.receivedSolid]}>{bubbleContent}</View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  row: {
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
    paddingHorizontal: spacing.lg,
  },
  groupedRow: {
    marginTop: 2,
  },
  rowOwn: {
    alignItems: 'flex-end',
  },
  rowOther: {
    alignItems: 'flex-start',
  },
  pending: {
    opacity: 0.65,
  },
  bubble: {
    maxWidth: '80%',
    borderRadius: 16,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    overflow: 'hidden',
  },
  sentBubble: {
    backgroundColor: 'rgba(124, 58, 237, 0.35)',
    borderWidth: 1,
    borderColor: 'rgba(124, 58, 237, 0.45)',
  },
  receivedBubble: {
    borderWidth: 1,
    borderColor: feedGlass.borderColor,
    backgroundColor: feedGlass.backgroundColor,
  },
  receivedSolid: {
    backgroundColor: feedGlass.backgroundColor,
  },
  text: {
    fontSize: 14,
    lineHeight: 20,
  },
  sentText: {
    color: colors.textPrimary,
  },
  receivedText: {
    color: 'rgba(255,255,255,0.88)',
  },
  statusIcon: {
    alignSelf: 'flex-end',
    marginTop: 4,
  },
});
