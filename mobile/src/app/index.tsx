import { Redirect } from 'expo-router';
import { LoadingSpinner, Screen } from '@/components/ui';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';

export default function Index() {
  const { isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();

  if (isLoading) {
    return (
      <Screen>
        <LoadingSpinner />
      </Screen>
    );
  }

  if (isAuthenticated) {
    return <Redirect href="/(tabs)" />;
  }

  if (__DEV__ && isPreviewMode) {
    return <Redirect href="/(tabs)" />;
  }

  return <Redirect href="/(auth)/login" />;
}
