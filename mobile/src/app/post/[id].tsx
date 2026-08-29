import { useState, useCallback, useEffect } from 'react';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { View, StyleSheet, Pressable } from 'react-native';
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
  useToast,
} from '@/components/ui';
import { CommentInput } from '@/components/comments/CommentInput';
import { CommentItem } from '@/components/comments/CommentItem';
import { LikeButton } from '@/components/feed/LikeButton';
import { CommentButton } from '@/components/feed/CommentButton';
import { spacing } from '@/theme/spacing';
import { usePreview, getPreviewPost, getPreviewComments } from '@/preview';
import { getCachedPost, updateCachedPostCommentsCount } from '@/utils/postCache';
import { Post } from '@/services/post.service';
import { Comment, commentService } from '@/services/comment.service';
import { formatTimeAgo } from '@/utils/format';
import { useToggleLike } from '@/hooks/useToggleLike';
import { useAuth } from '@/hooks/useAuth';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';

const MAX_COMMENT_LENGTH = 500;

export default function PostDetailScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const [commentText, setCommentText] = useState('');
  const { isPreviewMode } = usePreview();
  const { toggleLike } = useToggleLike();
  const { user } = useAuth();
  const { showToast } = useToast();
  const loading = false;

  const previewPost = isPreviewMode && id ? getPreviewPost(id) : undefined;
  const previewComments = isPreviewMode && id ? getPreviewComments(id) : [];
  const cachedPost = !isPreviewMode && id ? getCachedPost(id) : undefined;

  const [authenticatedPost, setAuthenticatedPost] = useState<Post | undefined>(cachedPost);
  const [comments, setComments] = useState<Comment[]>([]);
  const [commentsLoading, setCommentsLoading] = useState(false);
  const [commentsError, setCommentsError] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);

  useEffect(() => {
    if (!isPreviewMode && cachedPost) {
      setAuthenticatedPost(cachedPost);
    }
  }, [isPreviewMode, cachedPost]);

  const loadComments = useCallback(async () => {
    if (isPreviewMode || !id) {
      return;
    }

    setCommentsLoading(true);
    setCommentsError('');

    try {
      const result = await commentService.getComments(id);
      setComments(result.comments);
    } catch (err) {
      setCommentsError(normalizeApiError(err as ApiError, 'general'));
    } finally {
      setCommentsLoading(false);
    }
  }, [id, isPreviewMode]);

  useFocusEffect(
    useCallback(() => {
      if (!isPreviewMode && id && cachedPost) {
        loadComments();
      }
    }, [isPreviewMode, id, cachedPost, loadComments]),
  );

  const [likeOverrides, setLikeOverrides] = useState<
    Record<string, { likedByMe: boolean; likesCount: number }>
  >({});

  const handlePreviewLike = useCallback((post: Post) => {
    setLikeOverrides((current) => {
      const existing = current[post._id] ?? {
        likedByMe: post.likedByMe,
        likesCount: post.likesCount,
      };
      return {
        ...current,
        [post._id]: {
          likedByMe: !existing.likedByMe,
          likesCount: existing.likedByMe ? existing.likesCount - 1 : existing.likesCount + 1,
        },
      };
    });
  }, []);

  const applyPreviewLikeOverrides = (post: Post): Post => ({
    ...post,
    ...(likeOverrides[post._id] ?? {
      likedByMe: post.likedByMe,
      likesCount: post.likesCount,
    }),
  });

  const displayPost = isPreviewMode
    ? previewPost
      ? applyPreviewLikeOverrides(previewPost)
      : undefined
    : authenticatedPost;

  const handleAuthenticatedLike = useCallback(() => {
    if (authenticatedPost) {
      toggleLike(authenticatedPost, undefined, setAuthenticatedPost);
    }
  }, [authenticatedPost, toggleLike]);

  const updateCommentsCount = useCallback(
    (commentsCount: number) => {
      if (!id) {
        return;
      }
      updateCachedPostCommentsCount(id, commentsCount);
      setAuthenticatedPost((current) =>
        current ? { ...current, commentsCount } : current,
      );
    },
    [id],
  );

  const handleSubmitComment = useCallback(async () => {
    const trimmed = commentText.trim();
    if (!trimmed || !id || isPreviewMode) {
      return;
    }

    setSubmitting(true);

    try {
      const result = await commentService.createComment(id, trimmed);
      setCommentText('');
      setComments((current) => [result.comment, ...current]);
      updateCommentsCount(result.commentsCount);
    } catch (err) {
      showToast(normalizeApiError(err as ApiError, 'general'), 'error');
    } finally {
      setSubmitting(false);
    }
  }, [commentText, id, isPreviewMode, showToast, updateCommentsCount]);

  const handleDeleteComment = useCallback(
    async (commentId: string) => {
      setDeletingId(commentId);

      try {
        const result = await commentService.deleteComment(commentId);
        setComments((current) => current.filter((item) => item._id !== commentId));
        updateCommentsCount(result.commentsCount);
      } catch (err) {
        showToast(normalizeApiError(err as ApiError, 'general'), 'error');
      } finally {
        setDeletingId(null);
      }
    },
    [showToast, updateCommentsCount],
  );

  const renderPostCard = (post: Post) => (
    <>
      <GlassCard style={styles.card}>
        <View style={styles.header}>
          <Pressable
            style={styles.author}
            onPress={() => router.push(`/profile/${post.author.username}`)}
            accessibilityRole="button"
            accessibilityLabel={`View profile for ${post.author.name}`}
          >
            <Avatar name={post.author.name} uri={post.author.avatar} size={40} />
            <View style={styles.authorInfo}>
              <Typography variant="userName">{post.author.name}</Typography>
              <Typography variant="username">@{post.author.username}</Typography>
            </View>
          </Pressable>
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
            isLiked={post.likedByMe}
            onPress={
              isPreviewMode
                ? () => previewPost && handlePreviewLike(previewPost)
                : handleAuthenticatedLike
            }
          />
          <CommentButton count={post.commentsCount} />
        </View>
      </GlassCard>
    </>
  );

  const renderPreviewComments = () => {
    if (previewComments.length === 0) {
      return null;
    }

    return (
      <View style={styles.commentsSection}>
        <Typography variant="sectionTitle" style={styles.commentsTitle}>
          Comments
        </Typography>
        <Divider />
        {previewComments.map((item) => (
          <CommentItem key={item._id} comment={item} />
        ))}
      </View>
    );
  };

  const renderAuthenticatedComments = () => (
    <View style={styles.commentsSection}>
      <Typography variant="sectionTitle" style={styles.commentsTitle}>
        Comments
      </Typography>
      <Divider />
      {commentsLoading ? (
        <LoadingSkeleton lines={3} />
      ) : commentsError ? (
        <View style={styles.commentsMessage}>
          <Typography variant="metadata">{commentsError}</Typography>
          <IconButton
            icon="refresh-outline"
            accessibilityLabel="Retry loading comments"
            onPress={loadComments}
          />
        </View>
      ) : comments.length === 0 ? (
        <Typography variant="metadata" style={styles.commentsMessage}>
          No comments yet. Be the first to comment!
        </Typography>
      ) : (
        comments.map((item) => (
          <CommentItem
            key={item._id}
            comment={item}
            canDelete={user?._id === item.author._id}
            onDelete={() => handleDeleteComment(item._id)}
            deleting={deletingId === item._id}
          />
        ))
      )}
    </View>
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
        <>
          {renderPostCard(displayPost)}
          {isPreviewMode ? renderPreviewComments() : renderAuthenticatedComments()}
        </>
      ) : (
        <EmptyState
          title="Post not found"
          message="This post may have been removed or is not yet available."
          icon="document-outline"
        />
      )}

      {isPreviewMode ? (
        <CommentInput value={commentText} onChangeText={setCommentText} onSubmit={() => {}} />
      ) : displayPost ? (
        <CommentInput
          value={commentText}
          onChangeText={setCommentText}
          onSubmit={handleSubmitComment}
          userName={user?.name}
          loading={submitting}
        />
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
  commentsMessage: {
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
});
