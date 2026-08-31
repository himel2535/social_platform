import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import {
  Screen,
  AppHeader,
  IconButton,
  CenteredLoading,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { UserListItem } from '@/components/profile/UserListItem';
import { spacing } from '@/theme/spacing';
import { usePreview, getPreviewFollowers } from '@/preview';
import { userService, UserProfile } from '@/services/user.service';
import { Pagination } from '@/services/post.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { useSafeBack } from '@/hooks/useSafeBack';

const PAGE_LIMIT = 20;

export default function FollowersScreen() {
  const { username } = useLocalSearchParams<{ username: string }>();
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)');
  const { isPreviewMode } = usePreview();

  const [users, setUsers] = useState<UserProfile[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');
  const loadingMoreRef = useRef(false);

  const loadFollowers = useCallback(
    async (page = 1, append = false) => {
      if (!username) {
        setError('User not found');
        setLoading(false);
        return;
      }

      if (append) {
        if (loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
        setError('');
      }

      try {
        if (isPreviewMode) {
          const previewUsers = getPreviewFollowers(username);
          setUsers(previewUsers);
          setPagination({
            page: 1,
            limit: PAGE_LIMIT,
            total: previewUsers.length,
            totalPages: 1,
            hasNextPage: false,
            hasPrevPage: false,
          });
          return;
        }

        const result = await userService.getFollowers(username, page, PAGE_LIMIT);

        setUsers((current) => (append ? [...current, ...result.users] : result.users));
        setPagination(result.pagination);
      } catch (err) {
        if (!append) {
          setUsers([]);
          setError(normalizeApiError(err as ApiError, 'general'));
        }
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [isPreviewMode, username],
  );

  useEffect(() => {
    loadFollowers(1);
  }, [loadFollowers]);

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    if (isPreviewMode || !pagination?.hasNextPage || loadingMoreRef.current) {
      return;
    }

    const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
    const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

    if (distanceFromBottom < 120) {
      loadFollowers(pagination.page + 1, true);
    }
  };

  return (
    <Screen
      scroll
      contentContainerStyle={styles.content}
      scrollViewProps={{ onScroll: handleScroll, scrollEventThrottle: 400 }}
    >
      <AppHeader
        title="Followers"
        leftAction={
          <IconButton
            icon="arrow-back"
            accessibilityLabel="Go back"
            onPress={goBack}
          />
        }
      />

      <View style={styles.list}>
        {loading ? (
          <CenteredLoading />
        ) : error ? (
          <ErrorState message={error} onRetry={() => loadFollowers(1)} />
        ) : users.length === 0 ? (
          <EmptyState
            title="No followers yet"
            message="When people follow this user, they will appear here."
            icon="people-outline"
          />
        ) : (
          <>
            {users.map((user) => (
              <UserListItem key={user._id} user={user} />
            ))}
            {loadingMore ? <CenteredLoading style={styles.loadMore} /> : null}
          </>
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: spacing.xl,
  },
  list: {
    flex: 1,
    marginTop: spacing.lg,
  },
  loadMore: {
    minHeight: 120,
    marginVertical: spacing.lg,
  },
});
