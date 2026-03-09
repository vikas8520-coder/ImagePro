"use client";

import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { Upload, Sparkles, Camera } from "lucide-react";
import { useMediaStore } from "@/store/mediaStore";
import { processFiles } from "@/utils/mediaProcessing";

export default function DropZone() {
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const { addItems, setImporting, setImportProgress, isImporting, importProgress } =
    useMediaStore();

  const handleFiles = useCallback(
    async (files: FileList | File[]) => {
      const fileArray = Array.from(files);
      if (fileArray.length === 0) return;

      setImporting(true);
      setImportProgress({ processed: 0, total: fileArray.length });

      const items = await processFiles(fileArray, (processed, total) => {
        setImportProgress({ processed, total });
      });

      addItems(items);
      setImporting(false);
      setImportProgress(null);
    },
    [addItems, setImporting, setImportProgress]
  );

  const onDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  }, []);

  const onDragLeave = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  }, []);

  const onDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      setIsDragging(false);
      handleFiles(e.dataTransfer.files);
    },
    [handleFiles]
  );

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.4, 0, 0.2, 1] }}
      onDragOver={onDragOver}
      onDragLeave={onDragLeave}
      onDrop={onDrop}
      onClick={() => fileInputRef.current?.click()}
      className={`
        relative cursor-pointer rounded-2xl border-2 border-dashed
        transition-all duration-300 ease-[cubic-bezier(0.4,0,0.2,1)]
        ${
          isDragging
            ? "border-[var(--accent)] bg-[var(--accent-ghost)] scale-[1.01]"
            : "border-[var(--glass-border)] hover:border-[var(--text-ghost)] bg-[var(--glass-bg)] hover:bg-[var(--glass-bg-hover)]"
        }
        ${isImporting ? "pointer-events-none" : ""}
      `}
      role="button"
      aria-label="Import media files"
      tabIndex={0}
    >
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="image/*,video/*"
        onChange={(e) => e.target.files && handleFiles(e.target.files)}
        className="hidden"
        aria-hidden="true"
      />

      <div className="flex flex-col items-center justify-center py-20 px-8">
        {isImporting && importProgress ? (
          <div className="text-center">
            <div
              className="w-56 h-1.5 rounded-full overflow-hidden mb-4 mx-auto"
              style={{ background: "var(--bg-elevated)" }}
              role="progressbar"
              aria-valuenow={importProgress.processed}
              aria-valuemax={importProgress.total}
            >
              <motion.div
                className="h-full rounded-full"
                style={{ background: "var(--accent)" }}
                initial={{ width: 0 }}
                animate={{
                  width: `${(importProgress.processed / importProgress.total) * 100}%`,
                }}
                transition={{ duration: 0.3 }}
              />
            </div>
            <p className="text-[var(--text-secondary)] text-sm font-medium">
              Processing {importProgress.processed} of {importProgress.total}
            </p>
            <p className="text-[var(--text-ghost)] text-xs mt-1">
              Generating thumbnails and detecting orientations...
            </p>
          </div>
        ) : (
          <>
            <div
              className="w-16 h-16 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "var(--accent-muted)" }}
            >
              <Upload className="w-7 h-7" style={{ color: "var(--accent)" }} />
            </div>
            <p className="text-[var(--text-strong)] text-lg font-semibold mb-1">
              Drop your photos & videos
            </p>
            <p className="text-[var(--text-muted)] text-sm">
              or click to browse — handles up to 400+ files, 10GB
            </p>
            <div className="flex gap-2 mt-5">
              {["JPG", "PNG", "HEIC", "RAW", "MP4", "MOV"].map((fmt) => (
                <span
                  key={fmt}
                  className="text-[10px] px-2.5 py-1 rounded-full font-medium"
                  style={{
                    background: "var(--glass-bg-hover)",
                    color: "var(--text-faint)",
                    border: "1px solid var(--glass-border)",
                  }}
                >
                  {fmt}
                </span>
              ))}
            </div>
            <div className="mt-6 flex items-center gap-2 text-[var(--text-ghost)] text-xs">
              <Sparkles className="w-3.5 h-3.5" />
              Auto-detects photo/video, orientation, and dimensions
            </div>
          </>
        )}
      </div>
    </motion.div>
  );
}
