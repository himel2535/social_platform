import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Avatar, Typography, Badge } from '@/components/ui';
import { ConversationPreview } from '@/services/message.service';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { formatTimeAgo } from '@/utils/format';

type Props = {
  conversation: ConversationPreview;
  isTyping?: boolean;
  onPress: () => void;
};

export function ConversationListItem({ conversation, isTyping = false, onPress }: Props) {
  const { participant, lastMessage, lastMessageAt, unreadCount } = conversation;
  const previewText = isTyping
    ? 'typing...'
    : lastMessage?.type === 'shared_post'
      ? 'Shared a post'
      : lastMessage?.text || 'No messages yet';

  return (
    <Pressable
      style={styles.container}
      onPress={onPress}
      accessibilityRole="button"
      accessibilityLabel={`Conversation with ${participant.name}`}
    >
      <Avatar name={participant.name} uri={participant.avatar} size={48} shape="roundedSquare" />
      <View style={styles.content}>
        <View style={styles.topRow}>
          <Typography variant="userName" style={styles.name} numberOfLines={1}>
            {participant.name}
          </Typography>
          {lastMessageAt ? (
            <Typography variant="metadata" style={styles.time}>
              {formatTimeAgo(lastMessageAt)}
            </Typography>
          ) : null}
        </View>
        <View style={styles.bottomRow}>
          <Typography
            variant="metadata"
            style={[styles.preview, isTyping && styles.typingPreview]}
            numberOfLines={1}
          >
            {previewText}
          </Typography>
          {unreadCount > 0 ? <Badge count={unreadCount} /> : null}
        </View>
      </View>
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.lg,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  content: {
    flex: 1,
    gap: 4,
  },
  topRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  bottomRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    gap: spacing.sm,
  },
  name: {
    flex: 1,
    color: colors.textPrimary,
  },
  time: {
    color: 'rgba(255,255,255,0.45)',
    fontSize: 11,
  },
  preview: {
    flex: 1,
    color: 'rgba(255,255,255,0.55)',
  },
  typingPreview: {
    fontStyle: 'italic',
    color: 'rgba(93, 202, 165, 0.85)',
  },
});
