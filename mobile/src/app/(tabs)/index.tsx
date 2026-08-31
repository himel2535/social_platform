import { useState, useCallback, useEffect, useRef, useMemo } from 'react';
import {
  View,
  StyleSheet,
  RefreshControl,
  FlatList,
  ListRenderItem,
} from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import {
  Screen,
  AppHeader,
  EmptyState,
  LoadingSkeleton,
  ErrorState,
  LoadingSpinner,
} from '@/components/ui';
import { SearchBar } from '@/components/feed/SearchBar';
import { PostCard } from '@/components/feed/PostCard';
import { FeedHeaderActions } from '@/components/feed/FeedHeaderActions';
import { spacing } from '@/theme/spacing';
import { Post, Pagination, postService } from '@/services/post.service';
import { usePreview, PREVIEW_POSTS } from '@/preview';
import { useAuth } from '@/hooks/useAuth';
import { APP_NAME } from '@/constants/branding';
import { useResponsive } from '@/hooks/useResponsive';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { cachePost, cachePosts, syncPostsFromCache } from '@/utils/postCache';
import { subscribeFeedPostCreated } from '@/utils/feedEvents';
import { useToggleLike } from '@/hooks/useToggleLike';
import { layout } from '@/theme/glass';

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

function filterPosts(items: Post[], search: string) {
  if (!search) {
    return items;
  }

  const query = search.toLowerCase();
  return items.filter(
    (post) =>
      post.author.username.toLowerCase().includes(query) ||
      post.author.name.toLowerCase().includes(query),
  );
}

export default function FeedScreen() {
  const [search, setSearch] = useState('');
  const { isPreviewMode } = usePreview();
  const { isAuthenticated } = useAuth();
  const { isDesktop } = useResponsive();
  const router = useRouter();
  const segments = useSegments();
  const activeTab = segments[1] ?? 'index';

  const [previewPosts, setPreviewPosts] = useState<Post[]>(PREVIEW_POSTS);
  const [posts, setPosts] = useState<Post[]>([]);
  const [pagination, setPagination] = useState<Pagination | null>(null);
  const [loading, setLoading] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState('');

  const loadingMoreRef = useRef(false);
  const loadingPageOneRef = useRef(false);
  const paginationRef = useRef<Pagination | null>(null);
  const postsLengthRef = useRef(0);
  const postsRef = useRef(posts);
  const previousTabRef = useRef<string | undefined>(undefined);
  const { toggleLike } = useToggleLike();

  postsRef.current = posts;

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
      } else if (page === 1) {
        if (loadingPageOneRef.current) {
          return;
        }
        loadingPageOneRef.current = true;
        if (refresh && postsLengthRef.current > 0) {
          setRefreshing(true);
        } else if (postsLengthRef.current === 0) {
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
        if (page === 1) {
          loadingPageOneRef.current = false;
        }
      }
    },
    [isPreviewMode],
  );

  useEffect(() => {
    if (!isPreviewMode && isAuthenticated) {
      void loadFeed(1);
    }
  }, [isPreviewMode, isAuthenticated, loadFeed]);

  useEffect(() => {
    return subscribeFeedPostCreated((post) => {
      cachePost(post);
      setPosts((current) => dedupePosts([post, ...current]));
    });
  }, []);

  useEffect(() => {
    if (isPreviewMode || activeTab !== 'index') {
      previousTabRef.current = activeTab;
      return;
    }

    const previousTab = previousTabRef.current;
    previousTabRef.current = activeTab;

    if (previousTab !== undefined && previousTab !== 'index') {
      syncPostsFromCache(setPosts);
    }
  }, [activeTab, isPreviewMode]);

  const handleRefresh = useCallback(() => {
    void loadFeed(1, { refresh: true });
  }, [loadFeed]);

  const handleLoadMore = useCallback(() => {
    const currentPagination = paginationRef.current;
    if (!currentPagination?.hasNextPage || loadingMoreRef.current) {
      return;
    }
    void loadFeed(currentPagination.page + 1, { append: true });
  }, [loadFeed]);

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

      const post = postsRef.current.find((item) => item._id === postId);
      if (post) {
        toggleLike(post, setPosts);
      }
    },
    [toggleLike],
  );

  const filteredPreviewPosts = useMemo(
    () => filterPosts(previewPosts, search),
    [previewPosts, search],
  );

  const filteredPosts = useMemo(() => filterPosts(posts, search), [posts, search]);

  const renderPostItem: ListRenderItem<Post> = useCallback(
    ({ item }) => (
      <PostCard
        post={item}
        onLike={() => handleLike(item._id, isPreviewMode)}
      />
    ),
    [handleLike, isPreviewMode],
  );

  const listHeader = useMemo(
    () => (
      <View>
        <AppHeader
          title={APP_NAME}
          rightAction={
            <FeedHeaderActions showMenu={!isDesktop && (isAuthenticated || isPreviewMode)} />
          }
        />
        <SearchBar value={search} onChangeText={setSearch} />
      </View>
    ),
    [isDesktop, isAuthenticated, isPreviewMode, search],
  );

  const listEmpty = useMemo(() => {
    if (isPreviewMode) {
      if (filteredPreviewPosts.length === 0) {
        return (
          <EmptyState
            title="No posts found"
            message={`No posts from @${search} yet.`}
            icon="search-outline"
          />
        );
      }
      return null;
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

    return null;
  }, [
    isPreviewMode,
    filteredPreviewPosts.length,
    search,
    loading,
    posts.length,
    error,
    filteredPosts.length,
    loadFeed,
    router,
  ]);

  const listFooter = useMemo(
    () => (loadingMore ? <LoadingSpinner style={styles.loadMore} /> : null),
    [loadingMore],
  );

  if (isPreviewMode) {
    return (
      <Screen scroll contentContainerStyle={styles.content}>
        {listHeader}
        <View style={styles.feed}>
          {filteredPreviewPosts.map((post) => (
            <PostCard
              key={post._id}
              post={post}
              onLike={() => handleLike(post._id, true)}
            />
          ))}
          {listEmpty}
        </View>
      </Screen>
    );
  }

  if (loading && posts.length === 0) {
    return (
      <Screen contentPaddingBottom={layout.tabBarHeight + spacing.lg}>
        {listHeader}
        <View style={styles.initialLoading}>
          <LoadingSkeleton />
          <LoadingSkeleton />
        </View>
      </Screen>
    );
  }

  return (
    <Screen contentPaddingBottom={layout.tabBarHeight + spacing.lg}>
      <FlatList
        style={styles.list}
        data={filteredPosts}
        keyExtractor={(item) => item._id}
        renderItem={renderPostItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        ListFooterComponent={listFooter}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
        initialNumToRender={6}
        maxToRenderPerBatch={8}
        windowSize={7}
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    flexGrow: 1,
  },
  list: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.lg,
  },
  feed: {
    marginTop: spacing.lg,
  },
  initialLoading: {
    marginTop: spacing.lg,
  },
  loadMore: {
    marginVertical: spacing.lg,
  },
});
