import { Post } from '@/services/post.service';
import { Comment } from '@/services/comment.service';
import { UserProfile } from '@/services/user.service';

export type PreviewNotification = {
  id: string;
  title: string;
  body: string;
  timestamp: string;
  read?: boolean;
};

const hoursAgo = (hours: number) => new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
const daysAgo = (days: number) => new Date(Date.now() - days * 24 * 60 * 60 * 1000).toISOString();

export const PREVIEW_POSTS: Post[] = [
  {
    _id: 'preview-1',
    content:
      'Welcome to Nexus Social! This is a preview post so you can inspect the feed UI before backend integration.',
    author: {
      _id: 'user-1',
      name: 'Nexus Team',
      username: 'nexus',
    },
    likesCount: 12,
    commentsCount: 3,
    likedByMe: false,
    createdAt: hoursAgo(2),
  },
  {
    _id: 'preview-2',
    content:
      'Just shipped a new feature! Excited to hear what everyone thinks about the glassmorphism design system.',
    author: {
      _id: 'user-2',
      name: 'Alex Chen',
      username: 'alexchen',
    },
    likesCount: 48,
    commentsCount: 1,
    likedByMe: true,
    createdAt: hoursAgo(5),
  },
  {
    _id: 'preview-3',
    content:
      'Beautiful sunset today. Sometimes the best posts are the simplest ones. What are you grateful for this week?',
    author: {
      _id: 'user-3',
      name: 'Sam Rivera',
      username: 'samrivera',
    },
    likesCount: 7,
    commentsCount: 0,
    likedByMe: false,
    createdAt: daysAgo(1),
  },
];

const PREVIEW_COMMENTS_BY_POST: Record<string, Comment[]> = {
  'preview-1': [
    {
      _id: 'comment-1',
      content: 'Looks great! Can\'t wait for the real feed to go live.',
      author: {
        _id: 'user-2',
        name: 'Alex Chen',
        username: 'alexchen',
      },
      createdAt: hoursAgo(1),
    },
    {
      _id: 'comment-2',
      content: 'The UI polish is really coming together. Nice work!',
      author: {
        _id: 'user-3',
        name: 'Sam Rivera',
        username: 'samrivera',
      },
      createdAt: hoursAgo(0.5),
    },
    {
      _id: 'comment-3',
      content: 'Preview mode is super helpful for testing navigation.',
      author: {
        _id: 'user-4',
        name: 'Jordan Lee',
        username: 'jordanlee',
      },
      createdAt: hoursAgo(0.25),
    },
  ],
  'preview-2': [
    {
      _id: 'comment-4',
      content: 'Love the glass effect on the cards!',
      author: {
        _id: 'user-1',
        name: 'Nexus Team',
        username: 'nexus',
      },
      createdAt: hoursAgo(3),
    },
  ],
};

export const PREVIEW_NOTIFICATIONS: PreviewNotification[] = [
  {
    id: 'notif-1',
    title: 'Alex Chen',
    body: 'liked your post',
    timestamp: hoursAgo(1),
    read: false,
  },
  {
    id: 'notif-2',
    title: 'Sam Rivera',
    body: 'commented on your post: "The UI polish is really coming together."',
    timestamp: hoursAgo(3),
    read: false,
  },
  {
    id: 'notif-3',
    title: 'Jordan Lee',
    body: 'started following you',
    timestamp: daysAgo(1),
    read: true,
  },
  {
    id: 'notif-4',
    title: 'Nexus Team',
    body: 'Welcome to Nexus Social! Start by creating your first post.',
    timestamp: daysAgo(2),
    read: true,
  },
];

export function getPreviewPost(id: string): Post | undefined {
  return PREVIEW_POSTS.find((post) => post._id === id);
}

export function getPreviewComments(postId: string): Comment[] {
  return PREVIEW_COMMENTS_BY_POST[postId] ?? [];
}

