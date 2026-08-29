import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';

export default function ProfileTabScreen() {
  const { user } = useAuth();
  const { isPreviewMode } = usePreview();

  const username = isPreviewMode ? 'nexus' : user?.username;

  if (!username) {
    return <Redirect href="/(auth)/login" />;
  }

  return <Redirect href={`/profile/${username}`} />;
}
