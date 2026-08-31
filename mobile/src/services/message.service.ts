import api from './api';

export type MessageParticipant = {
  _id: string;
  name: string;
  username: string;
  avatar?: string | null;
};

export type MessageType = 'text' | 'shared_post';

export type Message = {
  _id: string;
  conversationId: string;
  senderId: string;
  receiverId: string;
  type?: MessageType;
  text: string;
  postId?: string | null;
  readAt: string | null;
  createdAt: string;
};

export type LastMessage = {
  text: string;
  senderId: string;
  createdAt: string;
  type?: MessageType;
  postId?: string | null;
};

export type ConversationPreview = {
  conversationId: string;
  participant: MessageParticipant;
  lastMessage: LastMessage | null;
  lastMessageAt: string | null;
  unreadCount: number;
};

export type MessagesPagination = {
  limit: number;
  hasMore: boolean;
  nextBefore: string | null;
};

export type MessagesResponse = {
  conversationId: string;
  messages: Message[];
  pagination: MessagesPagination;
};

type BackendSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export const messageService = {
  async getConversations(): Promise<ConversationPreview[]> {
    const response = await api.get<BackendSuccess<{ conversations: ConversationPreview[] }>>(
      '/conversations',
    );
    return response.data.data.conversations;
  },

  async getMessages(
    userId: string,
    params?: { limit?: number; before?: string },
  ): Promise<MessagesResponse> {
    const response = await api.get<BackendSuccess<MessagesResponse>>(
      `/conversations/${userId}/messages`,
      { params },
    );
    return response.data.data;
  },
};
