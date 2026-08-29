import api from './api';
import { mapApiComment, BackendComment } from '@/utils/mapComment';

export type CommentAuthor = {
  _id: string;
  name: string;
  username: string;
  avatar?: string | null;
};

export type Comment = {
  _id: string;
  content: string;
  author: CommentAuthor;
  createdAt: string;
  updatedAt?: string;
};

export type CommentsPagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type CommentsResponse = {
  comments: Comment[];
  pagination: CommentsPagination;
};

export type CreateCommentResponse = {
  comment: Comment;
  commentsCount: number;
};

export type DeleteCommentResponse = {
  commentsCount: number;
};

type BackendCommentsData = {
  comments: BackendComment[];
  pagination: CommentsPagination;
};

type BackendCreateCommentData = {
  comment: BackendComment;
  commentsCount: number;
};

type BackendSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export const commentService = {
  async getComments(
    postId: string,
    params?: { page?: number; limit?: number },
  ): Promise<CommentsResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 20;

    const response = await api.get<BackendSuccess<BackendCommentsData>>(
      `/posts/${postId}/comments`,
      { params: { page, limit } },
    );

    return {
      comments: response.data.data.comments.map(mapApiComment),
      pagination: response.data.data.pagination,
    };
  },

  async createComment(postId: string, content: string): Promise<CreateCommentResponse> {
    const response = await api.post<BackendSuccess<BackendCreateCommentData>>(
      `/posts/${postId}/comments`,
      { content: content.trim() },
    );

    return {
      comment: mapApiComment(response.data.data.comment),
      commentsCount: response.data.data.commentsCount,
    };
  },

  async deleteComment(commentId: string): Promise<DeleteCommentResponse> {
    const response = await api.delete<BackendSuccess<DeleteCommentResponse>>(
      `/comments/${commentId}`,
    );

    return response.data.data;
  },
};
