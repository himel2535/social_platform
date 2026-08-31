import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import {
  ConversationPreview,
  Message,
  messageService,
} from '@/services/message.service';
import { useSocket } from '@/context/SocketContext';
import { useAuth } from '@/hooks/useAuth';
import { usePreview } from '@/preview';
import { useToast } from '@/components/ui';
import { buildConversationId } from '@/utils/buildConversationId';

type NewMessagePayload = {
  message: Message;
  conversation: {
    conversationId: string;
    lastMessage: ConversationPreview['lastMessage'];
    lastMessageAt: string | null;
    unreadCount: number;
  };
};

type MessagesReadPayload = {
  conversationId: string;
  readByUserId: string;
  readAt: string;
};

type TypingPayload = {
  conversationId: string;
  userId: string;
};

type ActiveThreadHandlers = {
  onNewMessage: (message: Message) => void;
  onMessagesRead: (payload: MessagesReadPayload) => void;
  onTypingChange: (isTyping: boolean) => void;
};

type MessagingContextValue = {
  conversations: ConversationPreview[];
  loading: boolean;
  error: string;
  totalUnreadCount: number;
  typingByUserId: Record<string, boolean>;
  refreshConversations: () => Promise<void>;
  upsertConversation: (conversation: ConversationPreview) => void;
  registerActiveThread: (userId: string, handlers: ActiveThreadHandlers) => () => void;
  setActiveThreadUserId: (userId: string | null) => void;
};

const TYPING_IDLE_MS = 3000;

const MessagingContext = createContext<MessagingContextValue | null>(null);

