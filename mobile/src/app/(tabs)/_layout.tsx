import { Redirect, Tabs, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View } from 'react-native';
import { colors } from '@/theme/colors';
import { glass, layout } from '@/theme/glass';
import { DevPreviewControls } from '@/preview';
import { DesktopSidebar } from '@/components/navigation/DesktopSidebar';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';
import { useResponsive } from '@/hooks/useResponsive';
import { useNotifications } from '@/context/NotificationContext';

export default function TabsLayout() {
  const router = useRouter();
  const { isAuthenticated, isLoading, user } = useAuth();
  const { isPreviewMode } = usePreview();
  const { isDesktop } = useResponsive();
  const { unreadCount } = useNotifications();
  const profileUsername = isPreviewMode ? 'nexus' : user?.username;

  if (isLoading) {
    return null;
  }

  if (!isAuthenticated && !(__DEV__ && isPreviewMode)) {
    return <Redirect href="/(auth)/login" />;
  }

  const tabs = (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: colors.primary,
        tabBarInactiveTintColor: colors.textSecondary,
        tabBarStyle: isDesktop ? styles.hiddenTabBar : styles.tabBar,
        tabBarBackground: () =>
          Platform.OS === 'ios' && !isDesktop ? (
            <BlurView intensity={glass.blurIntensity} tint="dark" style={StyleSheet.absoluteFill} />
          ) : undefined,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Feed',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="home-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="search"
        options={{
          title: 'Search',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="search-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="create"
        options={{
          title: 'Create',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="add-circle-outline" size={size} color={colors.secondary} />
          ),
        }}
      />
      <Tabs.Screen
        name="notifications"
        options={{
          title: 'Alerts',
          tabBarBadge: unreadCount > 0 ? unreadCount : undefined,
          tabBarBadgeStyle: { backgroundColor: colors.error },
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="notifications-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="profile"
        listeners={{
          tabPress: (e) => {
            e.preventDefault();
            if (profileUsername) {
              router.push(`/profile/${profileUsername}`);
            }
          },
        }}
        options={{
          title: 'Profile',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="person-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );

  return (
    <View style={styles.wrapper}>
      {isDesktop ? (
        <View style={styles.desktopLayout}>
          <DesktopSidebar />
          <View style={styles.desktopContent}>{tabs}</View>
        </View>
      ) : (
        tabs
      )}
      <DevPreviewControls />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  desktopLayout: {
    flex: 1,
    flexDirection: 'row',
  },
  desktopContent: {
    flex: 1,
  },
  hiddenTabBar: {
    display: 'none',
  },
  tabBar: {
    position: 'absolute',
    backgroundColor: Platform.OS === 'android' ? colors.backgroundSecondary : 'transparent',
    borderTopColor: glass.borderColor,
    borderTopWidth: glass.borderWidth,
    height: layout.tabBarHeight,
    paddingBottom: Platform.OS === 'ios' ? 8 : 4,
    paddingTop: 4,
  },
  tabLabel: {
    fontSize: 11,
    fontWeight: '500',
  },
});
