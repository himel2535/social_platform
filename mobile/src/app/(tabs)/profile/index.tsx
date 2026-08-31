import { Redirect } from 'expo-router';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';

export default function ProfileTabIndex() {
  const { user } = useAuth();
  const { isPreviewMode } = usePreview();
  const username = isPreviewMode ? 'nexus' : user?.username;

  if (!username) {
    return null;
  }

  return <Redirect href={`/profile/${username}`} />;
}
