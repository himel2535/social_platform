import { Comment, CommentAuthor } from '@/services/comment.service';

export type BackendComment = {
  _id: string;
  content: string;
  author: {
    _id: string;
    name: string;
    username: string;
    avatar: string | null;
  };
  createdAt: string;
  updatedAt: string;
};

function mapAuthor(author: BackendComment['author']): CommentAuthor {
  return {
    _id: author._id,
    name: author.name,
    username: author.username,
    avatar: author.avatar || null,
  };
}

export function mapApiComment(raw: BackendComment): Comment {
  return {
    _id: raw._id,
    content: raw.content,
    author: mapAuthor(raw.author),
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
