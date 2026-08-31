import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { FlatList, ListRenderItem, Pressable, StyleSheet, View } from 'react-native';
import { BottomSheet, Typography, useToast } from '@/components/ui';
import { SearchBar } from '@/components/feed/SearchBar';
import { UserPickerRow } from '@/components/messages/UserPickerRow';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useMessaging } from '@/hooks/useMessaging';
import { Post } from '@/services/post.service';
import { UserProfile, userService } from '@/services/user.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';

const DEBOUNCE_MS = 300;

type Props = {
  visible: boolean;
  post: Post;
  onClose: () => void;
  onNativeShare: () => void;
};

type SendAck = {
  success: boolean;
  message?: string;
};

function mergeOrderedUsers(
  conversations: ReturnType<typeof useMessaging>['conversations'],
  followers: UserProfile[],
  following: UserProfile[],
  selfId: string,
): UserProfile[] {
  const seen = new Set<string>();
  const ordered: UserProfile[] = [];

  const addUser = (user: UserProfile) => {
    if (!user || user._id === selfId || seen.has(user._id)) {
      return;
    }
    seen.add(user._id);
    ordered.push(user);
  };

  conversations.forEach((conversation) => {
    addUser({
      _id: conversation.participant._id,
      name: conversation.participant.name,
      username: conversation.participant.username,
      avatar: conversation.participant.avatar,
    });
  });

  const followerIds = new Set(followers.map((user) => user._id));
  following.forEach((user) => {
    if (followerIds.has(user._id)) {
      addUser(user);
    }
  });

  following.forEach((user) => addUser(user));
  followers.forEach((user) => addUser(user));

  return ordered;
}

export function SharePostSheet({ visible, post, onClose, onNativeShare }: Props) {
  const { user } = useAuth();
  const { socket } = useSocket();
  const { conversations } = useMessaging();
  const { showToast } = useToast();

  const [query, setQuery] = useState('');
  const [defaultUsers, setDefaultUsers] = useState<UserProfile[]>([]);
  const [searchResults, setSearchResults] = useState<UserProfile[]>([]);
  const [loading, setLoading] = useState(false);
  const [sharingId, setSharingId] = useState<string | null>(null);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const loadUsers = useCallback(async () => {
    if (!user?.username) {
      return;
    }

    setLoading(true);

    try {
      const [followersResult, followingResult] = await Promise.all([
        userService.getFollowers(user.username, 1, 50),
        userService.getFollowing(user.username, 1, 50),
      ]);

      setDefaultUsers(
        mergeOrderedUsers(
          conversations,
          followersResult.users,
          followingResult.users,
          user._id,
        ),
      );
    } catch {
      setDefaultUsers(
        conversations.map((conversation) => ({
          _id: conversation.participant._id,
          name: conversation.participant.name,
          username: conversation.participant.username,
          avatar: conversation.participant.avatar,
        })),
      );
    } finally {
      setLoading(false);
    }
  }, [conversations, user?._id, user?.username]);

  useEffect(() => {
    if (visible) {
      void loadUsers();
    } else {
      setQuery('');
      setSearchResults([]);
    }
  }, [loadUsers, visible]);

  const runSearch = useCallback(
    async (value: string) => {
      const trimmed = value.trim();
      if (!trimmed) {
        setSearchResults([]);
        return;
      }

      setLoading(true);
      try {
        const data = await userService.searchUsers(trimmed, 1, 20);
        setSearchResults(data.users.filter((item) => item._id !== user?._id));
      } catch (err) {
        setSearchResults([]);
        showToast(normalizeApiError(err as ApiError, 'general'), 'error');
      } finally {
        setLoading(false);
      }
    },
    [showToast, user?._id],
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

  const handleShareToUser = useCallback(
    (selected: UserProfile) => {
      if (!socket) {
        showToast('Unable to share right now', 'error');
        return;
      }

      setSharingId(selected._id);

      socket.emit(
        'send_message',
        {
          receiverId: selected._id,
          type: 'shared_post',
          postId: post._id,
        },
        (ack: SendAck) => {
          setSharingId(null);

          if (ack?.success) {
            showToast(`Shared with ${selected.name}`, 'success');
            onClose();
            return;
          }

          showToast(ack?.message || 'Failed to share post', 'error');
        },
      );
    },
    [onClose, post._id, showToast, socket],
  );

  const renderItem: ListRenderItem<UserProfile> = useCallback(
    ({ item }) => (
      <UserPickerRow
        user={item}
        onPress={() => handleShareToUser(item)}
      />
    ),
    [handleShareToUser],
  );

  const keyExtractor = useCallback((item: UserProfile) => item._id, []);

  return (
    <BottomSheet visible={visible} onClose={onClose} title="Share post">
      <SearchBar value={query} onChangeText={setQuery} placeholder="Search people..." />
      <FlatList
        data={users}
        renderItem={renderItem}
        keyExtractor={keyExtractor}
        style={styles.list}
        keyboardShouldPersistTaps="handled"
        ListEmptyComponent={
          <Typography variant="metadata" style={styles.empty}>
            {loading ? 'Loading…' : 'No people to share with yet.'}
          </Typography>
        }
      />
      <Pressable
        style={styles.nativeShare}
        onPress={() => {
          onClose();
          onNativeShare();
        }}
        accessibilityRole="button"
        accessibilityLabel="Share via system share sheet"
      >
        <Typography variant="button" style={styles.nativeShareText}>
          Share via…
        </Typography>
      </Pressable>
      {sharingId ? (
        <View style={styles.sharingOverlay} pointerEvents="none">
          <Typography variant="metadata" style={styles.sharingText}>
            Sharing…
          </Typography>
        </View>
      ) : null}
    </BottomSheet>
  );
}

const styles = StyleSheet.create({
  list: {
    maxHeight: 320,
  },
  empty: {
    textAlign: 'center',
    padding: spacing.lg,
    color: 'rgba(255,255,255,0.55)',
  },
  nativeShare: {
    marginTop: spacing.md,
    paddingVertical: spacing.md,
    alignItems: 'center',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: 'rgba(255,255,255,0.08)',
  },
  nativeShareText: {
    color: colors.secondary,
  },
  sharingOverlay: {
    position: 'absolute',
    bottom: spacing.lg,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  sharingText: {
    color: 'rgba(255,255,255,0.65)',
  },
});
