import { Tabs } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { BlurView } from 'expo-blur';
import { StyleSheet, Platform, View } from 'react-native';
import { colors } from '@/theme/colors';
import { glass, layout } from '@/theme/glass';
import { DevPreviewControls } from '@/preview';

export default function TabsLayout() {
  return (
    <View style={styles.wrapper}>
      <Tabs
        screenOptions={{
          headerShown: false,
          tabBarActiveTintColor: colors.primary,
          tabBarInactiveTintColor: colors.textSecondary,
          tabBarStyle: styles.tabBar,
          tabBarBackground: () =>
            Platform.OS === 'ios' ? (
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
            tabBarIcon: ({ color, size }) => (
              <Ionicons name="notifications-outline" size={size} color={color} />
            ),
          }}
        />
      </Tabs>
      <DevPreviewControls />
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
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
