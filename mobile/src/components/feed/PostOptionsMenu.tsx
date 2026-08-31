import React, { useState, useCallback } from 'react';
import { Pressable, Share, Alert, StyleSheet } from 'react-native';
import * as Clipboard from 'expo-clipboard';
import { Ionicons } from '@expo/vector-icons';
import { BottomSheet, IconButton, Typography, useToast } from '@/components/ui';
import { Post, postService } from '@/services/post.service';
import { useAuth } from '@/hooks/useAuth';
import { glass } from '@/theme/glass';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { ApiError } from '@/services/api';
import { notifyPostDeleted } from '@/utils/feedEvents';
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
  const { user } = useAuth();
  const { showToast } = useToast();

  const isOwnPost = user?._id === post.author._id;

  const close = useCallback(() => setOpen(false), []);

  const handleShare = useCallback(async () => {
    close();
    const url = getPostShareUrl(post._id);
    try {
      await Share.share({ message: url, url });
    } catch {
      // User dismissed share sheet
    }
  }, [close, post._id]);

  const handleCopyLink = useCallback(async () => {
    close();
    const url = getPostShareUrl(post._id);
    await Clipboard.setStringAsync(url);
    showToast('Link copied', 'success');
  }, [close, post._id, showToast]);

  const handleReport = useCallback(() => {
    close();
    Alert.alert('Report post', 'Are you sure you want to report this post?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Report',
        style: 'destructive',
        onPress: async () => {
          try {
            await postService.reportPost(post._id);
            showToast('Reported', 'success');
          } catch (err) {
            showToast(normalizeApiError(err as ApiError, 'general'), 'error');
          }
        },
      },
    ]);
  }, [close, post._id, showToast]);

  const handleDelete = useCallback(() => {
    close();
    Alert.alert('Delete post', 'This post will be permanently deleted.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await postService.deletePost(post._id);
            notifyPostDeleted(post._id);
            showToast('Post deleted', 'success');
          } catch (err) {
            showToast(normalizeApiError(err as ApiError, 'general'), 'error');
          }
        },
      },
    ]);
  }, [close, post._id, showToast]);

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
