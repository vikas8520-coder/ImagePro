"use client";

import { useRef, useEffect, useState, useCallback } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Clock, ChevronDown, ChevronRight } from "lucide-react";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMediaStore } from "@/store/mediaStore";
import { MediaItem } from "@/types/media";
import { groupByTimeline, formatTimeRange, type TimelineDay } from "@/utils/timelineGrouping";
import TimelineScrubber from "./TimelineScrubber";
import MediaCard from "./MediaCard";
import MediaListRow from "./MediaListRow";
import SkeletonGrid from "./SkeletonGrid";

interface MediaGridProps {
  calendarDate?: string | null;
}

export default function MediaGrid({ calendarDate }: MediaGridProps) {
  const { getFilteredItems, selectedIds, viewMode, isImporting, reorderItems } =
    useMediaStore();
  const items = getFilteredItems();

  const [activeDay, setActiveDay] = useState<string | undefined>();
  const [collapsedEvents, setCollapsedEvents] = useState<Set<string>>(new Set());
  const dayRefs = useRef<Map<string, HTMLDivElement>>(new Map());

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderItems(active.id as string, over.id as string);
    }
  };

  // Filter by calendar date if set
  const filteredItems = calendarDate
    ? items.filter((i) => new Date(i.addedAt).toISOString().slice(0, 10) === calendarDate)
    : items;

  const timelineDays = groupByTimeline(filteredItems);

  // Track which day is visible via IntersectionObserver
  useEffect(() => {
    const observers: IntersectionObserver[] = [];
    dayRefs.current.forEach((el, date) => {
      const obs = new IntersectionObserver(
        ([entry]) => {
          if (entry.isIntersecting) setActiveDay(date);
        },
        { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
      );
      obs.observe(el);
      observers.push(obs);
    });
    return () => observers.forEach((o) => o.disconnect());
  }, [timelineDays.length]);

  const handleJumpToDay = useCallback((date: string) => {
    const el = dayRefs.current.get(date);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, []);

  const toggleEvent = useCallback((eventId: string) => {
    setCollapsedEvents((prev) => {
      const next = new Set(prev);
      if (next.has(eventId)) next.delete(eventId);
      else next.add(eventId);
      return next;
    });
  }, []);

  if (isImporting && items.length === 0) {
    return <SkeletonGrid />;
  }

  if (filteredItems.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" role="status">
        <p className="text-sm text-[var(--text-muted)]">
          {calendarDate ? "No media on this date" : "No media matches your filter"}
        </p>
        <p className="text-xs text-[var(--text-ghost)] mt-1">
          {calendarDate ? "Try selecting a different date" : "Try adjusting your filters or search query"}
        </p>
      </div>
    );
  }

  const allItemIds = filteredItems.map((i) => i.id);

  return (
    <div className="relative">
      <TimelineScrubber
        days={timelineDays}
        onJumpToDay={handleJumpToDay}
        activeDay={activeDay}
      />

      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext
          items={allItemIds}
          strategy={viewMode === "list" ? verticalListSortingStrategy : rectSortingStrategy}
        >
          <div className="space-y-6 pr-10">
            {timelineDays.map((day) => (
              <DaySection
                key={day.date}
                day={day}
                viewMode={viewMode}
                selectedIds={selectedIds}
                collapsedEvents={collapsedEvents}
                toggleEvent={toggleEvent}
                dayRefs={dayRefs}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    </div>
  );
}

interface DaySectionProps {
  day: TimelineDay;
  viewMode: string;
  selectedIds: Set<string>;
  collapsedEvents: Set<string>;
  toggleEvent: (id: string) => void;
  dayRefs: React.MutableRefObject<Map<string, HTMLDivElement>>;
}

function DaySection({ day, viewMode, selectedIds, collapsedEvents, toggleEvent, dayRefs }: DaySectionProps) {
  const setRef = (el: HTMLDivElement | null) => {
    if (el) dayRefs.current.set(day.date, el);
    else dayRefs.current.delete(day.date);
  };

  const hasMultipleEvents = day.events.length > 1;

  return (
    <div ref={setRef} className="scroll-mt-20">
      {/* Sticky day header */}
      <div
        className="sticky top-[52px] z-20 backdrop-blur-md py-2 px-3 -mx-3 mb-3 flex items-center gap-3"
        style={{
          background: "color-mix(in srgb, var(--bg-base) 85%, transparent)",
          borderBottom: "1px solid var(--glass-border)",
        }}
      >
        <span className="text-sm font-semibold text-[var(--text-strong)]">{day.label}</span>
        <span className="text-xs text-[var(--text-ghost)]">
          {day.count} {day.count === 1 ? "file" : "files"}
        </span>
        {hasMultipleEvents && (
          <span className="text-[10px] text-[var(--text-ghost)] ml-auto flex items-center gap-1">
            <Clock className="w-3 h-3" />
            {day.events.length} sessions
          </span>
        )}
      </div>

      {/* Events within the day */}
      {hasMultipleEvents ? (
        <div className="space-y-4">
          {day.events.map((event) => {
            const isCollapsed = collapsedEvents.has(event.id);
            return (
              <div key={event.id}>
                {/* Event header */}
                <button
                  onClick={() => toggleEvent(event.id)}
                  className="flex items-center gap-2 mb-2 px-1 group cursor-pointer"
                >
                  {isCollapsed ? (
                    <ChevronRight className="w-3.5 h-3.5 text-[var(--text-ghost)]" />
                  ) : (
                    <ChevronDown className="w-3.5 h-3.5 text-[var(--text-ghost)]" />
                  )}
                  <span className="text-xs font-medium text-[var(--text-muted)] group-hover:text-[var(--text-default)] transition-colors">
                    {event.label}
                  </span>
                  <span className="text-[10px] text-[var(--text-ghost)]">
                    {formatTimeRange(event.startTime, event.endTime)} · {event.items.length} files
                  </span>
                </button>

                {/* Event items */}
                <AnimatePresence>
                  {!isCollapsed && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <ItemsGrid
                        items={event.items}
                        viewMode={viewMode}
                        selectedIds={selectedIds}
                      />
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>
      ) : (
        <ItemsGrid
          items={day.items}
          viewMode={viewMode}
          selectedIds={selectedIds}
        />
      )}
    </div>
  );
}

interface ItemsGridProps {
  items: MediaItem[];
  viewMode: string;
  selectedIds: Set<string>;
}

function ItemsGrid({ items, viewMode, selectedIds }: ItemsGridProps) {
  if (viewMode === "list") {
    return (
      <div className="space-y-1">
        {items.map((item) => (
          <MediaListRow
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3">
      <AnimatePresence mode="popLayout">
        {items.map((item) => (
          <MediaCard
            key={item.id}
            item={item}
            isSelected={selectedIds.has(item.id)}
          />
        ))}
      </AnimatePresence>
    </div>
  );
}
