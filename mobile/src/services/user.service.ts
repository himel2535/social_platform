import api from './api';
import { Pagination } from './post.service';

export type UserProfile = {
  _id: string;
  name: string;
  username: string;
  email?: string;
  avatar?: string | null;
  bio?: string;
  createdAt?: string;
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
};
