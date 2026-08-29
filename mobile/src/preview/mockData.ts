import { Post } from '@/services/post.service';
import { Comment } from '@/services/comment.service';

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
    isLiked: false,
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
    isLiked: true,
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
    isLiked: false,
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
        email: 'alex@example.com',
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
        email: 'sam@example.com',
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
        email: 'jordan@example.com',
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
        email: 'team@nexus.social',
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
