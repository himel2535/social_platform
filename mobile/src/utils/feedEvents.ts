import { Post } from '@/services/post.service';

type FeedPostCreatedListener = (post: Post) => void;

let listener: FeedPostCreatedListener | null = null;

export function subscribeFeedPostCreated(callback: FeedPostCreatedListener): () => void {
  listener = callback;
  return () => {
    if (listener === callback) {
      listener = null;
    }
  };
}

export function notifyFeedPostCreated(post: Post): void {
  listener?.(post);
}
