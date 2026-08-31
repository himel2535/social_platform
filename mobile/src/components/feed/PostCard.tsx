import React, { memo, useCallback } from 'react';
import { View, StyleSheet, Pressable, Share } from 'react-native';
import { GlassCard, Avatar, Typography } from '@/components/ui';
import { LikeButton } from './LikeButton';
import { CommentButton } from './CommentButton';
import { PostOptionsMenu } from './PostOptionsMenu';
import { Post } from '@/services/post.service';
import { spacing } from '@/theme/spacing';
import { formatTimeAgo } from '@/utils/format';
import { getPostShareUrl } from '@/utils/postShare';
import { useRouter } from 'expo-router';
import { IconButton } from '@/components/ui/IconButton';

type Props = {
  post: Post;
  onLike?: () => void;
  onComment?: () => void;
};

const FEED_ACTION_COLOR = 'rgba(255, 255, 255, 0.55)';
const FEED_META_COLOR = 'rgba(255, 255, 255, 0.45)';
const FEED_CONTENT_COLOR = 'rgba(255, 255, 255, 0.88)';

export const PostCard = memo(function PostCard({ post, onLike, onComment }: Props) {
  const router = useRouter();

  const handlePostPress = () => {
    router.push(`/post/${post._id}`);
  };

  const handleAuthorPress = () => {
    router.push(`/profile/${post.author.username}`);
  };

  const handleShare = useCallback(async () => {
    const url = getPostShareUrl(post._id);
    try {
      await Share.share({ message: url, url });
    } catch {
      // User dismissed share sheet
    }
  }, [post._id]);

  const actionCountStyle = styles.actionCount;

  return (
    <GlassCard variant="feed" style={styles.card}>
      <View style={styles.header}>
        <Pressable
          style={styles.author}
          onPress={handleAuthorPress}
          accessibilityRole="button"
          accessibilityLabel={`View profile for ${post.author.name}`}
        >
          <Avatar
            name={post.author.name}
            uri={post.author.avatar}
            size={36}
            shape="roundedSquare"
          />
          <View style={styles.authorInfo}>
            <Typography variant="userName" style={styles.authorName}>
              {post.author.name}
            </Typography>
            <Typography variant="username" style={styles.authorMeta}>
              @{post.author.username} · {formatTimeAgo(post.createdAt)}
            </Typography>
          </View>
        </Pressable>
        <PostOptionsMenu post={post} />
      </View>

      <Pressable
        onPress={handlePostPress}
        accessibilityRole="button"
        accessibilityLabel="View post"
      >
        <Typography variant="postContent" style={styles.content}>
          {post.content}
        </Typography>
      </Pressable>

      <View style={styles.actions}>
        <LikeButton
          count={post.likesCount}
          isLiked={post.likedByMe}
          onPress={onLike}
          iconColor={FEED_ACTION_COLOR}
          likedIconColor="#5DCAA5"
          iconSize={15}
          countStyle={actionCountStyle}
          compact
        />
        <CommentButton
          count={post.commentsCount}
          onPress={onComment || handlePostPress}
          iconColor={FEED_ACTION_COLOR}
          iconSize={15}
          countStyle={actionCountStyle}
          compact
        />
        <IconButton
          icon="share-outline"
          onPress={handleShare}
          color={FEED_ACTION_COLOR}
          size={15}
          accessibilityLabel="Share post"
          style={styles.shareButton}
        />
      </View>
    </GlassCard>
  );
});

const styles = StyleSheet.create({
  card: {
    marginBottom: spacing.sm,
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
    gap: spacing.sm,
    flex: 1,
  },
  authorInfo: {
    flex: 1,
    gap: 2,
  },
  authorName: {
    color: '#FFFFFF',
    fontSize: 13.5,
    fontWeight: '500',
  },
  authorMeta: {
    color: FEED_META_COLOR,
    fontSize: 11,
  },
  content: {
    color: FEED_CONTENT_COLOR,
    fontSize: 13.5,
    lineHeight: 21,
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 10,
  },
  actionCount: {
    color: FEED_ACTION_COLOR,
    fontSize: 12,
  },
  shareButton: {
    marginLeft: 'auto',
    width: 36,
    height: 36,
  },
});
