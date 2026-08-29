import { useState, useCallback } from 'react';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { View, StyleSheet } from 'react-native';
import {
  Screen,
  AppHeader,
  IconButton,
  EmptyState,
  LoadingSkeleton,
  Typography,
  GlassCard,
  Avatar,
  Divider,
} from '@/components/ui';
import { CommentInput } from '@/components/comments/CommentInput';
import { CommentItem } from '@/components/comments/CommentItem';
import { LikeButton } from '@/components/feed/LikeButton';
import { CommentButton } from '@/components/feed/CommentButton';
import { spacing } from '@/theme/spacing';
import { usePreview, getPreviewPost, getPreviewComments } from '@/preview';
import { getCachedPost } from '@/utils/postCache';
import { Post } from '@/services/post.service';
import { formatTimeAgo } from '@/utils/format';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [comment, setComment] = useState('');
  const { isPreviewMode } = usePreview();
  const loading = false;

  const previewPost = isPreviewMode && id ? getPreviewPost(id) : undefined;
  const previewComments = isPreviewMode && id ? getPreviewComments(id) : [];
  const cachedPost = !isPreviewMode && id ? getCachedPost(id) : undefined;

  const [likeOverrides, setLikeOverrides] = useState<
    Record<string, { isLiked: boolean; likesCount: number }>
  >({});

  const handleLike = useCallback((post: Post) => {
    setLikeOverrides((current) => {
      const existing = current[post._id] ?? {
        isLiked: post.isLiked,
        likesCount: post.likesCount,
      };
      return {
        ...current,
        [post._id]: {
          isLiked: !existing.isLiked,
          likesCount: existing.isLiked ? existing.likesCount - 1 : existing.likesCount + 1,
        },
      };
    });
  }, []);

  const applyLikeOverrides = (post: Post): Post => ({
    ...post,
    ...(likeOverrides[post._id] ?? {
      isLiked: post.isLiked,
      likesCount: post.likesCount,
    }),
  });

  const displayPost = previewPost
    ? applyLikeOverrides(previewPost)
    : cachedPost
      ? applyLikeOverrides(cachedPost)
      : undefined;

  const renderPostCard = (post: Post) => (
    <>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <View style={styles.author}>
            <Avatar name={post.author.name} uri={post.author.avatar} size={40} />
            <View style={styles.authorInfo}>
              <Typography variant="userName">{post.author.name}</Typography>
              <Typography variant="username">@{post.author.username}</Typography>
            </View>
          </View>
          <IconButton icon="ellipsis-horizontal" accessibilityLabel="Post options" />
        </View>

        <Typography variant="postContent" style={styles.postContent}>
          {post.content}
        </Typography>

        <Typography variant="metadata" style={styles.time}>
          {formatTimeAgo(post.createdAt)}
        </Typography>

        <View style={styles.actions}>
          <LikeButton
            count={post.likesCount}
            isLiked={post.isLiked}
            onPress={() => {
              const basePost = previewPost ?? cachedPost;
              if (basePost) {
                handleLike(basePost);
              }
            }}
          />
          <CommentButton count={post.commentsCount} />
        </View>
      </GlassCard>

      {isPreviewMode && previewComments.length > 0 && (
        <View style={styles.commentsSection}>
          <Typography variant="sectionTitle" style={styles.commentsTitle}>
            Comments
          </Typography>
          <Divider />
          {previewComments.map((item) => (
            <CommentItem key={item._id} comment={item} />
          ))}
        </View>
      )}
    </>
  );

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <AppHeader
        title="Post"
        leftAction={
          <IconButton
            icon="arrow-back"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          />
        }
      />

      {loading ? (
        <LoadingSkeleton lines={4} />
      ) : displayPost ? (
        renderPostCard(displayPost)
      ) : (
        <EmptyState
          title="Post not found"
          message="This post may have been removed or is not yet available."
          icon="document-outline"
        />
      )}

      {isPreviewMode ? (
        <CommentInput value={comment} onChangeText={setComment} onSubmit={() => {}} />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xxxl,
  },
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
  postContent: {
    marginBottom: spacing.sm,
  },
  time: {
    marginBottom: spacing.md,
  },
  actions: {
    flexDirection: 'row',
    gap: spacing.xl,
  },
  commentsSection: {
    marginBottom: spacing.lg,
  },
  commentsTitle: {
    marginBottom: spacing.md,
  },
});
