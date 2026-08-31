import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, FlatList, ListRenderItem } from 'react-native';
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
  CenteredLoading,
  ErrorState,
  EmptyState,
} from '@/components/ui';
import { PostCard } from '@/components/feed/PostCard';
import { spacing } from '@/theme/spacing';
import { formatCount } from '@/utils/format';
import { useAuth } from '@/hooks/useAuth';
import { usePreview, getPreviewUser, togglePreviewFollow, getPreviewPostsByUsername } from '@/preview';
import { userService, UserProfile } from '@/services/user.service';
import { Post } from '@/services/post.service';
import { useToggleFollow } from '@/hooks/useToggleFollow';
import { useToggleLike } from '@/hooks/useToggleLike';
import { useResponsive } from '@/hooks/useResponsive';
import { useSafeBack } from '@/hooks/useSafeBack';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import {
  getCachedProfile,
  getCachedUserPosts,
  setCachedProfile,
  setCachedUserPosts,
  subscribeProfileUpdates,
} from '@/utils/profileCache';
import { subscribePostDeleted } from '@/utils/feedEvents';

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
  const { toggleLike } = useToggleLike();
  const { isDesktop } = useResponsive();
  const goBack = useSafeBack('/(tabs)');
  const canGoBack = router.canGoBack();

  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState(true);
  const [postsLoading, setPostsLoading] = useState(true);
  const [error, setError] = useState('');
  const [postsError, setPostsError] = useState('');
  const postsRef = useRef(posts);

  postsRef.current = posts;

  const loadProfile = useCallback(async () => {
    if (!username) {
      setError('Profile not found');
      setLoading(false);
      return;
    }

    if (isPreviewMode) {
      setLoading(true);
      setError('');
      const previewUser = getPreviewUser(username, 'nexus');
      if (!previewUser) {
        setError('User not found');
        setProfile(null);
      } else {
        setProfile(previewUser);
      }
      setLoading(false);
      return;
    }

    const cached = getCachedProfile(username);
    if (cached) {
      setProfile(cached);
      setLoading(false);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const data = await userService.getUserProfile(username);
      setCachedProfile(username, data);
      setProfile(data);
    } catch (err) {
      setProfile(null);
      setError(normalizeApiError(err as ApiError, 'general'));
    } finally {
      setLoading(false);
    }
  }, [isPreviewMode, username]);

  const loadPosts = useCallback(async () => {
    if (!username) {
      setPostsLoading(false);
      return;
    }

    if (isPreviewMode) {
      setPosts(getPreviewPostsByUsername(username));
      setPostsLoading(false);
      return;
    }

    const cached = getCachedUserPosts(username);
    if (cached) {
      setPosts(cached.posts);
      setPostsLoading(false);
      return;
    }

    setPostsLoading(true);
    setPostsError('');

    try {
      const data = await userService.getUserPosts(username, 1, 20);
      setCachedUserPosts(username, data);
      setPosts(data.posts);
    } catch (err) {
      setPosts([]);
      setPostsError(normalizeApiError(err as ApiError, 'general'));
    } finally {
      setPostsLoading(false);
    }
  }, [isPreviewMode, username]);

  useEffect(() => {
    loadProfile();
    loadPosts();
  }, [loadProfile, loadPosts]);

  useEffect(() => {
    if (!username || isPreviewMode) {
      return;
    }

    return subscribeProfileUpdates(username, ({ profile, reloadPosts }) => {
      if (profile) {
        setProfile(profile);
      }
      if (reloadPosts) {
        void loadPosts();
      }
    });
  }, [username, isPreviewMode, loadPosts]);

  useEffect(() => {
    return subscribePostDeleted((postId) => {
      setPosts((current) => current.filter((post) => post._id !== postId));
    });
  }, []);

  const isOwnProfile =
    profile &&
    (isPreviewMode
      ? profile.username === 'nexus'
      : currentUser?.username === profile.username);

  const handleFollowPress = useCallback(async () => {
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
  }, [profile, isOwnProfile, isPreviewMode, followUser]);

  const handleLike = useCallback(
    (postId: string) => {
      const post = postsRef.current.find((item) => item._id === postId);
      if (post) {
        toggleLike(post, setPosts);
      }
    },
    [toggleLike],
  );

  const renderPostItem: ListRenderItem<Post> = useCallback(
    ({ item }) => <PostCard post={item} onLike={() => handleLike(item._id)} />,
    [handleLike],
  );

  const profileHeader = useMemo(() => {
    if (!profile) {
      return null;
    }

    return (
      <>
        <GlassCard style={styles.card}>
          <View style={[styles.header, isDesktop && styles.headerDesktop]}>
            <Avatar name={profile.name} uri={profile.avatar} size={isDesktop ? 96 : 80} />
            <View style={[styles.headerInfo, isDesktop && styles.headerInfoDesktop]}>
              <Typography variant="screenTitle" style={styles.name}>
                {profile.name}
              </Typography>
              <Typography variant="username">@{profile.username}</Typography>

              <View style={styles.statsRow}>
                <Pressable
                  style={styles.statItem}
                  onPress={() => router.push(`/profile/${profile.username}/followers`)}
                  accessibilityRole="button"
                  accessibilityLabel="View followers"
                >
                  <Typography variant="userName">
                    {formatCount(profile.followersCount ?? 0)}
                  </Typography>
                  <Typography variant="metadata">Followers</Typography>
                </Pressable>
                <Pressable
                  style={styles.statItem}
                  onPress={() => router.push(`/profile/${profile.username}/following`)}
                  accessibilityRole="button"
                  accessibilityLabel="View following"
                >
                  <Typography variant="userName">
                    {formatCount(profile.followingCount ?? 0)}
                  </Typography>
                  <Typography variant="metadata">Following</Typography>
                </Pressable>
              </View>
            </View>
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
            <View style={styles.actionRow}>
              <View style={styles.actionButtonFlex}>
                {profile.following ? (
                  <SecondaryButton title="Following" onPress={handleFollowPress} />
                ) : (
                  <PrimaryButton title="Follow" onPress={handleFollowPress} />
                )}
              </View>
              <View style={styles.actionButtonFlex}>
                <SecondaryButton
                  title="Message"
                  onPress={() =>
                    router.push({
                      pathname: '/messages/[userId]',
                      params: {
                        userId: profile._id,
                        name: profile.name,
                        username: profile.username,
                        avatar: profile.avatar || '',
                      },
                    })
                  }
                />
              </View>
            </View>
          )}
        </GlassCard>

        <Typography variant="sectionTitle" style={styles.postsTitle}>
          Posts
        </Typography>
      </>
    );
  }, [profile, isDesktop, isOwnProfile, router, handleFollowPress]);

  const postsListEmpty = useMemo(() => {
    if (postsLoading) {
      return <CenteredLoading />;
    }

    if (postsError) {
      return <ErrorState message={postsError} onRetry={loadPosts} />;
    }

    if (posts.length === 0) {
      return (
        <EmptyState
          title="No posts yet"
          message={
            isOwnProfile
              ? 'Share your first post with the community.'
              : 'This user has not posted anything yet.'
          }
          icon="newspaper-outline"
          actionLabel={isOwnProfile ? 'Create Post' : undefined}
          onAction={isOwnProfile ? () => router.push('/(tabs)/create') : undefined}
        />
      );
    }

    return null;
  }, [postsLoading, postsError, posts.length, isOwnProfile, loadPosts, router]);

  return (
    <Screen contentContainerStyle={styles.content}>
      <AppHeader
        title="Profile"
        leftAction={
          canGoBack ? (
            <IconButton
              icon="arrow-back"
              accessibilityLabel="Go back"
              onPress={goBack}
            />
          ) : undefined
        }
      />

      {loading ? (
        <CenteredLoading />
      ) : error ? (
        <ErrorState message={error} onRetry={loadProfile} />
      ) : profile ? (
        <FlatList
          style={styles.list}
          data={posts}
          keyExtractor={(item) => item._id}
          renderItem={renderPostItem}
          ListHeaderComponent={
            <>
              {profileHeader}
            </>
          }
          ListEmptyComponent={postsListEmpty}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={false}
          removeClippedSubviews
        />
      ) : null}
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  card: {
    marginTop: spacing.lg,
  },
  header: {
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  headerDesktop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: spacing.xl,
  },
  headerInfo: {
    alignItems: 'center',
    gap: spacing.sm,
  },
  headerInfoDesktop: {
    alignItems: 'flex-start',
    flex: 1,
  },
  name: {
    marginTop: spacing.md,
    textAlign: 'center',
  },
  statsRow: {
    flexDirection: 'row',
    justifyContent: 'center',
    gap: spacing.xl,
    marginTop: spacing.md,
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
  actionRow: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.sm,
  },
  actionButtonFlex: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  list: {
    flex: 1,
  },
  postsTitle: {
    marginTop: spacing.xl,
    marginBottom: spacing.lg,
  },
});
