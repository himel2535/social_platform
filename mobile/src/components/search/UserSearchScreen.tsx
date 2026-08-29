import { useCallback, useEffect, useRef, useState } from 'react';
import { View, StyleSheet, Pressable } from 'react-native';
import { useRouter } from 'expo-router';
import {
  AppHeader,
  IconButton,
  Avatar,
  Typography,
  LoadingSpinner,
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

  const handleSelectUser = (username: string) => {
    router.push(`/profile/${username}`);
  };

  return (
    <View style={styles.container}>
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

      <View style={styles.results}>
        {loading ? (
          <LoadingSpinner style={styles.centered} />
        ) : error ? (
          <ErrorState message={error} onRetry={() => runSearch(query)} />
        ) : query.trim().length === 0 ? (
          <EmptyState
            title="Search for users"
            message="Enter a name or username to find people."
            icon="search-outline"
          />
        ) : results.length === 0 ? (
          <EmptyState
            title="No users found"
            message={`No results for "${query.trim()}".`}
            icon="person-outline"
          />
        ) : (
          results.map((user) => (
            <Pressable
              key={user._id}
              style={styles.resultRow}
              onPress={() => handleSelectUser(user.username)}
              accessibilityRole="button"
              accessibilityLabel={`View profile for ${user.name}`}
            >
              <Avatar name={user.name} uri={user.avatar} size={44} />
              <View style={styles.resultInfo}>
                <Typography variant="userName">{user.name}</Typography>
                <Typography variant="username">@{user.username}</Typography>
                {user.bio ? (
                  <Typography variant="metadata" numberOfLines={1}>
                    {user.bio}
                  </Typography>
                ) : null}
              </View>
            </Pressable>
          ))
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  results: {
    marginTop: spacing.lg,
  },
  centered: {
    marginTop: spacing.lg,
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
