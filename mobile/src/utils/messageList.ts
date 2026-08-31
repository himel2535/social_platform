import { DisplayMessage } from '@/components/messages/MessageBubble';

export type ThreadItem =
  | { kind: 'date'; id: string; label: string }
  | { kind: 'message'; id: string; message: DisplayMessage; groupedWithPrevious: boolean };

function getDayKey(iso: string): string {
  const date = new Date(iso);
  return `${date.getFullYear()}-${date.getMonth()}-${date.getDate()}`;
}

function formatDateLabel(iso: string): string {
  const date = new Date(iso);
  const now = new Date();
  const today = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const target = new Date(date.getFullYear(), date.getMonth(), date.getDate());
  const diffDays = Math.round((today.getTime() - target.getTime()) / (1000 * 60 * 60 * 24));

  if (diffDays === 0) {
    return 'Today';
  }
  if (diffDays === 1) {
    return 'Yesterday';
  }

  return date.toLocaleDateString(undefined, {
    month: 'short',
    day: 'numeric',
    year: date.getFullYear() !== now.getFullYear() ? 'numeric' : undefined,
  });
}

export function buildThreadItems(messages: DisplayMessage[]): ThreadItem[] {
  if (messages.length === 0) {
    return [];
  }

  const items: ThreadItem[] = [];

  for (let i = messages.length - 1; i >= 0; i -= 1) {
    const message = messages[i];
    const newer = i < messages.length - 1 ? messages[i + 1] : null;
    const day = getDayKey(message.createdAt);

    const groupedWithPrevious =
      newer != null && newer.isOwn === message.isOwn && getDayKey(newer.createdAt) === day;

    items.push({
      kind: 'message',
      id: message._id,
      message,
      groupedWithPrevious,
    });

    const older = i > 0 ? messages[i - 1] : null;
    if (!older || getDayKey(older.createdAt) !== day) {
      items.push({
        kind: 'date',
        id: `date-${day}-${message._id}`,
        label: formatDateLabel(message.createdAt),
      });
    }
  }

  return items;
}
