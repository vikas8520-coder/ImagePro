"use client";

import { useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import {
  Camera,
  Layers,
  Image as ImageIcon,
  Video,
  RectangleVertical,
  RectangleHorizontal,
  Square,
  CheckCircle,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  MessageCircle,
} from "lucide-react";
import FeedbackChat from "./FeedbackChat";
import { useMediaStore } from "@/store/mediaStore";
import { useTheme } from "@/components/ThemeProvider";
import { FilterTab } from "@/types/media";

const navItems: {
  key: FilterTab;
  label: string;
  icon: React.ElementType;
  shortcut: string;
}[] = [
  { key: "all", label: "All Media", icon: Layers, shortcut: "1" },
  { key: "photos", label: "Photos", icon: ImageIcon, shortcut: "2" },
  { key: "videos", label: "Videos", icon: Video, shortcut: "3" },
  { key: "portrait", label: "Portrait", icon: RectangleVertical, shortcut: "4" },
  { key: "landscape", label: "Landscape", icon: RectangleHorizontal, shortcut: "5" },
  { key: "square", label: "Square", icon: Square, shortcut: "6" },
  { key: "ready", label: "Ready to Post", icon: CheckCircle, shortcut: "7" },
];

export default function Sidebar() {
  const [feedbackOpen, setFeedbackOpen] = useState(false);
  const { theme, toggleTheme } = useTheme();
  const collapsed = useMediaStore((s) => s.sidebarCollapsed);
  const toggleSidebar = useMediaStore((s) => s.toggleSidebar);
  const activeFilter = useMediaStore((s) => s.activeFilter);
  const setFilter = useMediaStore((s) => s.setFilter);
  const total = useMediaStore((s) => s.items.length);
  const photos = useMediaStore((s) => s.items.filter((i) => i.type === "photo").length);
  const videos = useMediaStore((s) => s.items.filter((i) => i.type === "video").length);
  const ready = useMediaStore((s) => s.items.filter((i) => i.isReady).length);

  // A4: Number keys 1-7 as global shortcuts for instant view switching
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      // Don't trigger in inputs
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement
      )
        return;

      const idx = parseInt(e.key) - 1;
      if (idx >= 0 && idx < navItems.length) {
        setFilter(navItems[idx].key);
      }
      // ? for shortcut overlay
      if (e.key === "?") {
        // Could show a shortcut overlay
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [setFilter]);

  const getCount = (key: FilterTab): number | null => {
    switch (key) {
      case "all": return total;
      case "photos": return photos;
      case "videos": return videos;
      case "ready": return ready;
      default: return null;
    }
  };

  return (
    <nav
      aria-label="Main navigation"
      className={`
        fixed left-0 top-0 bottom-0 z-30
        glass-surface flex flex-col
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${collapsed ? "w-[60px]" : "w-[220px]"}
      `}
      style={{ background: "var(--sidebar-bg)" }}
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 h-16 border-b border-[var(--glass-border)]">
        <div className="w-8 h-8 rounded-xl bg-[var(--accent)] flex items-center justify-center flex-shrink-0">
          <Camera className="w-4.5 h-4.5 text-black" />
        </div>
        <AnimatePresence>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              className="overflow-hidden whitespace-nowrap"
            >
              <h1 className="text-sm font-bold text-[var(--text-strong)] tracking-tight">
                ImagePro
              </h1>
              <p className="text-[9px] text-[var(--text-faint)] uppercase tracking-[0.15em]">
                Studio
              </p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Nav items */}
      <div className="flex-1 py-3 px-2 space-y-0.5 overflow-y-auto" role="list">
        {navItems.map(({ key, label, icon: Icon, shortcut }) => {
          const isActive = activeFilter === key;
          const count = getCount(key);
          const hasNotification = key === "ready" && ready > 0;

          return (
            <button
              key={key}
              role="listitem"
              onClick={() => setFilter(key)}
              className={`
                relative w-full flex items-center gap-3 rounded-[10px] transition-all duration-200
                ${collapsed ? "px-0 justify-center h-10" : "px-3 h-9"}
                ${
                  isActive
                    ? "bg-[var(--accent-muted)] text-[var(--accent)]"
                    : "text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] hover:text-[var(--text-secondary)]"
                }
              `}
              title={collapsed ? label : undefined}
            >
              <div className="relative flex-shrink-0">
                <Icon className="w-[18px] h-[18px]" />
                {hasNotification && (
                  <span className="absolute -top-1 -right-1 w-2 h-2 rounded-full bg-[var(--success)]" />
                )}
              </div>

              <AnimatePresence>
                {!collapsed && (
                  <motion.div
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    className="flex items-center justify-between flex-1 overflow-hidden"
                  >
                    <span className="text-[13px] font-medium whitespace-nowrap">
                      {label}
                    </span>
                    <div className="flex items-center gap-2">
                      {count !== null && count > 0 && (
                        <span
                          className={`text-[10px] px-1.5 py-0.5 rounded-md ${
                            isActive
                              ? "bg-[var(--accent)] text-black"
                              : "bg-[var(--badge-bg)] text-[var(--text-faint)]"
                          }`}
                        >
                          {count}
                        </span>
                      )}
                      <kbd className="text-[10px] text-[var(--text-ghost)] font-mono">
                        {shortcut}
                      </kbd>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </button>
          );
        })}
      </div>

      {/* Bottom controls */}
      <div className="border-t border-[var(--glass-border)] p-2 space-y-1">
        {/* Feedback */}
        <button
          onClick={() => setFeedbackOpen(true)}
          className={`
            w-full flex items-center gap-2 rounded-lg transition-all duration-200
            text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]
            ${collapsed ? "justify-center h-9" : "px-3 h-8"}
          `}
          aria-label="Send feedback"
          title={collapsed ? "Feedback" : undefined}
        >
          <MessageCircle className="w-4 h-4 flex-shrink-0" />
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[11px] whitespace-nowrap overflow-hidden"
              >
                Feedback
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Theme toggle */}
        <button
          onClick={toggleTheme}
          className={`
            w-full flex items-center gap-2 rounded-lg transition-all duration-200
            text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]
            ${collapsed ? "justify-center h-9" : "px-3 h-8"}
          `}
          aria-label={theme === "dark" ? "Switch to light mode" : "Switch to dark mode"}
          title={collapsed ? (theme === "dark" ? "Light mode" : "Dark mode") : undefined}
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 flex-shrink-0" />
          ) : (
            <Moon className="w-4 h-4 flex-shrink-0" />
          )}
          <AnimatePresence>
            {!collapsed && (
              <motion.span
                initial={{ opacity: 0, width: 0 }}
                animate={{ opacity: 1, width: "auto" }}
                exit={{ opacity: 0, width: 0 }}
                className="text-[11px] whitespace-nowrap overflow-hidden"
              >
                {theme === "dark" ? "Light mode" : "Dark mode"}
              </motion.span>
            )}
          </AnimatePresence>
        </button>

        {/* Collapse toggle */}
        <button
          onClick={toggleSidebar}
          className={`
            w-full flex items-center gap-2 rounded-lg transition-all duration-200
            text-[var(--text-faint)] hover:text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)]
            ${collapsed ? "justify-center h-9" : "px-3 h-8"}
          `}
          aria-label={collapsed ? "Expand sidebar" : "Collapse sidebar"}
        >
          {collapsed ? (
            <ChevronRight className="w-4 h-4" />
          ) : (
            <>
              <ChevronLeft className="w-4 h-4" />
              <span className="text-[11px]">Collapse</span>
            </>
          )}
        </button>
      </div>

      <FeedbackChat isOpen={feedbackOpen} onClose={() => setFeedbackOpen(false)} />
    </nav>
  );
}
