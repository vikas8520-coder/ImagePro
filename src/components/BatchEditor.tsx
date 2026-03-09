"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Tag, Type, Hash, Check } from "lucide-react";
import { toast } from "sonner";
import { useMediaStore } from "@/store/mediaStore";
import { PostType, CropRatio } from "@/types/media";

const postTypes: { key: PostType; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "story", label: "Story" },
  { key: "reel", label: "Reel" },
  { key: "carousel", label: "Carousel" },
];

const cropRatios: { key: CropRatio; label: string }[] = [
  { key: "1:1", label: "1:1" },
  { key: "4:5", label: "4:5" },
  { key: "16:9", label: "16:9" },
  { key: "9:16", label: "9:16" },
];

export default function BatchEditor() {
  const [isOpen, setIsOpen] = useState(false);
  const { selectedIds, batchUpdateItems, batchMarkReady, clearSelection } = useMediaStore();

  const [postType, setPostType] = useState<PostType | undefined>();
  const [cropRatio, setCropRatio] = useState<CropRatio | undefined>();
  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [applyCaption, setApplyCaption] = useState(false);
  const [applyHashtags, setApplyHashtags] = useState(false);

  useEffect(() => {
    const handler = () => setIsOpen(true);
    window.addEventListener("open-batch-editor", handler);
    return () => window.removeEventListener("open-batch-editor", handler);
  }, []);

  // Reset when closed
  useEffect(() => {
    if (!isOpen) {
      setPostType(undefined);
      setCropRatio(undefined);
      setCaption("");
      setHashtags("");
      setApplyCaption(false);
      setApplyHashtags(false);
    }
  }, [isOpen]);

  if (!isOpen || selectedIds.size === 0) return null;

  const handleApply = () => {
    const ids = Array.from(selectedIds);
    const updates: Record<string, unknown> = {};

    if (postType) updates.postType = postType;
    if (cropRatio) updates.cropRatio = cropRatio;
    if (applyCaption) updates.caption = caption;
    if (applyHashtags) updates.hashtags = hashtags;

    if (Object.keys(updates).length === 0) {
      toast.error("Nothing to apply — select at least one field");
      return;
    }

    batchUpdateItems(ids, updates);
    toast.success(`Updated ${ids.length} items`);
    setIsOpen(false);
  };

  const handleApplyAndReady = () => {
    handleApply();
    batchMarkReady(Array.from(selectedIds));
    clearSelection();
  };

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Batch editor">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => setIsOpen(false)}
        />
        <motion.div
          initial={{ opacity: 0, scale: 0.95, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.95, y: 20 }}
          className="relative w-full max-w-lg mx-4 glass-surface overflow-hidden"
          style={{ background: "var(--panel-bg)", borderRadius: "var(--glass-radius)" }}
        >
          {/* Header */}
          <div
            className="px-6 py-4 flex items-center justify-between"
            style={{ borderBottom: "1px solid var(--glass-border)" }}
          >
            <h2 className="text-lg font-semibold text-[var(--text-strong)]">
              Batch Edit — {selectedIds.size} items
            </h2>
            <button
              onClick={() => setIsOpen(false)}
              className="p-2 rounded-lg hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="p-6 space-y-5 max-h-[70vh] overflow-y-auto">
            {/* Post type */}
            <div className="glass-card-static p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-default)] mb-3">
                <Tag className="w-4 h-4 text-[var(--accent)]" />
                Post Type
              </label>
              <div className="flex gap-2">
                {postTypes.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setPostType(postType === key ? undefined : key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      postType === key
                        ? "bg-[var(--accent)] text-black"
                        : "bg-[var(--glass-bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--glass-border)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Crop ratio */}
            <div className="glass-card-static p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-default)] mb-3">
                <Tag className="w-4 h-4 text-[var(--accent)]" />
                Crop Ratio
              </label>
              <div className="flex gap-2">
                {cropRatios.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setCropRatio(cropRatio === key ? undefined : key)}
                    className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                      cropRatio === key
                        ? "bg-[var(--accent)] text-black"
                        : "bg-[var(--glass-bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--glass-border)]"
                    }`}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

            {/* Caption */}
            <div className="glass-card-static p-4">
              <label className="flex items-center justify-between text-sm font-medium text-[var(--text-default)] mb-3">
                <span className="flex items-center gap-2">
                  <Type className="w-4 h-4 text-[var(--accent)]" />
                  Caption
                </span>
                <button
                  onClick={() => setApplyCaption(!applyCaption)}
                  className={`text-xs px-2 py-0.5 rounded-md transition-all ${
                    applyCaption
                      ? "bg-[var(--accent)] text-black"
                      : "bg-[var(--glass-bg-hover)] text-[var(--text-ghost)]"
                  }`}
                >
                  {applyCaption ? "Will apply" : "Skip"}
                </button>
              </label>
              <textarea
                value={caption}
                onChange={(e) => {
                  setCaption(e.target.value);
                  if (!applyCaption) setApplyCaption(true);
                }}
                placeholder="Shared caption for all selected..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none
                  text-[var(--text-default)] placeholder:text-[var(--text-ghost)]
                  focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent-muted)]
                  transition-all"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--glass-border)",
                }}
              />
            </div>

            {/* Hashtags */}
            <div className="glass-card-static p-4">
              <label className="flex items-center justify-between text-sm font-medium text-[var(--text-default)] mb-3">
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[var(--accent)]" />
                  Hashtags
                </span>
                <button
                  onClick={() => setApplyHashtags(!applyHashtags)}
                  className={`text-xs px-2 py-0.5 rounded-md transition-all ${
                    applyHashtags
                      ? "bg-[var(--accent)] text-black"
                      : "bg-[var(--glass-bg-hover)] text-[var(--text-ghost)]"
                  }`}
                >
                  {applyHashtags ? "Will apply" : "Skip"}
                </button>
              </label>
              <textarea
                value={hashtags}
                onChange={(e) => {
                  setHashtags(e.target.value);
                  if (!applyHashtags) setApplyHashtags(true);
                }}
                placeholder="#photography #landscape..."
                rows={2}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none
                  text-[var(--text-default)] placeholder:text-[var(--text-ghost)]
                  focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent-muted)]
                  transition-all"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--glass-border)",
                }}
              />
            </div>
          </div>

          {/* Actions */}
          <div
            className="px-6 py-4 flex gap-3"
            style={{ borderTop: "1px solid var(--glass-border)" }}
          >
            <button
              onClick={() => setIsOpen(false)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium
                glass-card-static text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleApply}
              className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium
                bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] transition-all"
            >
              Apply to {selectedIds.size} items
            </button>
            <button
              onClick={handleApplyAndReady}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium
                bg-[var(--success)] text-white hover:brightness-110 transition-all"
            >
              <Check className="w-4 h-4" />
              Apply & Mark Ready
            </button>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
