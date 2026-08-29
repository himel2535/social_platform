import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { Avatar, Typography, IconButton } from '@/components/ui';
import { Comment } from '@/services/comment.service';
import { spacing } from '@/theme/spacing';
import { formatTimeAgo } from '@/utils/format';
import { colors } from '@/theme/colors';
import { useRouter } from 'expo-router';

type Props = {
  comment: Comment;
  canDelete?: boolean;
  onDelete?: () => void;
  deleting?: boolean;
  onAuthorPress?: () => void;
};

export function CommentItem({
  comment,
  canDelete = false,
  onDelete,
  deleting = false,
  onAuthorPress,
}: Props) {
  const router = useRouter();

  const handleAuthorPress = () => {
    if (onAuthorPress) {
      onAuthorPress();
      return;
    }
    router.push(`/profile/${comment.author.username}`);
  };

  return (
    <View style={styles.container}>
      <Pressable
        style={styles.authorPressable}
        onPress={handleAuthorPress}
        accessibilityRole="button"
        accessibilityLabel={`View profile for ${comment.author.name}`}
      >
        <Avatar name={comment.author.name} uri={comment.author.avatar} size={32} />
        <View style={styles.content}>
          <View style={styles.header}>
            <Typography variant="userName">{comment.author.name}</Typography>
            <Typography variant="metadata">{formatTimeAgo(comment.createdAt)}</Typography>
          </View>
          <Typography variant="postContent">{comment.content}</Typography>
        </View>
      </Pressable>
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
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.sm,
    paddingVertical: spacing.md,
  },
  authorPressable: {
    flex: 1,
    flexDirection: 'row',
    gap: spacing.md,
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
