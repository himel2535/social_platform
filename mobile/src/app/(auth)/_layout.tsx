import { Redirect, Stack } from 'expo-router';
import { LoadingSpinner, Screen } from '@/components/ui';
import { colors } from '@/theme/colors';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';

export default function AuthLayout() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner />
      </Screen>
    );
  }

  if (isAuthenticated && !isPreviewMode) {
    return <Redirect href="/(tabs)" />;
  }

  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: colors.background },
        animation: 'slide_from_right',
      }}
    >
      <Stack.Screen name="login" />
      <Stack.Screen name="signup" />
    </Stack>
  );
}
