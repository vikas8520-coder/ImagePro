import { MediaItem } from "@/types/media";

export interface TimelineEvent {
  id: string;
  label: string;
  startTime: number;
  endTime: number;
  items: MediaItem[];
}

export interface TimelineDay {
  date: string; // YYYY-MM-DD
  label: string; // "Today", "Yesterday", "Mon, Mar 3", etc.
  events: TimelineEvent[];
  items: MediaItem[];
  count: number;
}

const EVENT_GAP_MS = 2 * 60 * 60 * 1000; // 2 hours

function getTimeOfDayLabel(timestamp: number): string {
  const hour = new Date(timestamp).getHours();
  if (hour < 6) return "Early Morning";
  if (hour < 12) return "Morning";
  if (hour < 14) return "Midday";
  if (hour < 17) return "Afternoon";
  if (hour < 20) return "Evening";
  return "Night";
}

function formatDayLabel(dateStr: string): string {
  const date = new Date(dateStr + "T12:00:00");
  const now = new Date();
  const today = now.toISOString().slice(0, 10);
  const yesterday = new Date(now.getTime() - 86400000).toISOString().slice(0, 10);

  if (dateStr === today) return "Today";
  if (dateStr === yesterday) return "Yesterday";

  return date.toLocaleDateString("en-US", {
    weekday: "short",
    month: "short",
    day: "numeric",
    year: date.getFullYear() !== now.getFullYear() ? "numeric" : undefined,
  });
}

function clusterIntoEvents(items: MediaItem[]): TimelineEvent[] {
  if (items.length === 0) return [];

  const sorted = [...items].sort((a, b) => a.addedAt - b.addedAt);
  const events: TimelineEvent[] = [];
  let currentItems: MediaItem[] = [sorted[0]];

  for (let i = 1; i < sorted.length; i++) {
    const gap = sorted[i].addedAt - sorted[i - 1].addedAt;
    if (gap > EVENT_GAP_MS) {
      events.push(buildEvent(currentItems, events.length));
      currentItems = [sorted[i]];
    } else {
      currentItems.push(sorted[i]);
    }
  }
  events.push(buildEvent(currentItems, events.length));

  return events;
}

function buildEvent(items: MediaItem[], index: number): TimelineEvent {
  const startTime = items[0].addedAt;
  const endTime = items[items.length - 1].addedAt;
  const label = `${getTimeOfDayLabel(startTime)} Session`;

  return {
    id: `event-${startTime}-${index}`,
    label,
    startTime,
    endTime,
    items,
  };
}

export function groupByTimeline(items: MediaItem[]): TimelineDay[] {
  if (items.length === 0) return [];

  // Group by date
  const dayMap = new Map<string, MediaItem[]>();
  for (const item of items) {
    const dateStr = new Date(item.addedAt).toISOString().slice(0, 10);
    if (!dayMap.has(dateStr)) dayMap.set(dateStr, []);
    dayMap.get(dateStr)!.push(item);
  }

  // Sort days descending (newest first)
  const sortedDays = [...dayMap.entries()].sort(([a], [b]) => b.localeCompare(a));

  return sortedDays.map(([dateStr, dayItems]) => ({
    date: dateStr,
    label: formatDayLabel(dateStr),
    events: clusterIntoEvents(dayItems),
    items: dayItems,
    count: dayItems.length,
  }));
}

export function getDatesWithMedia(items: MediaItem[]): Set<string> {
  const dates = new Set<string>();
  for (const item of items) {
    dates.add(new Date(item.addedAt).toISOString().slice(0, 10));
  }
  return dates;
}

export function formatTimeRange(start: number, end: number): string {
  const fmt = (ts: number) =>
    new Date(ts).toLocaleTimeString("en-US", {
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    });
  if (start === end) return fmt(start);
  return `${fmt(start)} — ${fmt(end)}`;
}
