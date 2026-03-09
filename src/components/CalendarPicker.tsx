"use client";

import { useState, useMemo } from "react";
import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";

interface CalendarPickerProps {
  isOpen: boolean;
  onClose: () => void;
  datesWithMedia: Set<string>;
  onSelectDate: (date: string | null) => void;
  selectedDate: string | null;
}

const WEEKDAYS = ["Su", "Mo", "Tu", "We", "Th", "Fr", "Sa"];

export default function CalendarPicker({
  isOpen,
  onClose,
  datesWithMedia,
  onSelectDate,
  selectedDate,
}: CalendarPickerProps) {
  const [viewDate, setViewDate] = useState(() => new Date());

  const year = viewDate.getFullYear();
  const month = viewDate.getMonth();

  const calendarDays = useMemo(() => {
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (number | null)[] = [];

    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(d);

    return days;
  }, [year, month]);

  const monthLabel = viewDate.toLocaleDateString("en-US", {
    month: "long",
    year: "numeric",
  });

  const prevMonth = () => setViewDate(new Date(year, month - 1, 1));
  const nextMonth = () => setViewDate(new Date(year, month + 1, 1));

  const getDateStr = (day: number) => {
    const m = String(month + 1).padStart(2, "0");
    const d = String(day).padStart(2, "0");
    return `${year}-${m}-${d}`;
  };

  const mediaCount = useMemo(() => {
    let count = 0;
    for (const dateStr of datesWithMedia) {
      if (dateStr.startsWith(`${year}-${String(month + 1).padStart(2, "0")}`)) {
        count++;
      }
    }
    return count;
  }, [datesWithMedia, year, month]);

  return (
    <AnimatePresence>
      {isOpen && (
        <motion.div
          initial={{ opacity: 0, y: -8, scale: 0.95 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: -8, scale: 0.95 }}
          transition={{ duration: 0.15 }}
          className="absolute right-0 top-full mt-2 z-50 glass-surface p-4 w-[280px]"
          style={{
            background: "var(--panel-bg)",
            borderRadius: "var(--glass-radius)",
            border: "1px solid var(--glass-border)",
          }}
        >
          {/* Month nav */}
          <div className="flex items-center justify-between mb-3">
            <button
              onClick={prevMonth}
              className="p-1 rounded-lg hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] transition-colors"
            >
              <ChevronLeft className="w-4 h-4" />
            </button>
            <span className="text-sm font-semibold text-[var(--text-default)]">
              {monthLabel}
            </span>
            <button
              onClick={nextMonth}
              className="p-1 rounded-lg hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] transition-colors"
            >
              <ChevronRight className="w-4 h-4" />
            </button>
          </div>

          {/* Weekday headers */}
          <div className="grid grid-cols-7 gap-0.5 mb-1">
            {WEEKDAYS.map((wd) => (
              <div key={wd} className="text-center text-[10px] text-[var(--text-ghost)] font-medium py-1">
                {wd}
              </div>
            ))}
          </div>

          {/* Calendar grid */}
          <div className="grid grid-cols-7 gap-0.5">
            {calendarDays.map((day, i) => {
              if (day === null) {
                return <div key={`empty-${i}`} className="h-8" />;
              }

              const dateStr = getDateStr(day);
              const hasMedia = datesWithMedia.has(dateStr);
              const isSelected = selectedDate === dateStr;
              const isToday = dateStr === new Date().toISOString().slice(0, 10);

              return (
                <button
                  key={dateStr}
                  onClick={() => {
                    if (isSelected) {
                      onSelectDate(null);
                    } else if (hasMedia) {
                      onSelectDate(dateStr);
                    }
                  }}
                  disabled={!hasMedia && !isSelected}
                  className={`
                    h-8 rounded-lg text-xs font-medium relative transition-all
                    ${isSelected
                      ? "bg-[var(--accent)] text-black"
                      : hasMedia
                      ? "text-[var(--text-default)] hover:bg-[var(--glass-bg-hover)] cursor-pointer"
                      : "text-[var(--text-ghost)] cursor-default opacity-40"
                    }
                    ${isToday && !isSelected ? "ring-1 ring-[var(--accent)]" : ""}
                  `}
                >
                  {day}
                  {hasMedia && !isSelected && (
                    <span
                      className="absolute bottom-0.5 left-1/2 -translate-x-1/2 w-1 h-1 rounded-full"
                      style={{ background: "var(--accent)" }}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Footer */}
          <div className="mt-3 flex items-center justify-between">
            <span className="text-[10px] text-[var(--text-ghost)]">
              {mediaCount} days with media this month
            </span>
            {selectedDate && (
              <button
                onClick={() => onSelectDate(null)}
                className="flex items-center gap-1 text-[10px] text-[var(--accent)] hover:underline"
              >
                <X className="w-3 h-3" />
                Clear filter
              </button>
            )}
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