export const PREVIEW_USERS: Record<string, UserProfile> = {
  nexus: {
    _id: 'user-1',
    name: 'Nexus Team',
    username: 'nexus',
    bio: 'Building the future of social connection.',
    createdAt: daysAgo(365),
    followersCount: 2,
    followingCount: 0,
  },
  alexchen: {
    _id: 'user-2',
    name: 'Alex Chen',
    username: 'alexchen',
    bio: 'Designer & developer. Love glassmorphism.',
    createdAt: daysAgo(180),
    followersCount: 1,
    followingCount: 1,
  },
  samrivera: {
    _id: 'user-3',
    name: 'Sam Rivera',
    username: 'samrivera',
    bio: 'Photographer. Chasing light and good vibes.',
    createdAt: daysAgo(90),
    followersCount: 0,
    followingCount: 1,
  },
  jordanlee: {
    _id: 'user-4',
    name: 'Jordan Lee',
    username: 'jordanlee',
    bio: 'QA engineer. Preview mode enthusiast.',
    createdAt: daysAgo(60),
    followersCount: 0,
    followingCount: 0,
  },
};

const followKey = (follower: string, following: string) =>
  `${follower.toLowerCase()}:${following.toLowerCase()}`;

const PREVIEW_FOLLOWS = new Set<string>([
  followKey('alexchen', 'nexus'),
  followKey('samrivera', 'nexus'),
  followKey('nexus', 'alexchen'),
]);

function recomputePreviewCounts() {
  for (const user of Object.values(PREVIEW_USERS)) {
    user.followersCount = 0;
    user.followingCount = 0;
  }

  for (const key of PREVIEW_FOLLOWS) {
    const [follower, following] = key.split(':');
    const followerUser = PREVIEW_USERS[follower];
    const followingUser = PREVIEW_USERS[following];

    if (followerUser) {
      followerUser.followingCount = (followerUser.followingCount ?? 0) + 1;
    }
    if (followingUser) {
      followingUser.followersCount = (followingUser.followersCount ?? 0) + 1;
    }
  }
}

recomputePreviewCounts();

export function getPreviewFollowState(viewerUsername: string, targetUsername: string): boolean {
  return PREVIEW_FOLLOWS.has(followKey(viewerUsername, targetUsername));
}

export function getPreviewUser(username: string, viewerUsername = 'nexus'): UserProfile | undefined {
  const user = PREVIEW_USERS[username.toLowerCase()];
  if (!user) {
    return undefined;
  }

  return {
    ...user,
    following:
      user.username !== viewerUsername &&
      getPreviewFollowState(viewerUsername, user.username),
  };
}

export function togglePreviewFollow(
  viewerUsername: string,
  targetUsername: string,
): UserProfile | undefined {
  if (viewerUsername.toLowerCase() === targetUsername.toLowerCase()) {
    return getPreviewUser(targetUsername, viewerUsername);
  }

  const key = followKey(viewerUsername, targetUsername);

  if (PREVIEW_FOLLOWS.has(key)) {
    PREVIEW_FOLLOWS.delete(key);
  } else {
    PREVIEW_FOLLOWS.add(key);
  }

  recomputePreviewCounts();
  return getPreviewUser(targetUsername, viewerUsername);
}

export function getPreviewFollowers(username: string): UserProfile[] {
  const normalized = username.toLowerCase();

  return Object.values(PREVIEW_USERS).filter((user) =>
    PREVIEW_FOLLOWS.has(followKey(user.username, normalized)),
  );
}

export function getPreviewFollowing(username: string): UserProfile[] {
  const normalized = username.toLowerCase();

  return Object.values(PREVIEW_USERS).filter((user) =>
    PREVIEW_FOLLOWS.has(followKey(normalized, user.username)),
  );
}

export function searchPreviewUsers(query: string): UserProfile[] {
  const normalized = query.trim().toLowerCase();
  if (!normalized) {
    return [];
  }

  return Object.values(PREVIEW_USERS).filter(
    (user) =>
      user.username.toLowerCase().includes(normalized) ||
      user.name.toLowerCase().includes(normalized),
  );
}
