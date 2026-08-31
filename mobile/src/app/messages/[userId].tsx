import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import {
  View,
  FlatList,
  ListRenderItem,
  StyleSheet,
  Pressable,
  KeyboardAvoidingView,
  Platform,
  NativeSyntheticEvent,
  NativeScrollEvent,
} from 'react-native';
import { useLocalSearchParams } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import { Screen, Avatar, Typography, useToast } from '@/components/ui';
import { MessageBubble, DisplayMessage } from '@/components/messages/MessageBubble';
import { DateDivider } from '@/components/messages/DateDivider';
import { MessageInput } from '@/components/messages/MessageInput';
import { TypingIndicator } from '@/components/messages/TypingIndicator';
import { ThreadSkeleton } from '@/components/messages/MessagesSkeleton';
import { useAuth } from '@/hooks/useAuth';
import { useSocket } from '@/hooks/useSocket';
import { useMessaging } from '@/hooks/useMessaging';
import { Message, messageService } from '@/services/message.service';
import { buildConversationId } from '@/utils/buildConversationId';
import { buildThreadItems, ThreadItem } from '@/utils/messageList';
import { spacing } from '@/theme/spacing';
import { colors } from '@/theme/colors';
import { useSafeBack } from '@/hooks/useSafeBack';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';

type LocalMessage = Message & {
  pending?: boolean;
  tempId?: string;
};

type SendAck = {
  success: boolean;
  message?: string;
  code?: string;
  data?: {
    message: Message;
  };
};

const NEAR_BOTTOM_THRESHOLD = 80;

