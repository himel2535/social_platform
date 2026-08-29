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

export function clearPostCache(): void {
  cache.clear();
}
