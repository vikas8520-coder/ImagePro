"use client";

import { memo } from "react";
import { motion } from "framer-motion";
import {
  Check,
  Image as ImageIcon,
  Video,
  RectangleVertical,
  RectangleHorizontal,
  Square,
  Pencil,
} from "lucide-react";
import { MediaItem } from "@/types/media";
import { useMediaStore } from "@/store/mediaStore";
import { formatFileSize } from "@/utils/mediaProcessing";

interface MediaCardProps {
  item: MediaItem;
  isSelected: boolean;
}

const orientationIcon = {
  portrait: RectangleVertical,
  landscape: RectangleHorizontal,
  square: Square,
};

function MediaCard({ item, isSelected }: MediaCardProps) {
  const { toggleSelection, setEditingId } = useMediaStore();
  const OrientIcon = orientationIcon[item.orientation];

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.2 }}
      className={`
        group relative overflow-hidden cursor-pointer
        glass-card
        ${isSelected ? "!border-[var(--accent)] !bg-[var(--accent-ghost)]" : ""}
        ${item.isReady && !isSelected ? "!border-[var(--success)] !bg-[var(--success-muted)]" : ""}
      `}
      style={{ borderRadius: "var(--glass-radius)" }}
      onClick={() => toggleSelection(item.id)}
    >
      {/* Thumbnail */}
      <div className="aspect-square relative overflow-hidden" style={{ background: "var(--bg-raised)" }}>
        <img
          src={item.thumbnailUrl}
          alt={item.name}
          className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
          loading="lazy"
        />

        {/* Hover overlay */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/40 transition-all duration-200" />

        {/* Selection checkbox */}
        <div
          className={`
            absolute top-2.5 left-2.5 w-6 h-6 rounded-md border-2
            flex items-center justify-center transition-all backdrop-blur-sm
            ${
              isSelected
                ? "bg-[var(--accent)] border-[var(--accent)]"
                : "border-white/40 bg-black/20 opacity-0 group-hover:opacity-100"
            }
          `}
        >
          {isSelected && <Check className="w-3.5 h-3.5 text-black" strokeWidth={3} />}
        </div>

        {/* Type badge */}
        <div className="absolute top-2.5 right-2.5">
          {item.type === "video" ? (
            <span className="glass-surface backdrop-blur-md text-[var(--purple)] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <Video className="w-3 h-3" />
              VID
            </span>
          ) : (
            <span className="glass-surface backdrop-blur-md text-[var(--info)] text-[10px] font-bold px-2 py-0.5 rounded-md flex items-center gap-1">
              <ImageIcon className="w-3 h-3" />
              IMG
            </span>
          )}
        </div>

        {/* Ready badge */}
        {item.isReady && (
          <div className="absolute bottom-2.5 left-2.5 bg-[var(--success)] text-black text-[10px] font-bold px-2 py-0.5 rounded-md">
            READY
          </div>
        )}

        {/* Post type badge */}
        {item.postType && (
          <div className="absolute bottom-2.5 right-2.5 bg-[var(--accent)] text-black text-[10px] font-bold px-2 py-0.5 rounded-md uppercase">
            {item.postType}
          </div>
        )}

        {/* Edit button */}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingId(item.id);
          }}
          className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2
            w-10 h-10 rounded-full glass-surface backdrop-blur-md
            flex items-center justify-center
            opacity-0 group-hover:opacity-100 transition-all duration-200
            hover:bg-[var(--glass-bg-active)]"
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className="w-4 h-4 text-white" />
        </button>
      </div>

      {/* Info bar */}
      <div className="p-2.5" style={{ background: "var(--bg-raised)" }}>
        <p className="text-xs text-[var(--text-default)] truncate font-medium">
          {item.name}
        </p>
        <div className="flex items-center gap-2 mt-1">
          <OrientIcon className="w-3 h-3 text-[var(--text-faint)]" />
          <span className="text-[10px] text-[var(--text-faint)]">
            {item.width}×{item.height}
          </span>
          <span className="text-[10px] text-[var(--text-ghost)] ml-auto">
            {formatFileSize(item.size)}
          </span>
        </div>
      </div>
    </motion.div>
  );
}

export default memo(MediaCard);