export default function ConversationScreen() {
  const { userId, name, username, avatar } = useLocalSearchParams<{
    userId: string;
    name?: string;
    username?: string;
    avatar?: string;
  }>();
  const goBack = useSafeBack('/(tabs)/messages');
  const { user } = useAuth();
  const { socket } = useSocket();
  const { conversations, registerActiveThread, upsertConversation, refreshConversations } =
    useMessaging();
  const { showToast } = useToast();

  const [messages, setMessages] = useState<LocalMessage[]>([]);
  const [conversationId, setConversationId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(true);
  const [loadingMore, setLoadingMore] = useState(false);
  const [hasMore, setHasMore] = useState(false);
  const [nextBefore, setNextBefore] = useState<string | null>(null);
  const [sending, setSending] = useState(false);
  const [isTyping, setIsTyping] = useState(false);
  const [participantName, setParticipantName] = useState('User');
  const [participantUsername, setParticipantUsername] = useState('');
  const [participantAvatar, setParticipantAvatar] = useState<string | null>(null);

  const flatListRef = useRef<FlatList<ThreadItem>>(null);
  const loadingMoreRef = useRef(false);
  const markedReadRef = useRef(false);
  const isNearBottomRef = useRef(true);
  const initialScrollDoneRef = useRef(false);
  const previousMessageCountRef = useRef(0);

  const cachedConversation = useMemo(
    () => conversations.find((item) => item.participant._id === userId),
    [conversations, userId],
  );

  useEffect(() => {
    markedReadRef.current = false;
    initialScrollDoneRef.current = false;
    previousMessageCountRef.current = 0;
    isNearBottomRef.current = true;
  }, [userId]);

  useEffect(() => {
    if (cachedConversation) {
      setParticipantName(cachedConversation.participant.name);
      setParticipantUsername(cachedConversation.participant.username);
      setParticipantAvatar(cachedConversation.participant.avatar ?? null);
      setConversationId(cachedConversation.conversationId);
      return;
    }

    if (name) {
      setParticipantName(name);
    }
    if (username) {
      setParticipantUsername(username);
    }
    if (avatar) {
      setParticipantAvatar(avatar);
    }
    if (user && userId) {
      setConversationId(buildConversationId(user._id, userId));
    }
  }, [avatar, cachedConversation, name, user, userId, username]);

  const scrollToBottom = useCallback((animated = true) => {
    flatListRef.current?.scrollToOffset({ offset: 0, animated });
  }, []);

  const loadMessages = useCallback(
    async (before?: string) => {
      if (!userId) {
        return;
      }

      if (before) {
        if (loadingMoreRef.current) {
          return;
        }
        loadingMoreRef.current = true;
        setLoadingMore(true);
      } else {
        setLoading(true);
      }

      try {
        const result = await messageService.getMessages(userId, {
          limit: 30,
          before,
        });

        setConversationId(result.conversationId);

        const chronological = [...result.messages].reverse();

        setMessages((current) => {
          if (before) {
            const existingIds = new Set(current.map((item) => item._id));
            const older = chronological.filter((item) => !existingIds.has(item._id));
            return [...older, ...current];
          }
          return chronological;
        });

        setHasMore(result.pagination.hasMore);
        setNextBefore(result.pagination.nextBefore);
      } catch (err) {
        showToast(normalizeApiError(err as ApiError, 'general'), 'error');
      } finally {
        setLoading(false);
        setLoadingMore(false);
        loadingMoreRef.current = false;
      }
    },
    [showToast, userId],
  );

  useEffect(() => {
    if (!userId) {
      return;
    }

    void loadMessages();
  }, [loadMessages, userId]);

  useEffect(() => {
    if (!userId || !user) {
      return;
    }

    const unregister = registerActiveThread(userId, {
      onNewMessage: (message) => {
        setMessages((current) => {
          if (current.some((item) => item._id === message._id)) {
            return current;
          }

          const pendingIndex = current.findIndex(
            (item) =>
              item.pending &&
              item.text === message.text &&
              item.senderId === message.senderId,
          );

          if (pendingIndex >= 0) {
            const next = [...current];
            next[pendingIndex] = message;
            return next;
          }

          return [...current, message];
        });
      },
      onMessagesRead: ({ readAt }) => {
        setMessages((current) =>
          current.map((item) =>
            item.senderId === user._id && !item.readAt ? { ...item, readAt } : item,
          ),
        );
      },
      onTypingChange: setIsTyping,
    });

    return unregister;
  }, [registerActiveThread, user, userId]);

  useEffect(() => {
    if (!socket || !conversationId || markedReadRef.current) {
      return;
    }

    markedReadRef.current = true;
    socket.emit('mark_read', { conversationId });
  }, [conversationId, socket]);

  const displayMessages: DisplayMessage[] = useMemo(
    () =>
      messages.map((message) => ({
        _id: message._id,
        text: message.text,
        createdAt: message.createdAt,
        readAt: message.readAt,
        isOwn: message.senderId === user?._id,
        pending: message.pending,
      })),
    [messages, user?._id],
  );

  const threadItems = useMemo(() => buildThreadItems(displayMessages), [displayMessages]);

  useEffect(() => {
    if (loading || threadItems.length === 0) {
      return;
    }

    if (!initialScrollDoneRef.current) {
      initialScrollDoneRef.current = true;
      requestAnimationFrame(() => scrollToBottom(false));
      previousMessageCountRef.current = displayMessages.length;
      return;
    }

    if (displayMessages.length > previousMessageCountRef.current && isNearBottomRef.current) {
      requestAnimationFrame(() => scrollToBottom(true));
    }

    previousMessageCountRef.current = displayMessages.length;
  }, [displayMessages.length, loading, scrollToBottom, threadItems.length]);

  const handleScroll = useCallback((event: NativeSyntheticEvent<NativeScrollEvent>) => {
    isNearBottomRef.current = event.nativeEvent.contentOffset.y <= NEAR_BOTTOM_THRESHOLD;
  }, []);

  const handleLoadMore = useCallback(() => {
    if (!hasMore || !nextBefore) {
      return;
    }
    void loadMessages(nextBefore);
  }, [hasMore, loadMessages, nextBefore]);

  const handleSend = useCallback(async () => {
    if (!socket || !user || !userId || !inputText.trim() || sending) {
      return;
    }

    const text = inputText.trim();
    const tempId = `temp-${Date.now()}`;
    const optimisticConversationId = conversationId || buildConversationId(user._id, userId);

    const optimisticMessage: LocalMessage = {
      _id: tempId,
      tempId,
      conversationId: optimisticConversationId,
      senderId: user._id,
      receiverId: userId,
      text,
      readAt: null,
      createdAt: new Date().toISOString(),
      pending: true,
    };

    setMessages((current) => [...current, optimisticMessage]);
    setInputText('');
    setSending(true);
    isNearBottomRef.current = true;

    socket.emit(
      'send_message',
      { receiverId: userId, text },
      (ack: SendAck) => {
        setSending(false);

        if (ack?.success && ack.data?.message) {
          const realMessage = ack.data.message;
          setConversationId(realMessage.conversationId);
          setMessages((current) =>
            current.map((item) =>
              item._id === tempId ? { ...realMessage, pending: false } : item,
            ),
          );

          upsertConversation({
            conversationId: realMessage.conversationId,
            participant: {
              _id: userId,
              name: participantName,
              username: participantUsername || 'user',
              avatar: participantAvatar,
            },
            lastMessage: {
              text: realMessage.text,
              senderId: realMessage.senderId,
              createdAt: realMessage.createdAt,
            },
            lastMessageAt: realMessage.createdAt,
            unreadCount: 0,
          });

          void refreshConversations();
          return;
        }

        setMessages((current) => current.filter((item) => item._id !== tempId));
        showToast(ack?.message || 'Failed to send message', 'error');
      },
    );
  }, [
    conversationId,
    inputText,
    participantAvatar,
    participantName,
    participantUsername,
    refreshConversations,
    sending,
    showToast,
    socket,
    upsertConversation,
    user,
    userId,
  ]);

  const renderItem: ListRenderItem<ThreadItem> = useCallback(({ item }) => {
    if (item.kind === 'date') {
      return <DateDivider label={item.label} />;
    }

    return (
      <MessageBubble message={item.message} groupedWithPrevious={item.groupedWithPrevious} />
    );
  }, []);

  const keyExtractor = useCallback((item: ThreadItem) => item.id, []);

  if (!userId) {
    return null;
  }

  return (
    <Screen scroll={false}>
      <View style={styles.header}>
        <Pressable
          onPress={goBack}
          style={styles.backButton}
          accessibilityRole="button"
          accessibilityLabel="Go back"
        >
          <Ionicons name="chevron-back" size={24} color={colors.textPrimary} />
        </Pressable>
        <Avatar
          name={participantName}
          uri={participantAvatar}
          size={36}
          shape="roundedSquare"
        />
        <View style={styles.headerInfo}>
          <Typography variant="userName" numberOfLines={1}>
            {participantName}
          </Typography>
          {participantUsername ? (
            <Typography variant="username">@{participantUsername}</Typography>
          ) : null}
        </View>
      </View>

      <KeyboardAvoidingView
        style={styles.flex}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={Platform.OS === 'ios' ? 8 : 0}
      >
        {loading && messages.length === 0 ? (
          <ThreadSkeleton />
        ) : (
          <FlatList
            ref={flatListRef}
            data={threadItems}
            renderItem={renderItem}
            keyExtractor={keyExtractor}
            inverted
            contentContainerStyle={styles.listContent}
            initialNumToRender={15}
            windowSize={7}
            maxToRenderPerBatch={10}
            removeClippedSubviews
            onScroll={handleScroll}
            scrollEventThrottle={16}
            onEndReached={handleLoadMore}
            onEndReachedThreshold={0.2}
            ListFooterComponent={loadingMore ? <ThreadSkeleton /> : null}
          />
        )}

        <TypingIndicator visible={isTyping} username={participantName} />
        <MessageInput
          receiverId={userId}
          value={inputText}
          onChangeText={setInputText}
          onSend={() => void handleSend()}
          sending={sending}
        />
      </KeyboardAvoidingView>
    </Screen>
  );
}

const styles = StyleSheet.create({
  flex: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: 'rgba(255,255,255,0.06)',
  },
  backButton: {
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerInfo: {
    flex: 1,
    gap: 2,
  },
  listContent: {
    paddingVertical: spacing.md,
  },
});
