import api from './api';
import { mapApiPost, BackendPost } from '@/utils/mapPost';
import { cachePost } from '@/utils/postCache';

export type PostAuthor = {
  _id: string;
  name: string;
  username: string;
  avatar?: string | null;
};

export type Post = {
  _id: string;
  content: string;
  author: PostAuthor;
  likesCount: number;
  commentsCount: number;
  isLiked: boolean;
  createdAt: string;
  updatedAt?: string;
};

export type Pagination = {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
  hasNextPage: boolean;
  hasPrevPage: boolean;
};

export type PostsResponse = {
  posts: Post[];
  pagination: Pagination;
};

export type CreatePostData = {
  content: string;
};

type BackendPagination = Pagination;

type BackendPostsData = {
  posts: BackendPost[];
  pagination: BackendPagination;
};

type BackendCreatePostData = {
  post: BackendPost;
};

type BackendSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export const postService = {
  async getPosts(params?: { page?: number; limit?: number }): Promise<PostsResponse> {
    const page = params?.page ?? 1;
    const limit = params?.limit ?? 10;

    const response = await api.get<BackendSuccess<BackendPostsData>>('/posts', {
      params: { page, limit },
    });

    const posts = response.data.data.posts.map(mapApiPost);

    return {
      posts,
      pagination: response.data.data.pagination,
    };
  },

  async createPost(data: CreatePostData): Promise<Post> {
    const response = await api.post<BackendSuccess<BackendCreatePostData>>('/posts', {
      content: data.content.trim(),
    });

    const post = mapApiPost(response.data.data.post);
    cachePost(post);
    return post;
  },

  async likePost(_postId: string): Promise<void> {
    throw new Error('Not implemented — Phase 7');
  },
};
