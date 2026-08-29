import { useState, useCallback, useEffect, useRef } from 'react';
import { View, StyleSheet, RefreshControl, NativeSyntheticEvent, NativeScrollEvent } from 'react-native';
import { useRouter, useFocusEffect } from 'expo-router';
import {
  Screen,
  AppHeader,
  IconButton,
  Badge,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  LoadingSpinner,
} from '@/components/ui';
import { SearchBar } from '@/components/feed/SearchBar';
import { PostCard } from '@/components/feed/PostCard';
import { spacing } from '@/theme/spacing';
import { Post, Pagination, postService } from '@/services/post.service';
import { usePreview, PREVIEW_POSTS } from '@/preview';
import { useAuth } from '@/hooks/useAuth';
import { AccountMenu } from '@/components/navigation/AccountMenu';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { cachePosts } from '@/utils/postCache';
import { useToggleLike } from '@/hooks/useToggleLike';

const PAGE_LIMIT = 10;

function dedupePosts(posts: Post[]): Post[] {
  const seen = new Set<string>();
  return posts.filter((post) => {
    if (seen.has(post._id)) {
      return false;
    }
    seen.add(post._id);
    return true;
  });
}

export default function FeedScreen() {
  const [search, setSearch] = useState('');
  const { isPreviewMode } = usePreview();
  const { isAuthenticated } = useAuth();
  const router = useRouter();

  const [previewPosts, setPreviewPosts] = useState<Post[]>(PREVIEW_POSTS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadingMoreRef = useRef(false);
  const paginationRef = useRef<Pagination | null>(null);
  const postsLengthRef = useRef(0);
  const { toggleLike } = useToggleLike();

  useEffect(() => {
    paginationRef.current = pagination;
  }, [pagination]);

  useEffect(() => {
    postsLengthRef.current = posts.length;
  }, [posts.length]);

  const loadFeed = useCallback(
    async (page = 1, options: { refresh?: boolean; append?: boolean } = {}) => {
      if (isPreviewMode) {
        return;
      }

      const { refresh = false, append = false } = options;

      if (append) {
        if (loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else if (refresh) {
        if (postsLengthRef.current > 0) {
          setRefreshing(true);
        } else {
          setLoading(true);
        }
      } else {
        setLoading(true);
      }

      setError('');

      try {
        const result = await postService.getPosts({ page, limit: PAGE_LIMIT });
        cachePosts(result.posts);

        setPagination(result.pagination);
        setPosts((current) => {
          if (append) {
            return dedupePosts([...current, ...result.posts]);
          }
          return result.posts;
        });
      } catch (err) {
        const message = normalizeApiError(err as ApiError, 'general');
        setError(message);
      } finally {
        setLoading(false);
        setRefreshing(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [isPreviewMode],
  );

  useFocusEffect(
    useCallback(() => {
      if (!isPreviewMode && isAuthenticated) {
        loadFeed(1, { refresh: true });
      }
    }, [isPreviewMode, isAuthenticated, loadFeed]),
  );

  const handleRefresh = useCallback(() => {
    loadFeed(1, { refresh: true });
  }, [loadFeed]);

  const handleLoadMore = useCallback(() => {
    const currentPagination = paginationRef.current;
    if (!currentPagination?.hasNextPage || loadingMoreRef.current) {
      return;
    }
    loadFeed(currentPagination.page + 1, { append: true });
  }, [loadFeed]);

  const handleScroll = useCallback(
    (event: NativeSyntheticEvent<NativeScrollEvent>) => {
      const { layoutMeasurement, contentOffset, contentSize } = event.nativeEvent;
      const distanceFromBottom = contentSize.height - layoutMeasurement.height - contentOffset.y;

      if (distanceFromBottom < 120) {
        handleLoadMore();
      }
    },
    [handleLoadMore],
  );

  const handleLike = useCallback(
    (postId: string, isPreview: boolean) => {
      if (isPreview) {
        setPreviewPosts((current) =>
          current.map((post) =>
            post._id === postId
              ? {
                  ...post,
                  likedByMe: !post.likedByMe,
                  likesCount: post.likedByMe ? post.likesCount - 1 : post.likesCount + 1,
                }
              : post,
          ),
        );
        return;
      }

      const post = posts.find((item) => item._id === postId);
      if (post) {
        toggleLike(post, setPosts);
      }
    },
    [posts, toggleLike],
  );

  const filterPosts = (items: Post[]) =>
    items.filter(
      (post) =>
        !search ||
        post.author.username.toLowerCase().includes(search.toLowerCase()) ||
        post.author.name.toLowerCase().includes(search.toLowerCase()),
    );

  const filteredPreviewPosts = filterPosts(previewPosts);
  const filteredPosts = filterPosts(posts);

  const renderAuthenticatedFeed = () => {
    if (loading && posts.length === 0) {
      return (
        <>
          <LoadingSkeleton />
          <LoadingSkeleton />
        </>
      );
    }

    if (error && posts.length === 0) {
      return <ErrorState message={error} onRetry={() => loadFeed(1)} />;
    }

    if (!loading && !error && posts.length === 0) {
      return (
        <EmptyState
          title="No posts yet"
          message="Create the first post!"
          icon="newspaper-outline"
          actionLabel="Create Post"
          onAction={() => router.push('/(tabs)/create')}
        />
      );
    }

    if (search && filteredPosts.length === 0) {
      return (
        <EmptyState
          title="No posts found"
          message={`No posts from @${search} yet.`}
          icon="search-outline"
        />
      );
    }

    return (
      <>
        {filteredPosts.map((post) => (
          <PostCard key={post._id} post={post} onLike={() => handleLike(post._id, false)} />
        ))}
        {loadingMore ? <LoadingSpinner style={styles.loadMore} /> : null}
      </>
    );
  };

  const renderPreviewFeed = () => {
    if (filteredPreviewPosts.length > 0) {
      return filteredPreviewPosts.map((post) => (
        <PostCard key={post._id} post={post} onLike={() => handleLike(post._id, true)} />
      ));
    }

    return (
      <EmptyState
        title="No posts found"
        message={`No posts from @${search} yet.`}
        icon="search-outline"
      />
    );
  };

  return (
    <Screen
      scroll
      contentContainerStyle={styles.content}
      scrollViewProps={{
        refreshControl: !isPreviewMode ? (
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        ) : undefined,
        onScroll: !isPreviewMode ? handleScroll : undefined,
        scrollEventThrottle: 400,
      }}
    >
      <AppHeader
        title="Nexus Social"
        rightAction={
          <View style={styles.headerActions}>
            {(isAuthenticated || isPreviewMode) ? <AccountMenu size={32} /> : null}
            <View>
              <IconButton icon="notifications-outline" accessibilityLabel="Notifications" />
              <Badge dot style={styles.badge} />
            </View>
          </View>
        }
      />

      <SearchBar value={search} onChangeText={setSearch} />

      <View style={styles.feed}>
        {isPreviewMode ? renderPreviewFeed() : renderAuthenticatedFeed()}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  headerActions: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  badge: {
    position: 'absolute',
    top: 8,
    right: 8,
  },
  feed: {
    marginTop: spacing.lg,
  },
  loadMore: {
    marginVertical: spacing.lg,
  },
});
