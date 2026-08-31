import React, { useState, useCallback } from 'react';
import { Pressable, Share, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, IconButton, Typography, useToast, ConfirmDialog } from '@/components/ui';
import { SharePostSheet } from '@/components/feed/SharePostSheet';
import { Post, postService } from '@/services/post.service';
import { useAuth } from '@/hooks/useAuth';
import { glass } from '@/theme/glass';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { ApiError } from '@/services/api';
import { notifyPostDeleted } from '@/utils/feedEvents';
import { removeCachedPost } from '@/utils/postCache';
import { getPostShareUrl } from '@/utils/postShare';

type Props = {
  post: Post;
};

type MenuItem = {
  key: string;
  label: string;
  icon: keyof typeof Ionicons.glyphMap;
  onPress: () => void;
  destructive?: boolean;
};

export function PostOptionsMenu({ post }: Props) {
  const [open, setOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [reportConfirmOpen, setReportConfirmOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const { user } = useAuth();
  const { showToast } = useToast();

  const isOwnPost = user?._id === post.author._id;

  const close = useCallback(() => setOpen(false), []);

  const handleShare = useCallback(() => {
    close();
    setShareOpen(true);
  }, [close]);

  const handleNativeShare = useCallback(async () => {
    const url = getPostShareUrl(post._id);
    try {
      await Share.share({ message: url, url });
    } catch {
      // User dismissed share sheet
    }
  }, [post._id]);

  const handleCopyLink = useCallback(async () => {
    close();
    const url = getPostShareUrl(post._id);
    await Clipboard.setStringAsync(url);
    showToast('Link copied', 'success');
  }, [close, post._id, showToast]);

  const handleReport = useCallback(() => {
    close();
    setReportConfirmOpen(true);
  }, [close]);

  const confirmReport = useCallback(async () => {
    setReportConfirmOpen(false);
    try {
      await postService.reportPost(post._id);
      showToast('Reported', 'success');
    } catch (err) {
      showToast(normalizeApiError(err as ApiError, 'general'), 'error');
    }
  }, [post._id, showToast]);

  const handleDelete = useCallback(() => {
    close();
    setDeleteConfirmOpen(true);
  }, [close]);

  const confirmDelete = useCallback(async () => {
    setDeleteConfirmOpen(false);
    setDeleting(true);

    if (__DEV__) {
      console.log('[Delete] calling API for post', post._id);
    }

    try {
      await postService.deletePost(post._id);

      if (__DEV__) {
        console.log('[Delete] API success for post', post._id);
      }

      removeCachedPost(post._id);
      notifyPostDeleted(post._id);
      showToast('Post deleted', 'success');
    } catch (err) {
      showToast(normalizeApiError(err as ApiError, 'general'), 'error');
    } finally {
      setDeleting(false);
    }
  }, [post._id, showToast]);

  const menuItems: MenuItem[] = [
    { key: 'share', label: 'Share post', icon: 'share-outline', onPress: handleShare },
    { key: 'copy', label: 'Copy link', icon: 'link-outline', onPress: handleCopyLink },
    { key: 'report', label: 'Report post', icon: 'flag-outline', onPress: handleReport },
  ];

  if (isOwnPost) {
    menuItems.push({
      key: 'delete',
      label: 'Delete post',
      icon: 'trash-outline',
      onPress: handleDelete,
      destructive: true,
    });
  }

  return (
    <>
      <IconButton
        icon="ellipsis-horizontal"
        accessibilityLabel="Post options"
        onPress={() => setOpen(true)}
        color="rgba(255, 255, 255, 0.5)"
        size={18}
        style={styles.trigger}
      />

      <BottomSheet visible={open} onClose={close} title="Post options">
        {menuItems.map((item, index) => (
          <Pressable
            key={item.key}
            style={[styles.menuItem, index > 0 && styles.menuItemBorder]}
            onPress={item.onPress}
            accessibilityRole="button"
            accessibilityLabel={item.label}
          >
            <Ionicons
              name={item.icon}
              size={20}
              color={item.destructive ? colors.error : colors.textPrimary}
            />
            <Typography
              variant="postContent"
              style={item.destructive ? styles.destructiveText : undefined}
            >
              {item.label}
            </Typography>
          </Pressable>
        ))}
      </BottomSheet>

      <SharePostSheet
        visible={shareOpen}
        post={post}
        onClose={() => setShareOpen(false)}
        onNativeShare={() => void handleNativeShare()}
      />

      <ConfirmDialog
        visible={deleteConfirmOpen}
        title="Delete this post?"
        message="This can't be undone."
        confirmLabel={deleting ? 'Deleting…' : 'Delete'}
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void confirmDelete()}
        onCancel={() => setDeleteConfirmOpen(false)}
      />

      <ConfirmDialog
        visible={reportConfirmOpen}
        title="Report this post?"
        message="We'll review this post for policy violations."
        confirmLabel="Report"
        cancelLabel="Cancel"
        destructive
        onConfirm={() => void confirmReport()}
        onCancel={() => setReportConfirmOpen(false)}
      />
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    width: 36,
    height: 36,
  },
  menuItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  menuItemBorder: {
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.borderColor,
  },
  destructiveText: {
    color: colors.error,
  },
});
