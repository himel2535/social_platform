import { useCallback, useEffect, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen,
  AppHeader,
  IconButton,
  Avatar,
  Typography,
  GlassCard,
  PrimaryButton,
  SecondaryButton,
  LoadingSpinner,
  ErrorState,
} from '@/components/ui';
import { spacing } from '@/theme/spacing';
import { formatCount } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { usePreview, getPreviewUser, togglePreviewFollow } from '@/preview';
import { userService, UserProfile } from '@/services/user.service';
import { useToggleFollow } from '@/hooks/useToggleFollow';
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
  const { followUser } = useToggleFollow();

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
        const previewUser = getPreviewUser(username, 'nexus');
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

  const handleFollowPress = async () => {
    if (!profile || isOwnProfile) {
      return;
    }

    if (isPreviewMode) {
      const updated = togglePreviewFollow('nexus', profile.username);
      if (updated) {
        setProfile(updated);
      }
      return;
    }

    await followUser(profile, setProfile);
  };

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

          <View style={styles.statsRow}>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push(`/profile/${profile.username}/followers`)}
              accessibilityRole="button"
              accessibilityLabel="View followers"
            >
              <Typography variant="userName">{formatCount(profile.followersCount ?? 0)}</Typography>
              <Typography variant="metadata">Followers</Typography>
            </Pressable>
            <Pressable
              style={styles.statItem}
              onPress={() => router.push(`/profile/${profile.username}/following`)}
              accessibilityRole="button"
              accessibilityLabel="View following"
            >
              <Typography variant="userName">{formatCount(profile.followingCount ?? 0)}</Typography>
              <Typography variant="metadata">Following</Typography>
            </Pressable>
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
              style={styles.actionButton}
            />
          ) : (
            <View style={styles.actionButton}>
              {profile.following ? (
                <SecondaryButton title="Following" onPress={handleFollowPress} />
              ) : (
                <PrimaryButton title="Follow" onPress={handleFollowPress} />
              )}
            </View>
          )}
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
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginBottom: spacing.lg,
  },
  statItem: {
    alignItems: 'center',
    gap: spacing.xs,
    minWidth: 88,
  },
  bio: {
    textAlign: 'center',
    marginBottom: spacing.md,
  },
  memberSince: {
    textAlign: 'center',
    marginBottom: spacing.lg,
  },
  actionButton: {
    marginTop: spacing.sm,
  },
});
