import { Post } from '@/services/post.service';

type FeedPostCreatedListener = (post: Post) => void;
type CommentsCountListener = (postId: string, commentsCount: number) => void;

let feedPostCreatedListener: FeedPostCreatedListener | null = null;
let commentsCountListener: CommentsCountListener | null = null;

export function subscribeFeedPostCreated(callback: FeedPostCreatedListener): () => void {
  feedPostCreatedListener = callback;
  return () => {
    if (feedPostCreatedListener === callback) {
      feedPostCreatedListener = null;
    }
  };
}

export function notifyFeedPostCreated(post: Post): void {
  feedPostCreatedListener?.(post);
}

export function subscribePostCommentsCountUpdated(callback: CommentsCountListener): () => void {
  commentsCountListener = callback;
  return () => {
    if (commentsCountListener === callback) {
      commentsCountListener = null;
    }
  };
}

export function notifyPostCommentsCountUpdated(postId: string, commentsCount: number): void {
  commentsCountListener?.(postId, commentsCount);
}