export function MessagingProvider({ children }: { children: React.ReactNode }) {
  const { socket } = useSocket();
  const { user, isAuthenticated, isLoading } = useAuth();
  const { isPreviewMode } = usePreview();
  const { showToast } = useToast();

  const [conversations, setConversations] = useState<ConversationPreview[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [typingByUserId, setTypingByUserId] = useState<Record<string, boolean>>({});

  const activeThreadUserIdRef = useRef<string | null>(null);
  const activeThreadHandlersRef = useRef<ActiveThreadHandlers | null>(null);
  const typingTimeoutsRef = useRef<Record<string, ReturnType<typeof setTimeout>>>({});

  const totalUnreadCount = useMemo(
    () => conversations.reduce((sum, conversation) => sum + conversation.unreadCount, 0),
    [conversations],
  );

  const clearInboxTyping = useCallback((userId: string) => {
    if (typingTimeoutsRef.current[userId]) {
      clearTimeout(typingTimeoutsRef.current[userId]);
      delete typingTimeoutsRef.current[userId];
    }

    setTypingByUserId((current) => {
      if (!current[userId]) {
        return current;
      }

      const next = { ...current };
      delete next[userId];
      return next;
    });
  }, []);

  const setInboxTyping = useCallback(
    (userId: string) => {
      if (typingTimeoutsRef.current[userId]) {
        clearTimeout(typingTimeoutsRef.current[userId]);
      }

      setTypingByUserId((current) => ({ ...current, [userId]: true }));

      typingTimeoutsRef.current[userId] = setTimeout(() => {
        clearInboxTyping(userId);
      }, TYPING_IDLE_MS);
    },
    [clearInboxTyping],
  );

  const refreshConversations = useCallback(async () => {
    if (isPreviewMode || !isAuthenticated) {
      setConversations([]);
      return;
    }

    setLoading(true);
    setError('');

    try {
      const result = await messageService.getConversations();
      // Backend returns lastMessageAt desc; keep the same order after fetch.
      setConversations(
        [...result].sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime(),
        ),
      );
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to load conversations';
      setError(message);
    } finally {
      setLoading(false);
    }
  }, [isAuthenticated, isPreviewMode]);

  const upsertConversation = useCallback((conversation: ConversationPreview) => {
    setConversations((current) => {
      const existingIndex = current.findIndex(
        (item) => item.conversationId === conversation.conversationId,
      );

      if (existingIndex === -1) {
        return [conversation, ...current].sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime(),
        );
      }

      const next = [...current];
      next[existingIndex] = { ...next[existingIndex], ...conversation };
      return next.sort(
        (a, b) =>
          new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime(),
      );
    });
  }, []);

  const registerActiveThread = useCallback((userId: string, handlers: ActiveThreadHandlers) => {
    activeThreadUserIdRef.current = userId;
    activeThreadHandlersRef.current = handlers;

    return () => {
      if (activeThreadUserIdRef.current === userId) {
        activeThreadUserIdRef.current = null;
        activeThreadHandlersRef.current = null;
      }
    };
  }, []);

  const setActiveThreadUserId = useCallback((userId: string | null) => {
    activeThreadUserIdRef.current = userId;
    if (!userId) {
      activeThreadHandlersRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (isLoading) {
      return;
    }

    void refreshConversations();
  }, [isLoading, refreshConversations]);

  useEffect(() => {
    return () => {
      Object.values(typingTimeoutsRef.current).forEach(clearTimeout);
    };
  }, []);

  useEffect(() => {
    if (!socket || !user) {
      return;
    }

    const isActiveThreadForUser = (otherUserId: string) =>
      activeThreadUserIdRef.current != null && activeThreadUserIdRef.current === otherUserId;

    const handleNewMessage = (payload: NewMessagePayload) => {
      const { message, conversation } = payload;
      const otherUserId =
        message.senderId === user._id ? message.receiverId : message.senderId;

      clearInboxTyping(otherUserId);

      const isActiveThread = isActiveThreadForUser(otherUserId);

      setConversations((current) => {
        const existing = current.find(
          (item) => item.conversationId === conversation.conversationId,
        );

        const updated: ConversationPreview = {
          conversationId: conversation.conversationId,
          participant: existing?.participant || {
            _id: otherUserId,
            name: 'User',
            username: 'user',
            avatar: null,
          },
          lastMessage: conversation.lastMessage,
          lastMessageAt: conversation.lastMessageAt,
          unreadCount: isActiveThread ? 0 : conversation.unreadCount,
        };

        const withoutExisting = current.filter(
          (item) => item.conversationId !== conversation.conversationId,
        );

        return [updated, ...withoutExisting].sort(
          (a, b) =>
            new Date(b.lastMessageAt || 0).getTime() - new Date(a.lastMessageAt || 0).getTime(),
        );
      });

      if (isActiveThread && activeThreadHandlersRef.current) {
        activeThreadHandlersRef.current.onNewMessage(message);
      }
    };

    const handleMessagesRead = (payload: MessagesReadPayload) => {
      if (activeThreadHandlersRef.current) {
        activeThreadHandlersRef.current.onMessagesRead(payload);
      }

      setConversations((current) =>
        current.map((conversation) =>
          conversation.conversationId === payload.conversationId
            ? { ...conversation, unreadCount: 0 }
            : conversation,
        ),
      );
    };

    const handleTyping = (payload: TypingPayload) => {
      if (!user || payload.userId === user._id) {
        return;
      }

      const otherUserId = payload.userId;
      const isActiveThread =
        activeThreadUserIdRef.current != null &&
        buildConversationId(activeThreadUserIdRef.current, user._id) === payload.conversationId;

      if (isActiveThread && activeThreadHandlersRef.current) {
        activeThreadHandlersRef.current.onTypingChange(true);
        return;
      }

      setInboxTyping(otherUserId);
    };

    const handleStoppedTyping = (payload: TypingPayload) => {
      if (!user || payload.userId === user._id) {
        return;
      }

      const isActiveThread =
        activeThreadUserIdRef.current != null &&
        buildConversationId(activeThreadUserIdRef.current, user._id) === payload.conversationId;

      if (isActiveThread && activeThreadHandlersRef.current) {
        activeThreadHandlersRef.current.onTypingChange(false);
        return;
      }

      clearInboxTyping(payload.userId);
    };

    const handleError = (payload: { message?: string; code?: string }) => {
      if (payload?.message) {
        showToast(payload.message, 'error');
      }
    };

    socket.on('new_message', handleNewMessage);
    socket.on('messages_read', handleMessagesRead);
    socket.on('user_typing', handleTyping);
    socket.on('user_stopped_typing', handleStoppedTyping);
    socket.on('error', handleError);

    return () => {
      socket.off('new_message', handleNewMessage);
      socket.off('messages_read', handleMessagesRead);
      socket.off('user_typing', handleTyping);
      socket.off('user_stopped_typing', handleStoppedTyping);
      socket.off('error', handleError);
    };
  }, [clearInboxTyping, setInboxTyping, showToast, socket, user]);

  const value = useMemo(
    () => ({
      conversations,
      loading,
      error,
      totalUnreadCount,
      typingByUserId,
      refreshConversations,
      upsertConversation,
      registerActiveThread,
      setActiveThreadUserId,
    }),
    [
      conversations,
      error,
      loading,
      refreshConversations,
      registerActiveThread,
      setActiveThreadUserId,
      totalUnreadCount,
      typingByUserId,
      upsertConversation,
    ],
  );

  return <MessagingContext.Provider value={value}>{children}</MessagingContext.Provider>;
}

export function useMessagingContext() {
  const context = useContext(MessagingContext);
  if (!context) {
    throw new Error('useMessagingContext must be used within MessagingProvider');
  }
  return context;
}
