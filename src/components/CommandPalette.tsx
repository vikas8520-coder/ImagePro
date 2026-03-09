"use client";

import { useEffect, useState, useCallback } from "react";
import { Command } from "cmdk";
import { AnimatePresence, motion } from "framer-motion";
import {
  Search,
  Image as ImageIcon,
  Video,
  CheckCircle,
  Layers,
  RectangleVertical,
  RectangleHorizontal,
  Square,
  Download,
  Trash2,
  LayoutGrid,
  List,
} from "lucide-react";
import { useMediaStore } from "@/store/mediaStore";
import { FilterTab } from "@/types/media";

export default function CommandPalette() {
  const [open, setOpen] = useState(false);
  const {
    setFilter,
    setViewMode,
    getReadyItems,
    items,
    clearAll,
    getStats,
  } = useMediaStore();

  // ⌘K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  const stats = getStats();

  const runAction = useCallback(
    (action: () => void) => {
      action();
      setOpen(false);
    },
    []
  );

  const handleExport = () => {
    const readyItems = getReadyItems();
    if (readyItems.length === 0) return;
    const exportData = readyItems.map((item) => ({
      filename: item.name,
      type: item.type,
      orientation: item.orientation,
      dimensions: `${item.width}x${item.height}`,
      postType: item.postType || "unset",
      cropRatio: item.cropRatio || "original",
      caption: item.caption || "",
      hashtags: item.hashtags || "",
    }));
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: "application/json",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imagepro-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <AnimatePresence>
      {open && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[100] bg-black/50 backdrop-blur-sm"
            onClick={() => setOpen(false)}
          />

          {/* Palette */}
          <motion.div
            initial={{ opacity: 0, scale: 0.96, y: -10 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.96, y: -10 }}
            transition={{ duration: 0.15 }}
            className="fixed top-[20%] left-1/2 -translate-x-1/2 z-[101] w-full max-w-lg"
          >
            <Command
              className="glass-card-static overflow-hidden"
              style={{ background: "var(--panel-bg)" }}
              label="Command palette"
            >
              {/* Input */}
              <div className="flex items-center gap-3 px-4 border-b border-[var(--glass-border)]">
                <Search className="w-4 h-4 text-[var(--text-faint)] flex-shrink-0" />
                <Command.Input
                  placeholder="Type a command or search..."
                  className="w-full py-3.5 bg-transparent text-sm text-[var(--text-default)]
                    placeholder:text-[var(--text-ghost)] focus:outline-none"
                />
                <kbd className="text-[10px] text-[var(--text-ghost)] bg-[var(--kbd-bg)] px-1.5 py-0.5 rounded font-mono flex-shrink-0">
                  ESC
                </kbd>
              </div>

              <Command.List className="max-h-80 overflow-y-auto p-2">
                <Command.Empty className="py-8 text-center text-sm text-[var(--text-muted)]">
                  No results found.
                </Command.Empty>

                {/* Navigation */}
                <Command.Group
                  heading="Navigate"
                  className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase
                    [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[var(--text-ghost)]
                    [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5"
                >
                  {[
                    { filter: "all" as FilterTab, label: "All Media", icon: Layers, count: stats.total },
                    { filter: "photos" as FilterTab, label: "Photos", icon: ImageIcon, count: stats.photos },
                    { filter: "videos" as FilterTab, label: "Videos", icon: Video, count: stats.videos },
                    { filter: "portrait" as FilterTab, label: "Portrait", icon: RectangleVertical, count: null },
                    { filter: "landscape" as FilterTab, label: "Landscape", icon: RectangleHorizontal, count: null },
                    { filter: "square" as FilterTab, label: "Square", icon: Square, count: null },
                    { filter: "ready" as FilterTab, label: "Ready to Post", icon: CheckCircle, count: stats.ready },
                  ].map(({ filter, label, icon: Icon, count }) => (
                    <Command.Item
                      key={filter}
                      value={`go ${label}`}
                      onSelect={() => runAction(() => setFilter(filter))}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer
                        text-[var(--text-secondary)] data-[selected=true]:bg-[var(--accent-muted)]
                        data-[selected=true]:text-[var(--accent)]"
                    >
                      <Icon className="w-4 h-4" />
                      {label}
                      {count !== null && count > 0 && (
                        <span className="ml-auto text-[10px] text-[var(--text-faint)]">
                          {count}
                        </span>
                      )}
                    </Command.Item>
                  ))}
                </Command.Group>

                {/* Actions */}
                <Command.Group
                  heading="Actions"
                  className="[&_[cmdk-group-heading]]:text-[10px] [&_[cmdk-group-heading]]:uppercase
                    [&_[cmdk-group-heading]]:tracking-widest [&_[cmdk-group-heading]]:text-[var(--text-ghost)]
                    [&_[cmdk-group-heading]]:px-2 [&_[cmdk-group-heading]]:py-1.5 mt-2"
                >
                  <Command.Item
                    value="export ready posts"
                    onSelect={() => runAction(handleExport)}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer
                      text-[var(--text-secondary)] data-[selected=true]:bg-[var(--accent-muted)]
                      data-[selected=true]:text-[var(--accent)]"
                  >
                    <Download className="w-4 h-4" />
                    Export Ready Posts
                    {stats.ready > 0 && (
                      <span className="ml-auto text-[10px] text-[var(--success)]">
                        {stats.ready} ready
                      </span>
                    )}
                  </Command.Item>
                  <Command.Item
                    value="grid view"
                    onSelect={() => runAction(() => setViewMode("grid"))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer
                      text-[var(--text-secondary)] data-[selected=true]:bg-[var(--accent-muted)]
                      data-[selected=true]:text-[var(--accent)]"
                  >
                    <LayoutGrid className="w-4 h-4" />
                    Switch to Grid View
                  </Command.Item>
                  <Command.Item
                    value="list view"
                    onSelect={() => runAction(() => setViewMode("list"))}
                    className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer
                      text-[var(--text-secondary)] data-[selected=true]:bg-[var(--accent-muted)]
                      data-[selected=true]:text-[var(--accent)]"
                  >
                    <List className="w-4 h-4" />
                    Switch to List View
                  </Command.Item>
                  {items.length > 0 && (
                    <Command.Item
                      value="clear all media"
                      onSelect={() => runAction(clearAll)}
                      className="flex items-center gap-3 px-3 py-2 rounded-lg text-sm cursor-pointer
                        text-[var(--error)] data-[selected=true]:bg-[var(--error-muted)]
                        data-[selected=true]:text-[var(--error)]"
                    >
                      <Trash2 className="w-4 h-4" />
                      Clear All Media
                    </Command.Item>
                  )}
                </Command.Group>
              </Command.List>

              {/* Footer */}
              <div className="border-t border-[var(--glass-border)] px-4 py-2 flex items-center gap-4 text-[10px] text-[var(--text-ghost)]">
                <span>
                  <kbd className="bg-[var(--kbd-bg)] px-1 py-0.5 rounded font-mono">↑↓</kbd> navigate
                </span>
                <span>
                  <kbd className="bg-[var(--kbd-bg)] px-1 py-0.5 rounded font-mono">↵</kbd> select
                </span>
                <span>
                  <kbd className="bg-[var(--kbd-bg)] px-1 py-0.5 rounded font-mono">esc</kbd> close
                </span>
              </div>
            </Command>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
