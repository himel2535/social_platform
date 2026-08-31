import React from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Badge, Typography, BrandTitle } from '@/components/ui';
import { AccountMenu } from '@/components/navigation/AccountMenu';
import { colors } from '@/theme/colors';
import { glass, layout } from '@/theme/glass';
import { spacing } from '@/theme/spacing';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';
import { useNotifications } from '@/context/NotificationContext';
import { useMessaging } from '@/hooks/useMessaging';

type NavItem = {
  label: string;
  href: string;
  icon: keyof typeof Ionicons.glyphMap;
  segment: string;
};

const NAV_ITEMS: NavItem[] = [
  { label: 'Home', href: '/(tabs)', icon: 'home-outline', segment: 'index' },
  { label: 'Search', href: '/(tabs)/search', icon: 'search-outline', segment: 'search' },
  { label: 'Create', href: '/(tabs)/create', icon: 'add-circle-outline', segment: 'create' },
  {
    label: 'Alerts',
    href: '/(tabs)/notifications',
    icon: 'notifications-outline',
    segment: 'notifications',
  },
  {
    label: 'Messages',
    href: '/(tabs)/messages',
    icon: 'chatbubbles-outline',
    segment: 'messages',
  },
  { label: 'Profile', href: '/(tabs)/profile', icon: 'person-outline', segment: 'profile' },
];

export function DesktopSidebar() {
  const router = useRouter();
  const segments = useSegments();
  const activeSegment = segments[1] || 'index';
  const { logout, isAuthenticated, user } = useAuth();
  const { isPreviewMode, exitPreview } = usePreview();
  const { unreadCount } = useNotifications();
  const { totalUnreadCount: messagesUnreadCount } = useMessaging();
  const profileUsername = isPreviewMode ? 'nexus' : user?.username;

  const handleLogout = async () => {
    if (isPreviewMode) {
      exitPreview();
      router.replace('/(auth)/login');
      return;
    }
    await logout();
    router.replace('/(auth)/login');
  };

  return (
    <View style={styles.sidebar}>
      <BrandTitle style={styles.brand} />

      <View style={styles.nav}>
        {NAV_ITEMS.map((item) => {
          const active = activeSegment === item.segment;
          return (
            <Pressable
              key={item.label}
              style={[styles.navItem, active && styles.navItemActive]}
              onPress={() => {
                if (item.segment === 'profile' && profileUsername) {
                  router.push(`/profile/${profileUsername}`);
                  return;
                }
                router.push(item.href as never);
              }}
              accessibilityRole="button"
              accessibilityLabel={item.label}
            >
              <Ionicons
                name={item.icon}
                size={20}
                color={active ? colors.primary : colors.textSecondary}
              />
              <Typography
                variant="postContent"
                style={[styles.navLabel, active ? styles.activeLabel : undefined]}
              >
                {item.label}
              </Typography>
              {item.segment === 'notifications' && unreadCount > 0 ? (
                <Badge count={unreadCount} />
              ) : null}
              {item.segment === 'messages' && messagesUnreadCount > 0 ? (
                <Badge count={messagesUnreadCount} />
              ) : null}
            </Pressable>
          );
        })}
      </View>

      <View style={styles.footer}>
        {(isAuthenticated || isPreviewMode) && <AccountMenu size={40} />}
        {(isAuthenticated || isPreviewMode) && (
          <Pressable
            style={styles.logoutButton}
            onPress={handleLogout}
            accessibilityRole="button"
            accessibilityLabel="Log out"
          >
            <Ionicons name="log-out-outline" size={18} color={colors.error} />
            <Typography variant="metadata" style={styles.logoutText}>
              Logout
            </Typography>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  sidebar: {
    width: layout.sidebarWidth,
    borderRightWidth: glass.borderWidth,
    borderRightColor: glass.borderColor,
    backgroundColor: colors.backgroundSecondary,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    justifyContent: 'space-between',
  },
  brand: {
    marginBottom: spacing.xl,
  },
  nav: {
    flex: 1,
    gap: spacing.sm,
  },
  navItem: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
  },
  navLabel: {
    flex: 1,
  },
  navItemActive: {
    backgroundColor: 'rgba(124, 58, 237, 0.15)',
  },
  activeLabel: {
    color: colors.primary,
  },
  footer: {
    gap: spacing.lg,
    paddingTop: spacing.lg,
    borderTopWidth: glass.borderWidth,
    borderTopColor: glass.borderColor,
  },
  logoutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.sm,
  },
  logoutText: {
    color: colors.error,
  },
});
