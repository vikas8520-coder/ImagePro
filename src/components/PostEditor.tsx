"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Crop, Hash, Type, Tag } from "lucide-react";
import { useMediaStore } from "@/store/mediaStore";
import { CropRatio, PostType } from "@/types/media";

const cropRatios: { key: CropRatio; label: string; w: number; h: number }[] = [
  { key: "1:1", label: "1:1", w: 1, h: 1 },
  { key: "4:5", label: "4:5", w: 4, h: 5 },
  { key: "16:9", label: "16:9", w: 16, h: 9 },
  { key: "9:16", label: "9:16", w: 9, h: 16 },
];

const postTypes: { key: PostType; label: string }[] = [
  { key: "feed", label: "Feed" },
  { key: "story", label: "Story" },
  { key: "reel", label: "Reel" },
  { key: "carousel", label: "Carousel" },
];

const MAX_CAPTION_LENGTH = 2200;
const MAX_HASHTAGS = 30;

export default function PostEditor() {
  const { items, editingId, setEditingId, updateItem, markReady, unmarkReady } =
    useMediaStore();

  const item = items.find((i) => i.id === editingId);

  const [caption, setCaption] = useState("");
  const [hashtags, setHashtags] = useState("");
  const [postType, setPostType] = useState<PostType | undefined>();
  const [cropRatio, setCropRatio] = useState<CropRatio | undefined>();

  useEffect(() => {
    if (item) {
      setCaption(item.caption || "");
      setHashtags(item.hashtags || "");
      setPostType(item.postType);
      setCropRatio(item.cropRatio);
    }
  }, [item]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId) {
        save();
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, caption, hashtags, postType, cropRatio]);

  if (!item) return null;

  const hashtagCount = hashtags
    ? hashtags.split(/[\s,]+/).filter((t) => t.length > 0).length
    : 0;

  const save = () => {
    updateItem(item.id, { caption, hashtags, postType, cropRatio });
  };

  const handleMarkReady = () => {
    save();
    if (item.isReady) unmarkReady(item.id);
    else markReady(item.id);
  };

  const selectedRatio = cropRatios.find((r) => r.key === cropRatio);

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-50 flex" role="dialog" aria-label="Post editor">
        {/* Backdrop */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          onClick={() => {
            save();
            setEditingId(null);
          }}
        />

        {/* Panel */}
        <motion.div
          initial={{ x: "100%" }}
          animate={{ x: 0 }}
          exit={{ x: "100%" }}
          transition={{ type: "spring", damping: 30, stiffness: 300 }}
          className="relative ml-auto w-full max-w-2xl overflow-y-auto glass-surface"
          style={{ background: "var(--panel-bg)", borderRadius: 0 }}
        >
          {/* Header */}
          <div
            className="sticky top-0 z-10 backdrop-blur-md px-6 py-4 flex items-center justify-between"
            style={{
              background: "var(--panel-header-bg)",
              borderBottom: "1px solid var(--glass-border)",
            }}
          >
            <h2 className="text-lg font-semibold text-[var(--text-strong)]">
              Prepare Post
            </h2>
            <div className="flex items-center gap-2">
              <kbd className="text-[10px] text-[var(--text-ghost)] font-mono bg-[var(--kbd-bg)] px-1.5 py-0.5 rounded">
                ESC
              </kbd>
              <button
                onClick={() => {
                  save();
                  setEditingId(null);
                }}
                className="p-2 rounded-lg hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)]
                  hover:text-[var(--text-secondary)] transition-colors"
                aria-label="Close editor"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div className="p-6 space-y-6">
            {/* Preview */}
            <div
              className="relative rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: "var(--bg-raised)" }}
            >
              <div
                className="relative w-full"
                style={{
                  aspectRatio: selectedRatio
                    ? `${selectedRatio.w}/${selectedRatio.h}`
                    : `${item.width}/${item.height}`,
                  maxHeight: "400px",
                }}
              >
                <img
                  src={item.objectUrl}
                  alt={item.name}
                  className="w-full h-full object-cover"
                />
                {selectedRatio && (
                  <div className="absolute inset-0 border-2 border-[var(--accent)]/50 rounded pointer-events-none">
                    <div className="absolute inset-0 grid grid-cols-3 grid-rows-3">
                      {Array.from({ length: 9 }).map((_, i) => (
                        <div key={i} className="border border-[var(--accent)]/15" />
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>

            {/* File info */}
            <div className="flex items-center gap-3 text-xs text-[var(--text-faint)]">
              <span>{item.name}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              <span>{item.width}×{item.height}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              <span className="capitalize">{item.orientation}</span>
            </div>

            {/* Crop ratio */}
            <div className="glass-card-static p-4">
              <label className="flex items-center gap-2 text-sm font-medium text-[var(--text-default)] mb-3">
                <Crop className="w-4 h-4 text-[var(--accent)]" />
                Instagram Crop Ratio
              </label>
              <div className="flex gap-2">
                {cropRatios.map(({ key, label }) => (
                  <button
                    key={key}
                    onClick={() => setCropRatio(cropRatio === key ? undefined : key)}
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium transition-all
                      ${
                        cropRatio === key
                          ? "bg-[var(--accent)] text-black"
                          : "bg-[var(--glass-bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--glass-border)]"
                      }
                    `}
                  >
                    {label}
                  </button>
                ))}
              </div>
            </div>

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
                    className={`
                      px-4 py-2 rounded-xl text-sm font-medium transition-all
                      ${
                        postType === key
                          ? "bg-[var(--accent)] text-black"
                          : "bg-[var(--glass-bg-hover)] text-[var(--text-muted)] hover:text-[var(--text-secondary)] border border-[var(--glass-border)]"
                      }
                    `}
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
                <span
                  className={`text-xs ${
                    caption.length > MAX_CAPTION_LENGTH
                      ? "text-[var(--error)]"
                      : "text-[var(--text-faint)]"
                  }`}
                >
                  {caption.length}/{MAX_CAPTION_LENGTH}
                </span>
              </label>
              <textarea
                value={caption}
                onChange={(e) => setCaption(e.target.value)}
                placeholder="Write your caption..."
                rows={4}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none
                  text-[var(--text-default)] placeholder:text-[var(--text-ghost)]
                  focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent-muted)]
                  transition-all"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--glass-border)",
                }}
                aria-label="Caption"
                maxLength={MAX_CAPTION_LENGTH + 100}
              />
            </div>

            {/* Hashtags */}
            <div className="glass-card-static p-4">
              <label className="flex items-center justify-between text-sm font-medium text-[var(--text-default)] mb-3">
                <span className="flex items-center gap-2">
                  <Hash className="w-4 h-4 text-[var(--accent)]" />
                  Hashtags
                </span>
                <span
                  className={`text-xs ${
                    hashtagCount > MAX_HASHTAGS
                      ? "text-[var(--error)]"
                      : "text-[var(--text-faint)]"
                  }`}
                >
                  {hashtagCount}/{MAX_HASHTAGS}
                </span>
              </label>
              <textarea
                value={hashtags}
                onChange={(e) => setHashtags(e.target.value)}
                placeholder="#photography #landscape #portrait..."
                rows={3}
                className="w-full px-4 py-3 rounded-xl text-sm resize-none
                  text-[var(--text-default)] placeholder:text-[var(--text-ghost)]
                  focus:outline-none focus:border-[var(--accent)]/50 focus:ring-1 focus:ring-[var(--accent-muted)]
                  transition-all"
                style={{
                  background: "var(--bg-base)",
                  border: "1px solid var(--glass-border)",
                }}
                aria-label="Hashtags"
              />
            </div>

            {/* Actions */}
            <div className="flex gap-3 pt-2">
              <button
                onClick={handleMarkReady}
                className={`
                  flex-1 flex items-center justify-center gap-2 py-3 rounded-xl
                  font-medium text-sm transition-all
                  ${
                    item.isReady
                      ? "glass-card-static text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)]"
                      : "bg-[var(--success)] text-white hover:brightness-110"
                  }
                `}
              >
                <Check className="w-4 h-4" />
                {item.isReady ? "Unmark Ready" : "Mark as Ready"}
              </button>
              <button
                onClick={() => {
                  save();
                  setEditingId(null);
                }}
                className="px-8 py-3 rounded-xl bg-[var(--accent)] text-black font-semibold text-sm
                  hover:bg-[var(--accent-hover)] transition-all"
              >
                Save
              </button>
            </div>
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
}
