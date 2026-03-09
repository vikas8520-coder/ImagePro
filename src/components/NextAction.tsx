"use client";

import { motion } from "framer-motion";
import {
  Sparkles,
  Crop,
  CheckCircle,
  Download,
  ChevronRight,
} from "lucide-react";
import { useMediaStore } from "@/store/mediaStore";

interface Suggestion {
  icon: React.ElementType;
  heading: string;
  description: string;
  action: () => void;
  actionLabel: string;
  color: string;
}

export default function NextAction() {
  const setFilter = useMediaStore((s) => s.setFilter);
  const total = useMediaStore((s) => s.items.length);
  const ready = useMediaStore((s) => s.items.filter((i) => i.isReady).length);
  const stats = { total, ready };

  const getSuggestion = (): Suggestion | null => {
    if (stats.total === 0) return null;

    const unprepared = stats.total - stats.ready;

    if (stats.ready === 0 && stats.total > 0) {
      return {
        icon: Crop,
        heading: "Start preparing your posts",
        description: `You have ${stats.total} files imported. Click any photo to set crop ratio, caption, and hashtags.`,
        action: () => {},
        actionLabel: "Pick one to start",
        color: "var(--accent)",
      };
    }

    if (stats.ready > 0 && unprepared > stats.ready) {
      return {
        icon: Sparkles,
        heading: `${unprepared} files still need preparation`,
        description: `${stats.ready} are ready to post. Keep going — you're ${Math.round((stats.ready / stats.total) * 100)}% done.`,
        action: () => setFilter("all"),
        actionLabel: "View remaining",
        color: "var(--accent)",
      };
    }

    if (stats.ready > 0 && stats.ready >= stats.total * 0.8) {
      return {
        icon: Download,
        heading: "Almost there — ready to export!",
        description: `${stats.ready} of ${stats.total} posts are ready. Export your queue to get posting.`,
        action: () => setFilter("ready"),
        actionLabel: "View ready posts",
        color: "var(--success)",
      };
    }

    if (stats.ready === stats.total && stats.total > 0) {
      return {
        icon: CheckCircle,
        heading: "All posts are ready!",
        description: `${stats.total} posts prepared. Export your queue and start posting.`,
        action: () => setFilter("ready"),
        actionLabel: "Export queue",
        color: "var(--success)",
      };
    }

    return null;
  };

  const suggestion = getSuggestion();
  if (!suggestion) return null;

  const Icon = suggestion.icon;

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      className="glass-card p-4 flex items-center gap-4 cursor-pointer group"
      onClick={suggestion.action}
      role="status"
      aria-live="polite"
    >
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0"
        style={{ background: `color-mix(in srgb, ${suggestion.color} 15%, transparent)` }}
      >
        <Icon className="w-5 h-5" style={{ color: suggestion.color }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-[var(--text-strong)]">
          {suggestion.heading}
        </p>
        <p className="text-xs text-[var(--text-muted)] mt-0.5 line-clamp-1">
          {suggestion.description}
        </p>
      </div>
      <div
        className="flex items-center gap-1 text-xs font-medium flex-shrink-0 opacity-70 group-hover:opacity-100 transition-opacity"
        style={{ color: suggestion.color }}
      >
        {suggestion.actionLabel}
        <ChevronRight className="w-3.5 h-3.5" />
      </div>
    </motion.div>
  );
}
