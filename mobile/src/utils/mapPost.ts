import { Post, PostAuthor } from '@/services/post.service';

export type BackendPost = {
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

function mapAuthor(author: BackendPost['author']): PostAuthor {
  return {
    _id: author._id,
    name: author.name,
    username: author.username,
    avatar: author.avatar || null,
  };
}

export function mapApiPost(raw: BackendPost): Post {
  return {
    _id: raw._id,
    content: raw.content,
    author: mapAuthor(raw.author),
    likesCount: 0,
    commentsCount: 0,
    isLiked: false,
    createdAt: raw.createdAt,
    updatedAt: raw.updatedAt,
  };
}
