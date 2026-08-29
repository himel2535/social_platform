import { useCallback, useRef } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { Post, postService } from '@/services/post.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { updateCachedPostLike } from '@/utils/postCache';
import { useToast } from '@/components/ui';

type SetPosts = Dispatch<SetStateAction<Post[]>>;

function applyLikeUpdate(post: Post, likedByMe: boolean, likesCount: number): Post {
  return { ...post, likedByMe, likesCount };
}

export function useToggleLike() {
  const inFlightRef = useRef(new Set<string>());
  const { showToast } = useToast();

  const updatePostsState = useCallback(
    (postId: string, likedByMe: boolean, likesCount: number, setPosts?: SetPosts) => {
      updateCachedPostLike(postId, likedByMe, likesCount);
      setPosts?.((current) =>
        current.map((post) =>
          post._id === postId ? applyLikeUpdate(post, likedByMe, likesCount) : post,
        ),
      );
    },
    [],
  );

  const toggleLike = useCallback(
    async (post: Post, setPosts?: SetPosts, onUpdate?: (updated: Post) => void) => {
      if (inFlightRef.current.has(post._id)) {
        return;
      }

      const previous = { likedByMe: post.likedByMe, likesCount: post.likesCount };
      const optimisticLiked = !post.likedByMe;
      const optimisticCount = optimisticLiked
        ? post.likesCount + 1
        : Math.max(0, post.likesCount - 1);

      inFlightRef.current.add(post._id);
      updatePostsState(post._id, optimisticLiked, optimisticCount, setPosts);
      onUpdate?.(applyLikeUpdate(post, optimisticLiked, optimisticCount));

      try {
        const result = post.likedByMe
          ? await postService.unlikePost(post._id)
          : await postService.likePost(post._id);

        updatePostsState(post._id, result.liked, result.likesCount, setPosts);
        onUpdate?.(applyLikeUpdate(post, result.liked, result.likesCount));
      } catch (err) {
        updatePostsState(post._id, previous.likedByMe, previous.likesCount, setPosts);
        onUpdate?.(applyLikeUpdate(post, previous.likedByMe, previous.likesCount));
        showToast(normalizeApiError(err as ApiError, 'general'), 'error');
      } finally {
        inFlightRef.current.delete(post._id);
      }
    },
    [showToast, updatePostsState],
  );

  return { toggleLike };
}
