import { useCallback, useRef } from 'react';
import { Dispatch, SetStateAction } from 'react';
import { UserProfile, userService } from '@/services/user.service';
import { ApiError } from '@/services/api';
import { normalizeApiError } from '@/utils/normalizeApiError';
import { useToast } from '@/components/ui';

function applyFollowUpdate(
  profile: UserProfile,
  following: boolean,
  followersCount: number,
  followingCount?: number,
): UserProfile {
  return {
    ...profile,
    following,
    followersCount,
    followingCount: followingCount ?? profile.followingCount,
  };
}

export function useToggleFollow() {
  const inFlightRef = useRef(new Set<string>());
  const { showToast } = useToast();

  const toggleFollow = useCallback(
    async (
      profile: UserProfile,
      setProfile: Dispatch<SetStateAction<UserProfile | null>>,
      apiCall: () => Promise<{ following: boolean; followersCount: number; followingCount: number }>,
    ) => {
      if (inFlightRef.current.has(profile.username)) {
        return;
      }

      const previous = {
        following: profile.following ?? false,
        followersCount: profile.followersCount ?? 0,
        followingCount: profile.followingCount ?? 0,
      };

      const optimisticFollowing = !previous.following;
      const optimisticFollowersCount = optimisticFollowing
        ? previous.followersCount + 1
        : Math.max(0, previous.followersCount - 1);

      inFlightRef.current.add(profile.username);
      setProfile((current) =>
        current
          ? applyFollowUpdate(current, optimisticFollowing, optimisticFollowersCount)
          : current,
      );

      try {
        const result = await apiCall();
        setProfile((current) =>
          current
            ? applyFollowUpdate(
                current,
                result.following,
                result.followersCount,
                result.followingCount,
              )
            : current,
        );
      } catch (err) {
        setProfile((current) =>
          current
            ? applyFollowUpdate(
                current,
                previous.following,
                previous.followersCount,
                previous.followingCount,
              )
            : current,
        );
        showToast(normalizeApiError(err as ApiError, 'general'), 'error');
      } finally {
        inFlightRef.current.delete(profile.username);
      }
    },
    [showToast],
  );

  const followUser = useCallback(
    (profile: UserProfile, setProfile: Dispatch<SetStateAction<UserProfile | null>>) => {
      const apiCall = profile.following
        ? () => userService.unfollowUser(profile.username)
        : () => userService.followUser(profile.username);

      return toggleFollow(profile, setProfile, apiCall);
    },
    [toggleFollow],
  );

  return { followUser, toggleFollow };
}
