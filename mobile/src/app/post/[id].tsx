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
import { formatTimeAgo } from '@/utils/format';

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [comment, setComment] = useState('');
  const { isPreviewMode } = usePreview();
  const loading = false;

  const previewPost = isPreviewMode && id ? getPreviewPost(id) : undefined;
  const previewComments = isPreviewMode && id ? getPreviewComments(id) : [];

  const [likeOverrides, setLikeOverrides] = useState<
    Record<string, { isLiked: boolean; likesCount: number }>
  >({});

  const handleLike = useCallback(() => {
    if (!previewPost) return;
    setLikeOverrides((current) => {
      const existing = current[previewPost._id] ?? {
        isLiked: previewPost.isLiked,
        likesCount: previewPost.likesCount,
      };
      return {
        ...current,
        [previewPost._id]: {
          isLiked: !existing.isLiked,
          likesCount: existing.isLiked ? existing.likesCount - 1 : existing.likesCount + 1,
        },
      };
    });
  }, [previewPost]);

  const displayPost = previewPost
    ? {
        ...previewPost,
        ...(likeOverrides[previewPost._id] ?? {
          isLiked: previewPost.isLiked,
          likesCount: previewPost.likesCount,
        }),
      }
    : undefined;

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
      ) : isPreviewMode && displayPost ? (
        <>
          <GlassCard style={styles.card}>
            <View style={styles.header}>
              <View style={styles.author}>
                <Avatar
                  name={displayPost.author.name}
                  uri={displayPost.author.avatar}
                  size={40}
                />
                <View style={styles.authorInfo}>
                  <Typography variant="userName">{displayPost.author.name}</Typography>
                  <Typography variant="username">@{displayPost.author.username}</Typography>
                </View>
              </View>
              <IconButton icon="ellipsis-horizontal" accessibilityLabel="Post options" />
            </View>

            <Typography variant="postContent" style={styles.postContent}>
              {displayPost.content}
            </Typography>

            <Typography variant="metadata" style={styles.time}>
              {formatTimeAgo(displayPost.createdAt)}
            </Typography>

            <View style={styles.actions}>
              <LikeButton
                count={displayPost.likesCount}
                isLiked={displayPost.isLiked}
                onPress={handleLike}
              />
              <CommentButton count={displayPost.commentsCount} />
            </View>
          </GlassCard>

          {previewComments.length > 0 && (
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
      ) : id === 'preview-1' ? (
        <View style={styles.placeholder}>
          <Typography variant="postContent">
            Post detail view for ID: {id}. Full post and comments will load here in Phase 7–9.
          </Typography>
        </View>
      ) : (
        <EmptyState
          title="Post not found"
          message="This post may have been removed or is not yet available."
          icon="document-outline"
        />
      )}

      <CommentInput value={comment} onChangeText={setComment} onSubmit={() => {}} />
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
  placeholder: {
    paddingVertical: spacing.lg,
  },
});
