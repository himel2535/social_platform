import { UserProfile } from '@/services/user.service';
import { UserPostsResult } from '@/services/user.service';

type ProfileCacheEntry = {
  profile: UserProfile;
  fetchedAt: number;
};

type PostsCacheEntry = {
  data: UserPostsResult;
  fetchedAt: number;
};

export type ProfileUpdateEvent = {
  profile?: UserProfile;
  reloadPosts?: boolean;
};

type ProfileUpdateListener = (update: ProfileUpdateEvent) => void;

const PROFILE_TTL_MS = 60_000;
const POSTS_TTL_MS = 60_000;

const profileCache = new Map<string, ProfileCacheEntry>();
const postsCache = new Map<string, PostsCacheEntry>();
const updateListeners = new Map<string, Set<ProfileUpdateListener>>();

function notifyListeners(username: string, update: ProfileUpdateEvent) {
  const listeners = updateListeners.get(username);
  if (!listeners) {
    return;
  }

  listeners.forEach((callback) => callback(update));
}

export function subscribeProfileUpdates(
  username: string,
  callback: ProfileUpdateListener,
): () => void {
  let listeners = updateListeners.get(username);
  if (!listeners) {
    listeners = new Set();
    updateListeners.set(username, listeners);
  }

  listeners.add(callback);

  return () => {
    listeners?.delete(callback);
    if (listeners?.size === 0) {
      updateListeners.delete(username);
    }
  };
}

export function getCachedProfile(username: string): UserProfile | null {
  const entry = profileCache.get(username);
  if (!entry) {
    return null;
  }

  if (Date.now() - entry.fetchedAt > PROFILE_TTL_MS) {
    profileCache.delete(username);
    return null;
  }

  return entry.profile;
}

export function setCachedProfile(username: string, profile: UserProfile) {
  profileCache.set(username, { profile, fetchedAt: Date.now() });
}

export function updateProfileCache(username: string, profile: UserProfile) {
  setCachedProfile(username, profile);
  notifyListeners(username, { profile });
}

export function getCachedUserPosts(username: string): UserPostsResult | null {
  const entry = postsCache.get(username);
  if (!entry) {
    return null;
  }

  if (Date.now() - entry.fetchedAt > POSTS_TTL_MS) {
    postsCache.delete(username);
    return null;
  }

  return entry.data;
}

export function setCachedUserPosts(username: string, data: UserPostsResult) {
  postsCache.set(username, { data, fetchedAt: Date.now() });
}

export function invalidateUserPostsCache(username: string) {
  postsCache.delete(username);
  notifyListeners(username, { reloadPosts: true });
}

export function invalidateProfileCache(username?: string) {
  if (username) {
    profileCache.delete(username);
    postsCache.delete(username);
    notifyListeners(username, { reloadPosts: true });
    return;
  }

  profileCache.clear();
  postsCache.clear();
}
