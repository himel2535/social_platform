import { useCallback, useEffect, useRef, useState, useMemo } from 'react';
import { View, StyleSheet, Pressable, FlatList, ListRenderItem } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppHeader,
  IconButton,
  Avatar,
  Typography,
  CenteredLoading,
  EmptyState,
  ErrorState,
} from '@/components/ui';
import { SearchBar } from '@/components/feed/SearchBar';
import { spacing } from '@/theme/spacing';
import { usePreview, searchPreviewUsers } from '@/preview';
import { userService, UserProfile } from '@/services/user.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { useSafeBack } from '@/hooks/useSafeBack';

const DEBOUNCE_MS = 300;

type Props = {
  showBackButton?: boolean;
};

export function UserSearchScreen({ showBackButton = false }: Props) {
  const router = useRouter();
  const goBack = useSafeBack('/(tabs)');
  const { isPreviewMode } = usePreview();

  const [query, setQuery] = useState('');
  const [results, setResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const runSearch = useCallback(
    async (value: string) => {
      const trimmed = value.trim();

      if (!trimmed) {
        setResults([]);
        setError('');
        setLoading(false);
        return;
      }

      setLoading(true);
      setError('');

      try {
        if (isPreviewMode) {
          setResults(searchPreviewUsers(trimmed));
          return;
        }

        const data = await userService.searchUsers(trimmed, 1, 20);
        setResults(data.users);
      } catch (err) {
        setResults([]);
        setError(normalizeApiError(err as ApiError, 'general'));
      } finally {
        setLoading(false);
      }
    },
    [isPreviewMode],
  );

  useEffect(() => {
    if (debounceRef.current) {
      clearTimeout(debounceRef.current);
    }

    debounceRef.current = setTimeout(() => {
      runSearch(query);
    }, DEBOUNCE_MS);

    return () => {
      if (debounceRef.current) {
        clearTimeout(debounceRef.current);
      }
    };
  }, [query, runSearch]);

  const handleSelectUser = useCallback(
    (username: string) => {
      router.push(`/profile/${username}`);
    },
    [router],
  );

  const renderItem: ListRenderItem<UserProfile> = useCallback(
    ({ item }) => (
      <Pressable
        style={styles.resultRow}
        onPress={() => handleSelectUser(item.username)}
        accessibilityRole="button"
        accessibilityLabel={`View profile for ${item.name}`}
      >
        <Avatar name={item.name} uri={item.avatar} size={44} />
        <View style={styles.resultInfo}>
          <Typography variant="userName">{item.name}</Typography>
          <Typography variant="username">@{item.username}</Typography>
          {item.bio ? (
            <Typography variant="metadata" numberOfLines={1}>
              {item.bio}
            </Typography>
          ) : null}
        </View>
      </Pressable>
    ),
    [handleSelectUser],
  );

  const listHeader = useMemo(
    () => (
      <>
        <AppHeader
          title="Search Users"
          leftAction={
            showBackButton ? (
              <IconButton
                icon="arrow-back"
                accessibilityLabel="Go back"
                onPress={goBack}
              />
            ) : undefined
          }
        />
        <SearchBar
          value={query}
          onChangeText={setQuery}
          placeholder="Search by name or username..."
        />
      </>
    ),
    [showBackButton, goBack, query],
  );

  const listEmpty = useMemo(() => {
    if (loading) {
      return <CenteredLoading />;
    }

    if (error) {
      return <ErrorState message={error} onRetry={() => runSearch(query)} />;
    }

    if (query.trim().length === 0) {
      return (
        <EmptyState
          title="Search for users"
          message="Enter a name or username to find people."
          icon="search-outline"
        />
      );
    }

    if (results.length === 0) {
      return (
        <EmptyState
          title="No users found"
          message={`No results for "${query.trim()}".`}
          icon="person-outline"
        />
      );
    }

    return null;
  }, [loading, error, query, results.length, runSearch]);

  return (
    <View style={styles.container}>
      <FlatList
        data={results}
        keyExtractor={(item) => item._id}
        renderItem={renderItem}
        ListHeaderComponent={listHeader}
        ListEmptyComponent={listEmpty}
        contentContainerStyle={styles.listContent}
        keyboardShouldPersistTaps="handled"
        showsVerticalScrollIndicator={false}
        removeClippedSubviews
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  listContent: {
    flexGrow: 1,
    paddingBottom: spacing.xl,
  },
  resultRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: spacing.md,
  },
  resultInfo: {
    flex: 1,
    gap: spacing.xs,
  },
});
