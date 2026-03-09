"use client";

import { useState, useRef, useEffect } from "react";
import {
  Search,
  ArrowUpDown,
  LayoutGrid,
  List,
  CalendarDays,
} from "lucide-react";
import { useMediaStore } from "@/store/mediaStore";
import { SortField } from "@/types/media";
import { getDatesWithMedia } from "@/utils/timelineGrouping";
import CalendarPicker from "./CalendarPicker";

const sortOptions: { key: SortField; label: string }[] = [
  { key: "date", label: "Date" },
  { key: "name", label: "Name" },
  { key: "size", label: "Size" },
  { key: "type", label: "Type" },
];

interface FilterBarProps {
  calendarDate: string | null;
  onCalendarDateChange: (date: string | null) => void;
}

export default function FilterBar({ calendarDate, onCalendarDateChange }: FilterBarProps) {
  const {
    searchQuery,
    setSearchQuery,
    sortField,
    setSortField,
    sortDirection,
    toggleSortDirection,
    viewMode,
    setViewMode,
    items,
  } = useMediaStore();

  const [calendarOpen, setCalendarOpen] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);

  const datesWithMedia = getDatesWithMedia(items);

  // Close calendar on outside click
  useEffect(() => {
    if (!calendarOpen) return;
    const handler = (e: MouseEvent) => {
      if (calendarRef.current && !calendarRef.current.contains(e.target as Node)) {
        setCalendarOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, [calendarOpen]);

  return (
    <div className="flex items-center gap-3">
      {/* Search */}
      <div className="relative flex-1 max-w-sm">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-[var(--text-faint)]" />
        <input
          type="text"
          placeholder="Filter files..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="w-full pl-9 pr-3 py-2 rounded-xl text-sm
            text-[var(--text-default)] placeholder:text-[var(--text-ghost)]
            focus:outline-none focus:border-[var(--accent)] focus:ring-1 focus:ring-[var(--accent-muted)]
            transition-all glass-card-static"
          style={{ background: "var(--glass-bg)" }}
          aria-label="Filter files by name"
        />
      </div>

      {/* Calendar picker */}
      <div className="relative" ref={calendarRef}>
        <button
          onClick={() => setCalendarOpen(!calendarOpen)}
          className={`p-2 rounded-xl glass-card-static transition-all ${
            calendarDate
              ? "!border-[var(--accent)] text-[var(--accent)]"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          title="Filter by date"
          aria-label="Calendar filter"
        >
          <CalendarDays className="w-4 h-4" />
        </button>
        {calendarDate && (
          <span
            className="absolute -top-1 -right-1 w-2 h-2 rounded-full"
            style={{ background: "var(--accent)" }}
          />
        )}
        <CalendarPicker
          isOpen={calendarOpen}
          datesWithMedia={datesWithMedia}
          onSelectDate={(date) => {
            onCalendarDateChange(date);
            if (date) setCalendarOpen(false);
          }}
          selectedDate={calendarDate}
        />
      </div>

      {/* Sort */}
      <div className="flex items-center gap-1.5">
        <select
          value={sortField}
          onChange={(e) => setSortField(e.target.value as SortField)}
          className="glass-card-static px-2.5 py-2 text-xs
            text-[var(--text-muted)] focus:outline-none cursor-pointer"
          style={{ background: "var(--glass-bg)" }}
          aria-label="Sort by"
        >
          {sortOptions.map(({ key, label }) => (
            <option key={key} value={key}>
              {label}
            </option>
          ))}
        </select>
        <button
          onClick={toggleSortDirection}
          className="p-2 rounded-xl glass-card-static
            text-[var(--text-muted)] hover:text-[var(--text-secondary)] transition-colors"
          title={sortDirection === "asc" ? "Ascending" : "Descending"}
          aria-label={`Sort ${sortDirection === "asc" ? "ascending" : "descending"}`}
        >
          <ArrowUpDown
            className={`w-4 h-4 transition-transform ${
              sortDirection === "desc" ? "rotate-180" : ""
            }`}
          />
        </button>
      </div>

      {/* View toggle */}
      <div className="flex items-center glass-card-static overflow-hidden p-0.5">
        <button
          onClick={() => setViewMode("grid")}
          className={`p-2 rounded-[10px] transition-all ${
            viewMode === "grid"
              ? "bg-[var(--accent)] text-black"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          aria-label="Grid view"
          aria-pressed={viewMode === "grid"}
        >
          <LayoutGrid className="w-4 h-4" />
        </button>
        <button
          onClick={() => setViewMode("list")}
          className={`p-2 rounded-[10px] transition-all ${
            viewMode === "list"
              ? "bg-[var(--accent)] text-black"
              : "text-[var(--text-muted)] hover:text-[var(--text-secondary)]"
          }`}
          aria-label="List view"
          aria-pressed={viewMode === "list"}
        >
          <List className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
