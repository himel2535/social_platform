import api from './api';
import { User } from './auth.service';

export type Post = {
  _id: string;
  content: string;
  author: User;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
};

export type PostsResponse = {
  posts: Post[];
  page: number;
  totalPages: number;
  total: number;
};

export type CreatePostData = {
  content: string;
};

export const postService = {
  async getPosts(_params?: { page?: number; limit?: number; username?: string }): Promise<PostsResponse> {
    return { posts: [], page: 1, totalPages: 0, total: 0 };
  },

  async createPost(_data: CreatePostData): Promise<Post> {
    throw new Error('Not implemented — Phase 8');
  },

  async likePost(_postId: string): Promise<void> {
    throw new Error('Not implemented — Phase 7');
  },
};
