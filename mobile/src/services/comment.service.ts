import { User } from './auth.service';

export type Comment = {
  _id: string;
  content: string;
  author: User;
  createdAt: string;
};

export type CommentsResponse = {
  comments: Comment[];
  page: number;
  totalPages: number;
  total: number;
};

export const commentService = {
  async getComments(_postId: string, _page = 1): Promise<CommentsResponse> {
    return { comments: [], page: 1, totalPages: 0, total: 0 };
  },

  async addComment(_postId: string, _content: string): Promise<Comment> {
    throw new Error('Not implemented — Phase 9');
  },
};
