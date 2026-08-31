import { useCallback, useEffect, useMemo } from 'react';
import { FlatList, ListRenderItem, RefreshControl, StyleSheet } from 'react-native';
import { useRouter, useSegments } from 'expo-router';
import { Screen, AppHeader, EmptyState, ErrorState, IconButton } from '@/components/ui';
import { ConversationListItem } from '@/components/messages/ConversationListItem';
import { InboxSkeleton } from '@/components/messages/MessagesSkeleton';
import { useMessaging } from '@/hooks/useMessaging';
import { usePreview } from '@/preview';
import { ConversationPreview } from '@/services/message.service';
import { spacing } from '@/theme/spacing';

export default function MessagesScreen() {
  const router = useRouter();
  const segments = useSegments();
  const activeTab = segments[1];
  const { isPreviewMode } = usePreview();
  const { conversations, loading, error, refreshConversations, typingByUserId } = useMessaging();

  const openCompose = useCallback(() => {
    router.push('/messages/compose');
  }, [router]);

  const composeAction = useMemo(
    () => (
      <IconButton
        icon="create-outline"
        accessibilityLabel="New message"
        onPress={openCompose}
      />
    ),
    [openCompose],
  );

  useEffect(() => {
    if (activeTab === 'messages' && !isPreviewMode) {
      void refreshConversations();
    }
  }, [activeTab, isPreviewMode, refreshConversations]);

  const renderItem: ListRenderItem<ConversationPreview> = useCallback(
    ({ item }) => (
      <ConversationListItem
        conversation={item}
        isTyping={typingByUserId[item.participant._id]}
        onPress={() =>
          router.push({
            pathname: '/messages/[userId]',
            params: {
              userId: item.participant._id,
              name: item.participant.name,
              username: item.participant.username,
              avatar: item.participant.avatar ?? '',
            },
          })
        }
      />
    ),
    [router, typingByUserId],
  );

  const keyExtractor = useCallback((item: ConversationPreview) => item.conversationId, []);

  const emptyState = useMemo(
    () => (
      <EmptyState
        title="No messages yet"
        message="Start a conversation with someone you follow."
        icon="chatbubbles-outline"
        actionLabel="New message"
        onAction={openCompose}
      />
    ),
    [openCompose],
  );

  if (isPreviewMode) {
    return (
      <Screen scroll={false}>
        <AppHeader title="Messages" />
        <EmptyState
          title="Messages unavailable in preview"
          message="Sign in to use direct messaging."
          icon="chatbubbles-outline"
        />
      </Screen>
    );
  }

  if (loading && conversations.length === 0) {
    return (
      <Screen scroll={false}>
        <AppHeader title="Messages" rightAction={composeAction} />
        <InboxSkeleton />
      </Screen>
    );
  }

  return (
    <Screen scroll={false}>
      <AppHeader title="Messages" rightAction={composeAction} />
      {error && conversations.length === 0 ? (
        <ErrorState message={error} onRetry={() => void refreshConversations()} />
      ) : (
        <FlatList
          data={conversations}
          renderItem={renderItem}
          keyExtractor={keyExtractor}
          contentContainerStyle={conversations.length === 0 ? styles.emptyContainer : undefined}
          ListEmptyComponent={emptyState}
          refreshControl={
            <RefreshControl refreshing={loading} onRefresh={() => void refreshConversations()} />
          }
        />
      )}
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
