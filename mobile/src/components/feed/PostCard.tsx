import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { GlassCard, Avatar, Typography, IconButton } from '@/components/ui';
import { LikeButton } from './LikeButton';
import { CommentButton } from './CommentButton';
import { Post } from '@/services/post.service';
import { spacing } from '@/theme/spacing';
import { formatTimeAgo } from '@/utils/format';
import { useRouter } from 'expo-router';

type Props = {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
};

export function PostCard({ post, onLike, onComment }: Props) {
  const router = useRouter();

  const handlePostPress = () => {
    router.push(`/post/${post._id}`);
  };

  const handleAuthorPress = () => {
    router.push(`/profile/${post.author.username}`);
  };

  return (
    <GlassCard style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.author}
          onPress={handleAuthorPress}
          accessibilityRole="button"
          accessibilityLabel={`View profile for ${post.author.name}`}
        >
          <Avatar name={post.author.name} uri={post.author.avatar} size={40} />
          <View style={styles.authorInfo}>
            <Typography variant="userName">{post.author.name}</Typography>
            <Typography variant="username">@{post.author.username}</Typography>
          </View>
        </Pressable>
        <IconButton
          icon="ellipsis-horizontal"
          accessibilityLabel="Post options"
          onPress={() => {}}
        />
      </View>

      <Pressable
        onPress={handlePostPress}
        accessibilityRole="button"
        accessibilityLabel="View post"
      >
        <Typography variant="postContent" style={styles.content}>
          {post.content}
        </Typography>

        <Typography variant="metadata" style={styles.time}>
          {formatTimeAgo(post.createdAt)}
        </Typography>
      </Pressable>

      <View style={styles.actions}>
        <LikeButton count={post.likesCount} isLiked={post.likedByMe} onPress={onLike} />
        <CommentButton count={post.commentsCount} onPress={onComment || handlePostPress} />
      </View>
    </GlassCard>
  );
}

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.lg,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: spacing.md,
  },
  author: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    flex: 1,
  },
  authorInfo: {
    flex: 1,
  },
  content: {
    marginBottom: spacing.sm,
  },
  time: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
});
