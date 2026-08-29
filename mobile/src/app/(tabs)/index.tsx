import { useState, useCallback } from 'react';
import { View, StyleSheet } from 'react-native';
import { Screen, AppHeader, IconButton, Badge, EmptyState, LoadingSkeleton } from '@/components/ui';
import { SearchBar } from '@/components/feed/SearchBar';
import { PostCard } from '@/components/feed/PostCard';
import { spacing } from '@/theme/spacing';
import { Post } from '@/services/post.service';
import { usePreview, PREVIEW_POSTS } from '@/preview';

export default function FeedScreen() {
  const [search, setSearch] = useState('');
  const [loading] = useState(false);
  const { isPreviewMode } = usePreview();
  const [posts, setPosts] = useState<Post[]>(PREVIEW_POSTS);

  const handleLike = useCallback((postId: string) => {
    setPosts((current) =>
      current.map((post) =>
        post._id === postId
          ? {
              ...post,
              isLiked: !post.isLiked,
              likesCount: post.isLiked ? post.likesCount - 1 : post.likesCount + 1,
            }
          : post,
      ),
    );
  }, []);

  const filteredPosts = isPreviewMode
    ? posts.filter(
        (post) =>
          !search ||
          post.author.username.toLowerCase().includes(search.toLowerCase()) ||
          post.author.name.toLowerCase().includes(search.toLowerCase()),
      )
    : [];

  return (
    <Screen scroll contentContainerStyle={styles.content}>
      <AppHeader
        title="Nexus Social"
        rightAction={
          <View style={styles.headerActions}>
            <IconButton icon="search-outline" accessibilityLabel="Search" />
            <View>
              <IconButton icon="notifications-outline" accessibilityLabel="Notifications" />
              <Badge dot style={styles.badge} />
            </View>
          </View>
        }
      />

      <SearchBar value={search} onChangeText={setSearch} />

      <View style={styles.feed}>
        {loading ? (
          <>
            <LoadingSkeleton />
            <LoadingSkeleton />
          </>
        ) : isPreviewMode ? (
          filteredPosts.length > 0 ? (
            filteredPosts.map((post) => (
              <PostCard
                key={post._id}
                post={post}
                onLike={() => handleLike(post._id)}
              />
            ))
          ) : (
            <EmptyState
              title="No posts found"
              message={`No posts from @${search} yet.`}
              icon="search-outline"
            />
          )
        ) : search ? (
          <EmptyState
            title="No posts found"
            message={`No posts from @${search} yet.`}
            icon="search-outline"
          />
        ) : (
          <EmptyState
            title="No posts yet"
            message="Posts will appear here once the feed is connected."
            icon="newspaper-outline"
          />
        )}
      </View>
    </Screen>
  );
}

const styles = StyleSheet.create({
  content: {
    paddingBottom: 100,
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
});
