import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Avatar, Typography, IconButton } from '@/components/ui';
import { Comment } from '@/services/comment.service';
import { spacing } from '@/theme/spacing';
import { formatTimeAgo } from '@/utils/format';
import { colors } from '@/theme/colors';

type Props = {
  comment: Comment;
  canDelete?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
};

export function CommentItem({ comment, canDelete = false, onDelete, deleting = false }: Props) {
  return (
    <View style={styles.container}>
      <Avatar name={comment.author.name} uri={comment.author.avatar} size={32} />
      <View style={styles.content}>
        <View style={styles.header}>
          <Typography variant="userName">{comment.author.name}</Typography>
          <Typography variant="metadata">{formatTimeAgo(comment.createdAt)}</Typography>
          {canDelete ? (
            <IconButton
              icon="trash-outline"
              accessibilityLabel="Delete comment"
              color={colors.error}
              onPress={onDelete}
              disabled={deleting}
            />
          ) : null}
        </View>
        <Typography variant="postContent">{comment.content}</Typography>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  content: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.xs,
  },
});
