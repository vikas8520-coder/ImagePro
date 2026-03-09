"use client";

import { useState, useCallback } from "react";
import { TimelineDay } from "@/utils/timelineGrouping";

interface TimelineScrubberProps {
  days: TimelineDay[];
  onJumpToDay: (date: string) => void;
  activeDay?: string;
}

export default function TimelineScrubber({ days, onJumpToDay, activeDay }: TimelineScrubberProps) {
  const [hoveredDay, setHoveredDay] = useState<string | null>(null);

  const handleClick = useCallback(
    (date: string) => {
      onJumpToDay(date);
    },
    [onJumpToDay]
  );

  if (days.length <= 1) return null;

  const maxCount = Math.max(...days.map((d) => d.count));

  return (
    <div
      className="fixed right-3 top-1/2 -translate-y-1/2 z-30 flex flex-col items-end gap-0.5"
      aria-label="Timeline scrubber"
      role="navigation"
    >
      {days.map((day) => {
        const isActive = activeDay === day.date;
        const isHovered = hoveredDay === day.date;
        const barWidth = Math.max(8, (day.count / maxCount) * 32);

        return (
          <div
            key={day.date}
            className="relative flex items-center cursor-pointer group"
            onClick={() => handleClick(day.date)}
            onMouseEnter={() => setHoveredDay(day.date)}
            onMouseLeave={() => setHoveredDay(null)}
          >
            {/* Tooltip */}
            {(isHovered || isActive) && (
              <div
                className="absolute right-full mr-2 whitespace-nowrap px-2 py-1 rounded-lg text-[10px] font-medium pointer-events-none"
                style={{
                  background: "var(--panel-bg)",
                  border: "1px solid var(--glass-border)",
                  color: isActive ? "var(--accent)" : "var(--text-default)",
                }}
              >
                {day.label} · {day.count} files
              </div>
            )}

            {/* Bar */}
            <div
              className="h-2 rounded-full transition-all duration-200"
              style={{
                width: `${barWidth}px`,
                background: isActive
                  ? "var(--accent)"
                  : isHovered
                  ? "var(--text-muted)"
                  : "var(--text-ghost)",
                opacity: isActive ? 1 : isHovered ? 0.8 : 0.4,
              }}
            />
          </div>
        );
      })}
    </div>
  );
}
