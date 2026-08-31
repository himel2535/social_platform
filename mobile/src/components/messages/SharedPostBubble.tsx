import React, { useCallback, useEffect, useState } from 'react';
import { Pressable, StyleSheet, View } from 'react-native';
import { useRouter } from 'expo-router';
import { GlassCard, Avatar, Typography } from '@/components/ui';
import { Post } from '@/services/post.service';
import { getCachedPost } from '@/utils/postCache';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

type Props = {
  postId: string;
  isOwn: boolean;
  groupedWithPrevious?: boolean;
};

export function SharedPostBubble({ postId, isOwn, groupedWithPrevious = false }: Props) {
  const router = useRouter();
  const [post, setPost] = useState<Post | undefined>(() => getCachedPost(postId));

  useEffect(() => {
    setPost(getCachedPost(postId));
  }, [postId]);

  const openPost = useCallback(() => {
    router.push(`/post/${postId}`);
  }, [postId, router]);

  return (
    <View style={[styles.row, isOwn ? styles.rowOwn : styles.rowOther, groupedWithPrevious && styles.groupedRow]}>
      <Pressable onPress={openPost} accessibilityRole="button" accessibilityLabel="View shared post">
        <GlassCard variant="feed" style={styles.card}>
          <Typography variant="metadata" style={styles.label}>
            Shared a post
          </Typography>
          {post ? (
            <>
              <View style={styles.authorRow}>
                <Avatar
                  name={post.author.name}
                  uri={post.author.avatar}
                  size={28}
                  shape="roundedSquare"
                />
                <Typography variant="userName" numberOfLines={1} style={styles.authorName}>
                  {post.author.name}
                </Typography>
              </View>
              <Typography variant="postContent" numberOfLines={3} style={styles.content}>
                {post.content}
              </Typography>
            </>
          ) : (
            <Typography variant="postContent" style={styles.loadingText}>
              Tap to view post
            </Typography>
          )}
        </GlassCard>
      </Pressable>
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
  card: {
    width: 260,
    marginBottom: 0,
  },
  label: {
    color: 'rgba(255,255,255,0.55)',
    marginBottom: spacing.sm,
  },
  authorRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  authorName: {
    flex: 1,
    color: colors.textPrimary,
    fontSize: 13,
  },
  content: {
    color: 'rgba(255,255,255,0.88)',
    fontSize: 13,
    lineHeight: 19,
  },
  loadingText: {
    color: 'rgba(255,255,255,0.55)',
    fontSize: 13,
  },
});
