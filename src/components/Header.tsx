"use client";

import { useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Download,
  Trash2,
  CheckCheck,
  XCircle,
  Plus,
  Search,
  Pencil,
} from "lucide-react";
import { toast } from "sonner";
import { useMediaStore } from "@/store/mediaStore";
import { formatFileSize, processFiles } from "@/utils/mediaProcessing";
import { exportAsZip } from "@/utils/cropAndDownload";

export default function Header() {
  const {
    selectedIds,
    clearSelection,
    removeItems,
    batchMarkReady,
    getReadyItems,
    getStats,
    addItems,
    setImporting,
    setImportProgress,
    items,
  } = useMediaStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const [isExporting, setIsExporting] = useState(false);
  const stats = getStats();
  const hasSelection = selectedIds.size > 0;
  const hasMedia = items.length > 0;

  const handleExport = async () => {
    const readyItems = getReadyItems();
    if (readyItems.length === 0) return;

    setIsExporting(true);
    const toastId = toast.loading(`Preparing ${readyItems.length} files for export...`);

    try {
      await exportAsZip(readyItems);
      toast.success(`Exported ${readyItems.length} files as ZIP`, { id: toastId });
    } catch (err) {
      toast.error("Export failed. Please try again.", { id: toastId });
    } finally {
      setIsExporting(false);
    }
  };

  const handleAddMore = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    const fileArray = Array.from(files);
    setImporting(true);
    setImportProgress({ processed: 0, total: fileArray.length });
    const newItems = await processFiles(fileArray, (processed, total) => {
      setImportProgress({ processed, total });
    });
    addItems(newItems);
    setImporting(false);
    setImportProgress(null);
    toast.success(`Imported ${newItems.length} files`);
  };

  const handleBatchDelete = () => {
    const count = selectedIds.size;
    removeItems(Array.from(selectedIds));
    clearSelection();
    toast.success(`Removed ${count} items`);
  };

  const handleBatchReady = () => {
    const ids = Array.from(selectedIds);
    batchMarkReady(ids);
    toast.success(`Marked ${ids.length} items as ready`);
  };

  return (
    <header
      className="glass-surface sticky top-0 z-40"
      style={{
        background: "var(--header-bg)",
        borderTop: "none",
        borderLeft: "none",
        borderRight: "none",
        borderRadius: 0,
      }}
      role="banner"
    >
      <div className="px-6 py-3 flex items-center justify-between">
        {/* Stats */}
        {hasMedia ? (
          <div className="flex items-center gap-4 text-xs text-[var(--text-muted)]">
            <span>
              <strong className="text-[var(--text-default)] font-semibold">{stats.total}</strong>{" "}
              files
            </span>
            <span className="w-px h-3 bg-[var(--glass-border)]" />
            <span>
              <strong className="text-[var(--text-default)] font-semibold">{stats.photos}</strong>{" "}
              photos
            </span>
            <span>
              <strong className="text-[var(--text-default)] font-semibold">{stats.videos}</strong>{" "}
              videos
            </span>
            <span className="w-px h-3 bg-[var(--glass-border)]" />
            <span>{formatFileSize(stats.totalSize)}</span>
            {stats.ready > 0 && (
              <>
                <span className="w-px h-3 bg-[var(--glass-border)]" />
                <span>
                  <strong className="text-[var(--success)] font-semibold">{stats.ready}</strong>{" "}
                  ready
                </span>
              </>
            )}
          </div>
        ) : (
          <div />
        )}

        {/* Right actions */}
        <div className="flex items-center gap-2">
          {/* ⌘K hint */}
          <button
            onClick={() => {
              window.dispatchEvent(
                new KeyboardEvent("keydown", { key: "k", metaKey: true })
              );
            }}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs
              text-[var(--text-ghost)] hover:text-[var(--text-muted)]
              hover:bg-[var(--glass-bg-hover)] transition-all border border-[var(--glass-border)]"
            aria-label="Open command palette"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <kbd className="text-[10px] font-mono bg-[var(--badge-bg)] px-1 py-0.5 rounded">
              ⌘K
            </kbd>
          </button>

          <AnimatePresence>
            {hasSelection && (
              <motion.div
                initial={{ opacity: 0, x: 10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 10 }}
                className="flex items-center gap-2"
              >
                <span className="text-xs text-[var(--accent)] font-medium">
                  {selectedIds.size} selected
                </span>
                <button
                  onClick={() => {
                    window.dispatchEvent(new CustomEvent("open-batch-editor"));
                  }}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-[var(--accent-muted)] text-[var(--accent)] hover:brightness-110 transition-all"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  Batch Edit
                </button>
                <button
                  onClick={handleBatchReady}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-[var(--success-muted)] text-[var(--success)] hover:brightness-110 transition-all"
                >
                  <CheckCheck className="w-3.5 h-3.5" />
                  Mark Ready
                </button>
                <button
                  onClick={handleBatchDelete}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                    bg-[var(--error-muted)] text-[var(--error)] hover:brightness-110 transition-all"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  Remove
                </button>
                <button
                  onClick={clearSelection}
                  className="p-1.5 rounded-lg text-[var(--text-faint)] hover:text-[var(--text-muted)]
                    hover:bg-[var(--glass-bg-hover)] transition-all"
                  aria-label="Clear selection"
                >
                  <XCircle className="w-4 h-4" />
                </button>
                <span className="w-px h-5 bg-[var(--glass-border)]" />
              </motion.div>
            )}
          </AnimatePresence>

          {hasMedia && (
            <>
              <input
                ref={fileInputRef}
                type="file"
                multiple
                accept="image/*,video/*"
                onChange={(e) => handleAddMore(e.target.files)}
                className="hidden"
              />
              <button
                onClick={() => fileInputRef.current?.click()}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium
                  glass-card-static text-[var(--text-secondary)] hover:text-[var(--text-default)]
                  hover:bg-[var(--glass-bg-hover)] transition-all"
              >
                <Plus className="w-3.5 h-3.5" />
                Add More
              </button>
            </>
          )}

          {stats.ready > 0 && (
            <button
              onClick={handleExport}
              disabled={isExporting}
              className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-semibold
                bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] transition-all
                disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Download className={`w-3.5 h-3.5 ${isExporting ? "animate-bounce" : ""}`} />
              {isExporting ? "Exporting..." : `Export ZIP (${stats.ready})`}
            </button>
          )}
        </div>
      </div>
    </header>
  );
}
