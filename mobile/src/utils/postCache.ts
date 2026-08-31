import { Dispatch, SetStateAction } from 'react';
import { Post } from '@/services/post.service';

const cache = new Map<string, Post>();

export function cachePost(post: Post): void {
  cache.set(post._id, post);
}

export function cachePosts(posts: Post[]): void {
  posts.forEach(cachePost);
}

export function getCachedPost(id: string): Post | undefined {
  return cache.get(id);
}

export function updateCachedPostLike(
  postId: string,
  likedByMe: boolean,
  likesCount: number,
): void {
  const cached = cache.get(postId);
  if (cached) {
    cache.set(postId, { ...cached, likedByMe, likesCount });
  }
}

export function updateCachedPostCommentsCount(postId: string, commentsCount: number): void {
  const cached = cache.get(postId);
  if (cached) {
    cache.set(postId, { ...cached, commentsCount });
  }
}

export function syncPostsFromCache(setPosts: Dispatch<SetStateAction<Post[]>>): void {
  setPosts((current) => {
    let changed = false;

    const next = current.map((post) => {
      const cached = cache.get(post._id);
      if (!cached) {
        return post;
      }

      if (
        cached.commentsCount === post.commentsCount &&
        cached.likedByMe === post.likedByMe &&
        cached.likesCount === post.likesCount
      ) {
        return post;
      }

      changed = true;
      return {
        ...post,
        commentsCount: cached.commentsCount,
        likedByMe: cached.likedByMe,
        likesCount: cached.likesCount,
      };
    });

    return changed ? next : current;
  });
}

export function clearPostCache(): void {
  cache.clear();
}

export function removeCachedPost(postId: string): void {
  cache.delete(postId);
}
