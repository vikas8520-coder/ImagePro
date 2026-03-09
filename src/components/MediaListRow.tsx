"use client";

import { memo } from "react";
import {
  Check,
  Image as ImageIcon,
  Video,
  Pencil,
} from "lucide-react";
import { MediaItem } from "@/types/media";
import { useMediaStore } from "@/store/mediaStore";
import { formatFileSize } from "@/utils/mediaProcessing";

interface MediaListRowProps {
  item: MediaItem;
  isSelected: boolean;
}

function MediaListRow({ item, isSelected }: MediaListRowProps) {
  const { toggleSelection, setEditingId } = useMediaStore();

  return (
    <div
      onClick={() => toggleSelection(item.id)}
      className={`
        group grid grid-cols-[auto_1fr_100px_100px_80px_80px_80px] gap-3 items-center
        px-3 py-2 rounded-xl cursor-pointer transition-all duration-200
        ${
          isSelected
            ? "bg-[var(--accent-ghost)] border border-[var(--accent)]"
            : "glass-card-static hover:bg-[var(--glass-bg-hover)]"
        }
      `}
      role="listitem"
    >
      {/* Checkbox */}
      <div
        className={`
          w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0 transition-all
          ${isSelected ? "bg-[var(--accent)] border-[var(--accent)]" : "border-[var(--text-ghost)]"}
        `}
      >
        {isSelected && <Check className="w-3 h-3 text-black" strokeWidth={3} />}
      </div>

      {/* Name with thumbnail */}
      <div className="flex items-center gap-3 min-w-0">
        <img
          src={item.thumbnailUrl}
          alt=""
          className="w-8 h-8 rounded-lg object-cover flex-shrink-0"
        />
        <span className="text-sm text-[var(--text-default)] truncate">{item.name}</span>
      </div>

      {/* Type */}
      <div className="flex items-center gap-1.5">
        {item.type === "video" ? (
          <Video className="w-3.5 h-3.5 text-[var(--purple)]" />
        ) : (
          <ImageIcon className="w-3.5 h-3.5 text-[var(--info)]" />
        )}
        <span className="text-xs text-[var(--text-muted)] capitalize">{item.type}</span>
      </div>

      {/* Orientation */}
      <span className="text-xs text-[var(--text-muted)] capitalize">{item.orientation}</span>

      {/* Size */}
      <span className="text-xs text-[var(--text-faint)]">{formatFileSize(item.size)}</span>

      {/* Dimensions */}
      <span className="text-xs text-[var(--text-faint)]">
        {item.width}×{item.height}
      </span>

      {/* Status */}
      <div className="flex items-center gap-2">
        {item.isReady ? (
          <span className="text-[10px] font-bold text-[var(--success)] bg-[var(--success-muted)] px-2 py-0.5 rounded-md">
            READY
          </span>
        ) : (
          <span className="text-[10px] text-[var(--text-ghost)]">Draft</span>
        )}
        <button
          onClick={(e) => {
            e.stopPropagation();
            setEditingId(item.id);
          }}
          className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--glass-bg-active)] transition-all"
          aria-label={`Edit ${item.name}`}
        >
          <Pencil className="w-3.5 h-3.5 text-[var(--text-muted)]" />
        </button>
      </div>
    </div>
  );
}

export default memo(MediaListRow);
