import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AuthProvider } from '@/context/AuthContext';
import { SocketProvider } from '@/context/SocketContext';
import { MessagingProvider } from '@/context/MessagingContext';
import { PreviewProvider } from '@/preview';
import { ToastProvider } from '@/components/ui';
import { NotificationProvider } from '@/context/NotificationContext';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { SplashScreenController } from '@/components/navigation/SplashScreenController';
import { colors } from '@/theme/colors';

SplashScreen.preventAutoHideAsync();

function PushNotificationBridge() {
  usePushNotifications();
  return null;
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <AuthProvider>
        <PreviewProvider>
          <SocketProvider>
            <SplashScreenController />
            <ToastProvider>
              <MessagingProvider>
                <NotificationProvider>
                  <PushNotificationBridge />
                  <StatusBar style="light" />
                  <Stack
                    screenOptions={{
                      headerShown: false,
                      contentStyle: { backgroundColor: colors.background },
                      animation: 'fade',
                    }}
                  >
                    <Stack.Screen name="index" />
                    <Stack.Screen name="(auth)" />
                    <Stack.Screen name="(tabs)" />
                    <Stack.Screen name="post/[id]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="messages/compose" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="messages/[userId]" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="profile/[username]/index" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen
                      name="profile/[username]/followers"
                      options={{ animation: 'slide_from_right' }}
                    />
                    <Stack.Screen
                      name="profile/[username]/following"
                      options={{ animation: 'slide_from_right' }}
                    />
                    <Stack.Screen name="profile/edit" options={{ animation: 'slide_from_right' }} />
                    <Stack.Screen name="search" options={{ animation: 'slide_from_right' }} />
                  </Stack>
                </NotificationProvider>
              </MessagingProvider>
            </ToastProvider>
          </SocketProvider>
        </PreviewProvider>
      </AuthProvider>
    </SafeAreaProvider>
  );
}
