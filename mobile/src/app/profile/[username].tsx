import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen,
  AppHeader,
  IconButton,
  Avatar,
  Typography,
  GlassCard,
  PrimaryButton,
  LoadingSpinner,
  ErrorState,
} from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { useAuth } from '@/hooks/useAuth';
import { usePreview, getPreviewUser } from '@/preview';
import { userService, UserProfile } from '@/services/user.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';

function formatMemberSince(date?: string): string {
  if (!date) {
    return 'Unknown';
  }

  return new Date(date).toLocaleDateString(undefined, {
    month: 'long',
    year: 'numeric',
  });
}

export default function ProfileScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const { user: currentUser } = useAuth();
  const { isPreviewMode } = usePreview();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const loadProfile = useCallback(async () => {
    if (!username) {
      setError('Profile not found');
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      if (isPreviewMode) {
        const previewUser = getPreviewUser(username);
        if (!previewUser) {
          setError('User not found');
          setProfile(null);
          return;
        }
        setProfile(previewUser);
        return;
      }

      const data = await userService.getUserProfile(username);
      setProfile(data);
    } catch (err) {
      setProfile(null);
      setError(normalizeApiError(err as ApiError, 'general'));
    } finally {
      setLoading(false);
    }
  }, [isPreviewMode, username]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

  const isOwnProfile =
    profile &&
    (isPreviewMode
      ? profile.username === 'nexus'
      : currentUser?.username === profile.username);

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <AppHeader
        title="Profile"
        leftAction={
          <IconButton
            icon="arrow-back"
            accessibilityLabel="Go back"
            onPress={() => router.back()}
          />
        }
      />

      {loading ? (
        <LoadingSpinner style={styles.centered} />
      ) : error ? (
        <ErrorState message={error} onRetry={loadProfile} />
      ) : profile ? (
        <GlassCard style={styles.card}>
          <View style={styles.header}>
            <Avatar name={profile.name} uri={profile.avatar} size={80} />
            <Typography variant="screenTitle" style={styles.name}>
              {profile.name}
            </Typography>
            <Typography variant="username">@{profile.username}</Typography>
          </View>

          {profile.bio ? (
            <Typography variant="postContent" style={styles.bio}>
              {profile.bio}
            </Typography>
          ) : (
            <Typography variant="metadata" style={styles.bio}>
              No bio yet.
            </Typography>
          )}

          <Typography variant="metadata" style={styles.memberSince}>
            Member since {formatMemberSince(profile.createdAt)}
          </Typography>

          {isOwnProfile ? (
            <PrimaryButton
              title="Edit Profile"
              onPress={() => router.push('/profile/edit')}
              style={styles.editButton}
            />
          ) : null}
        </GlassCard>
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  centered: {
    marginTop: spacing.xl,
  },
  card: {
    marginTop: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  name: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  bio: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  memberSince: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  editButton: {
    marginTop: spacing.sm,
  },
});
