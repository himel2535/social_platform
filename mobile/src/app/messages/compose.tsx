import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ListRenderItem, StyleSheet } from 'react-native';
import { useRouter } from 'expo-router';
import {
  Screen,
  AppHeader,
  IconButton,
  EmptyState,
  ErrorState,
  CenteredLoading,
} from '@/components/ui';
import { SearchBar } from '@/components/feed/SearchBar';
import { UserPickerRow } from '@/components/messages/UserPickerRow';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';
import { userService, UserProfile } from '@/services/user.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { useSafeBack } from '@/hooks/useSafeBack';
import { spacing } from '@/theme/spacing';

const DEBOUNCE_MS = 300;

function mergeUsers(followers: UserProfile[], following: UserProfile[], selfId: string): UserProfile[] {
  const map = new Map<string, UserProfile>();

  for (const user of [...followers, ...following]) {
    if (user._id !== selfId) {
      map.set(user._id, user);
    }
  }

  return Array.from(map.values()).sort((a, b) => a.name.localeCompare(b.name));
}

export default function ComposeMessageScreen() {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)/messages');
  const { user } = useAuth();
  const { isPreviewMode } = usePreview();

  const [query, setQuery] = useState('');
  const [defaultUsers, setDefaultUsers] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loadingDefault, setLoadingDefault] = useState(!isPreviewMode);
  const [loadingSearch, setLoadingSearch] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadDefaultUsers = useCallback(async () => {
    if (isPreviewMode || !user?.username) {
      setLoadingDefault(false);
      return;
    }

    setLoadingDefault(true);
    setError('');

    try {
      const [followers, following] = await Promise.all([
        userService.getFollowers(user.username, 1, 50),
        userService.getFollowing(user.username, 1, 50),
      ]);

      setDefaultUsers(mergeUsers(followers.users, following.users, user._id));
    } catch (err) {
      setDefaultUsers([]);
      setError(normalizeApiError(err as ApiError, 'general'));
    } finally {
      setLoadingDefault(false);
    }
  }, [isPreviewMode, user?._id, user?.username]);

  useEffect(() => {
    void loadDefaultUsers();
  }, [loadDefaultUsers]);

  const runSearch = useCallback(
    async (value: string) => {
      const trimmed = value.trim();

      if (!trimmed) {
        setSearchResults([]);
        setLoadingSearch(false);
        return;
      }

      if (isPreviewMode) {
        setSearchResults([]);
        return;
      }

      setLoadingSearch(true);
      setError('');

      try {
        const data = await userService.searchUsers(trimmed, 1, 20);
        setSearchResults(data.users.filter((item) => item._id !== user?._id));
      } catch (err) {
        setSearchResults([]);
        setError(normalizeApiError(err as ApiError, 'general'));
      } finally {
        setLoadingSearch(false);
      }
    },
    [isPreviewMode, user?._id],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      void runSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, runSearch]);

  const users = useMemo(
    () => (query.trim() ? searchResults : defaultUsers),
    [defaultUsers, query, searchResults],
  );

  const handleSelectUser = useCallback(
    (selected: UserProfile) => {
      router.push({
        pathname: '/messages/[userId]',
        params: {
          userId: selected._id,
          name: selected.name,
          username: selected.username,
          avatar: selected.avatar ?? '',
        },
      });
    },
    [router],
  );

  const renderItem: ListRenderItem<UserProfile> = useCallback(
    ({ item }) => <UserPickerRow user={item} onPress={() => handleSelectUser(item)} />,
    [handleSelectUser],
  );

  const keyExtractor = useCallback((item: UserProfile) => item._id, []);

  if (isPreviewMode) {
    return (
      <Screen scroll={false}>
        <AppHeader
          title="New message"
          leftAction={
            <IconButton icon="arrow-back" accessibilityLabel="Go back" onPress={goBack} />
          }
        />
        <EmptyState
          title="Sign in to message"
          message="Direct messaging is unavailable in preview mode."
          icon="chatbubbles-outline"
        />
      </Screen>
    );
  }

  const isLoading = query.trim() ? loadingSearch : loadingDefault;

  const listEmpty = useMemo(() => {
    if (isLoading) {
      return <CenteredLoading />;
    }

    if (error) {
      return (
        <ErrorState
          message={error}
          onRetry={() => (query.trim() ? void runSearch(query) : void loadDefaultUsers())}
        />
      );
    }

    if (query.trim()) {
      return (
        <EmptyState
          title="No users found"
          message={`No results for "${query.trim()}".`}
          icon="person-outline"
        />
      );
    }

    return (
      <EmptyState
        title="No contacts yet"
        message="Follow people to start messaging them."
        icon="people-outline"
      />
    );
  }, [error, isLoading, loadDefaultUsers, query, runSearch]);

  return (
    <Screen scroll={false}>
      <AppHeader
        title="New message"
        leftAction={
          <IconButton icon="arrow-back" accessibilityLabel="Go back" onPress={goBack} />
        }
      />
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search people..." />
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        contentContainerStyle={users.length === 0 ? styles.emptyContainer : undefined}
        ListEmptyComponent={listEmpty}
        keyboardShouldPersistTaps="handled"
      />
    </Screen>
  );
}

const styles = StyleSheet.create({
  emptyContainer: {
    flexGrow: 1,
    justifyContent: 'center',
    padding: spacing.lg,
  },
});
