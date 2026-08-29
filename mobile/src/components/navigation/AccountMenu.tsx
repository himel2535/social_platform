import React, { useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import { Avatar, Typography, BottomSheet } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { glass } from '@/theme/glass';
import { PREVIEW_TEAM_NAME } from '@/constants/branding';

type Props = {
  size?: number;
};

export function AccountMenu({ size = 36 }: Props) {
  const router = useRouter();
  const { user, logout, isAuthenticated } = useAuth();
  const { isPreviewMode, exitPreview } = usePreview();
  const [open, setOpen] = useState(false);

  const displayName = isPreviewMode ? PREVIEW_TEAM_NAME : user?.name || 'Account';
  const displayUsername = isPreviewMode ? 'nexus' : user?.username || '';
  const avatarUri = isPreviewMode ? undefined : user?.avatar;

  if (!isPreviewMode && !isAuthenticated) {
    return null;
  }

  const handleProfile = () => {
    setOpen(false);
    router.push(`/profile/${displayUsername}`);
  };

  const handleLogout = async () => {
    setOpen(false);
    if (isPreviewMode) {
      exitPreview();
      router.replace('/(auth)/login');
      return;
    }
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        accessibilityRole="button"
        accessibilityLabel="Open account menu"
        style={styles.trigger}
      >
        <Avatar name={displayName} uri={avatarUri} size={size} />
      </Pressable>

      <BottomSheet visible={open} onClose={() => setOpen(false)} title="Account">
        <View style={styles.menuHeader}>
          <Avatar name={displayName} uri={avatarUri} size={48} />
          <View style={styles.menuInfo}>
            <Typography variant="userName">{displayName}</Typography>
            <Typography variant="username">@{displayUsername}</Typography>
          </View>
        </View>

        <Pressable
          style={styles.menuItem}
          onPress={handleProfile}
          accessibilityRole="button"
          accessibilityLabel="View profile"
        >
          <Typography variant="postContent">Profile</Typography>
        </Pressable>

        <Pressable
          style={styles.menuItem}
          onPress={handleLogout}
          accessibilityRole="button"
          accessibilityLabel="Log out"
        >
          <Typography variant="postContent" style={styles.logoutText}>
            Logout
          </Typography>
        </Pressable>
      </BottomSheet>
    </>
  );
}

const styles = StyleSheet.create({
  trigger: {
    borderRadius: 999,
  },
  menuHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    marginBottom: spacing.lg,
  },
  menuInfo: {
    flex: 1,
    gap: spacing.xs,
  },
  menuItem: {
    paddingVertical: spacing.md,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: glass.borderColor,
  },
  logoutText: {
    color: colors.error,
  },
});
