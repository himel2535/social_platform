import api from './api';
import { Pagination, Post } from './post.service';

export type UserProfile = {
  _id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string | null;
  bio?: string;
  createdAt?: string;
  followersCount?: number;
  followingCount?: number;
  following?: boolean;
};

export type UpdateProfilePayload = {
  name?: string;
  bio?: string;
  avatar?: string;
};

export type UserSearchPagination = Pagination;

export type UserSearchResult = {
  users: UserProfile[];
  pagination: UserSearchPagination;
};

export type FollowResponse = {
  following: boolean;
  followersCount: number;
  followingCount: number;
};

export type UserListResult = {
  users: UserProfile[];
  pagination: UserSearchPagination;
};

export type UserPostsResult = {
  posts: Post[];
  pagination: UserSearchPagination;
};

type BackendUserData = {
  user: UserProfile;
};

type BackendSearchData = {
  users: UserProfile[];
  pagination: UserSearchPagination;
};

type BackendSuccess<T> = {
  success: true;
  message: string;
  data: T;
};

export const userService = {
  async getMe(): Promise<UserProfile> {
    const response = await api.get<BackendSuccess<BackendUserData>>('/users/me');
    return response.data.data.user;
  },

  async getUserProfile(username: string): Promise<UserProfile> {
    const response = await api.get<BackendSuccess<BackendUserData>>(`/users/${username}`);
    return response.data.data.user;
  },

  async updateMyProfile(data: UpdateProfilePayload): Promise<UserProfile> {
    const payload: UpdateProfilePayload = {};

    if (data.name !== undefined) {
      payload.name = data.name.trim();
    }
    if (data.bio !== undefined) {
      payload.bio = data.bio.trim();
    }
    if (data.avatar !== undefined) {
      payload.avatar = data.avatar.trim();
    }

    const response = await api.patch<BackendSuccess<BackendUserData>>('/users/me', payload);
    return response.data.data.user;
  },

  async searchUsers(
    query: string,
    page = 1,
    limit = 20,
  ): Promise<UserSearchResult> {
    const response = await api.get<BackendSuccess<BackendSearchData>>('/users/search', {
      params: {
        q: query.trim(),
        page,
        limit,
      },
    });

    return response.data.data;
  },

  async followUser(username: string): Promise<FollowResponse> {
    const response = await api.post<BackendSuccess<FollowResponse>>(`/users/${username}/follow`);
    return response.data.data;
  },

  async unfollowUser(username: string): Promise<FollowResponse> {
    const response = await api.delete<BackendSuccess<FollowResponse>>(`/users/${username}/follow`);
    return response.data.data;
  },

  async getFollowers(username: string, page = 1, limit = 20): Promise<UserListResult> {
    const response = await api.get<BackendSuccess<UserListResult>>(`/users/${username}/followers`, {
      params: { page, limit },
    });

    return response.data.data;
  },

  async getFollowing(username: string, page = 1, limit = 20): Promise<UserListResult> {
    const response = await api.get<BackendSuccess<UserListResult>>(`/users/${username}/following`, {
      params: { page, limit },
    });

    return response.data.data;
  },

  async getUserPosts(username: string, page = 1, limit = 10): Promise<UserPostsResult> {
    const response = await api.get<BackendSuccess<UserPostsResult>>(`/users/${username}/posts`, {
      params: { page, limit },
    });

    return response.data.data;
  },
};
