import { Post } from '@/services/post.service';

type FeedPostCreatedListener = (post: Post) => void;
type CommentsCountListener = (postId: string, commentsCount: number) => void;
type FeedPostDeletedListener = (postId: string) => void;

const feedPostCreatedListeners = new Set<FeedPostCreatedListener>();
const commentsCountListeners = new Set<CommentsCountListener>();
const postDeletedListeners = new Set<FeedPostDeletedListener>();

export function subscribeFeedPostCreated(callback: FeedPostCreatedListener): () => void {
  feedPostCreatedListeners.add(callback);
  return () => {
    feedPostCreatedListeners.delete(callback);
  };
}

export function notifyFeedPostCreated(post: Post): void {
  feedPostCreatedListeners.forEach((callback) => callback(post));
}

export function subscribePostCommentsCountUpdated(callback: CommentsCountListener): () => void {
  commentsCountListeners.add(callback);
  return () => {
    commentsCountListeners.delete(callback);
  };
}

export function notifyPostCommentsCountUpdated(postId: string, commentsCount: number): void {
  commentsCountListeners.forEach((callback) => callback(postId, commentsCount));
}

export function subscribePostDeleted(callback: FeedPostDeletedListener): () => void {
  postDeletedListeners.add(callback);
  return () => {
    postDeletedListeners.delete(callback);
  };
}

export function notifyPostDeleted(postId: string): void {
  postDeletedListeners.forEach((callback) => callback(postId));
}
