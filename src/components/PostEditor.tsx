"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Check, Crop, Hash, Type, Tag, Download, AlertTriangle } from "lucide-react";
import { toast } from "sonner";
import ReactCrop, { type Crop as CropType, type PixelCrop, centerCrop, makeAspectCrop } from "react-image-crop";
import "react-image-crop/dist/ReactCrop.css";
import { useMediaStore } from "@/store/mediaStore";
import { CropRatio, PostType } from "@/types/media";
import { cropImageToCanvas } from "@/utils/cropAndDownload";

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
  const [crop, setCrop] = useState<CropType>();
  const [completedCrop, setCompletedCrop] = useState<PixelCrop>();
  const imgRef = useRef<HTMLImageElement>(null);

  useEffect(() => {
    if (item) {
      setCaption(item.caption || "");
      setHashtags(item.hashtags || "");
      setPostType(item.postType);
      setCropRatio(item.cropRatio);
      // Restore saved crop data
      if (item.cropData) {
        setCrop({
          x: item.cropData.x,
          y: item.cropData.y,
          width: item.cropData.width,
          height: item.cropData.height,
          unit: item.cropData.unit,
        });
      } else {
        setCrop(undefined);
      }
      setCompletedCrop(undefined);
    }
  }, [item]);

  // Escape to close
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId) {
        // Save inline to avoid declaration order issue
        const cropData = completedCrop
          ? { x: completedCrop.x, y: completedCrop.y, width: completedCrop.width, height: completedCrop.height, unit: "%" as const }
          : crop
          ? { x: crop.x, y: crop.y, width: crop.width, height: crop.height, unit: crop.unit }
          : undefined;
        updateItem(editingId, { caption, hashtags, postType, cropRatio, cropData });
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [editingId, caption, hashtags, postType, cropRatio, completedCrop, crop, updateItem, setEditingId]);

  const onImageLoad = useCallback(
    (e: React.SyntheticEvent<HTMLImageElement>) => {
      const { naturalWidth, naturalHeight } = e.currentTarget;
      if (cropRatio) {
        const ratio = cropRatios.find((r) => r.key === cropRatio);
        if (ratio) {
          const newCrop = centerCrop(
            makeAspectCrop(
              { unit: "%", width: 90 },
              ratio.w / ratio.h,
              naturalWidth,
              naturalHeight
            ),
            naturalWidth,
            naturalHeight
          );
          setCrop(newCrop);
        }
      }
    },
    [cropRatio]
  );

  useEffect(() => {
    if (!imgRef.current || !cropRatio) {
      if (!cropRatio) setCrop(undefined);
      return;
    }
    const { naturalWidth, naturalHeight } = imgRef.current;
    if (!naturalWidth || !naturalHeight) return;

    const ratio = cropRatios.find((r) => r.key === cropRatio);
    if (ratio) {
      const newCrop = centerCrop(
        makeAspectCrop(
          { unit: "%", width: 90 },
          ratio.w / ratio.h,
          naturalWidth,
          naturalHeight
        ),
        naturalWidth,
        naturalHeight
      );
      setCrop(newCrop);
    }
  }, [cropRatio]);

  if (!item) return null;

  const hashtagCount = hashtags
    ? hashtags.split(/[\s,]+/).filter((t) => t.length > 0).length
    : 0;

  const save = () => {
    const cropData = completedCrop
      ? {
          x: completedCrop.x,
          y: completedCrop.y,
          width: completedCrop.width,
          height: completedCrop.height,
          unit: "%" as const,
        }
      : crop
      ? {
          x: crop.x,
          y: crop.y,
          width: crop.width,
          height: crop.height,
          unit: crop.unit,
        }
      : undefined;
    updateItem(item.id, { caption, hashtags, postType, cropRatio, cropData });
    toast.success("Post saved");
  };

  const handleMarkReady = () => {
    save();
    if (item.isReady) unmarkReady(item.id);
    else markReady(item.id);
  };

  const handleDownload = async () => {
    save();
    if (!item.objectUrl) return;

    if (completedCrop || crop) {
      const cropData = completedCrop || crop;
      if (cropData) {
        // Update item with current crop before downloading
        const updatedItem = {
          ...item,
          cropData: {
            x: cropData.x,
            y: cropData.y,
            width: cropData.width,
            height: cropData.height,
            unit: cropData.unit as "px" | "%",
          },
        };
        const blob = await cropImageToCanvas(updatedItem);
        if (blob) {
          const url = URL.createObjectURL(blob);
          const a = document.createElement("a");
          a.href = url;
          a.download = `${item.name.replace(/\.[^.]+$/, "")}-cropped.jpg`;
          a.click();
          URL.revokeObjectURL(url);
          return;
        }
      }
    }
    // No crop — download original
    const a = document.createElement("a");
    a.href = item.objectUrl;
    a.download = item.name;
    a.click();
  };

  const selectedRatio = cropRatios.find((r) => r.key === cropRatio);
  const hasFile = !!item.objectUrl && !item.needsReimport;

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
            {/* Preview with crop */}
            <div
              className="relative rounded-2xl overflow-hidden flex items-center justify-center"
              style={{ background: "var(--bg-raised)" }}
            >
              {hasFile ? (
                <div className="relative w-full flex items-center justify-center" style={{ maxHeight: "400px" }}>
                  {item.type === "photo" ? (
                    <ReactCrop
                      crop={crop}
                      onChange={(c) => setCrop(c)}
                      onComplete={(c) => setCompletedCrop(c)}
                      aspect={selectedRatio ? selectedRatio.w / selectedRatio.h : undefined}
                    >
                      <img
                        ref={imgRef}
                        src={item.objectUrl}
                        alt={item.name}
                        onLoad={onImageLoad}
                        style={{ maxHeight: "400px", width: "auto" }}
                      />
                    </ReactCrop>
                  ) : (
                    <video
                      src={item.objectUrl}
                      className="max-h-[400px] w-auto"
                      controls
                    />
                  )}
                </div>
              ) : (
                <div className="p-12 text-center">
                  <AlertTriangle className="w-8 h-8 mx-auto mb-3 text-[var(--warning)]" />
                  <p className="text-sm text-[var(--text-muted)]">
                    Re-import this file to crop and download
                  </p>
                  <img
                    src={item.thumbnailUrl}
                    alt={item.name}
                    className="mt-4 mx-auto rounded-lg opacity-60"
                    style={{ maxHeight: "200px" }}
                  />
                </div>
              )}
            </div>

            {/* File info */}
            <div className="flex items-center gap-3 text-xs text-[var(--text-faint)]">
              <span>{item.name}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              <span>{item.width}x{item.height}</span>
              <span className="w-1 h-1 rounded-full" style={{ background: "var(--bg-elevated)" }} />
              <span className="capitalize">{item.orientation}</span>
              {item.needsReimport && (
                <>
                  <span className="w-1 h-1 rounded-full" style={{ background: "var(--bg-elevated)" }} />
                  <span className="text-[var(--warning)]">Needs re-import</span>
                </>
              )}
            </div>

            {/* Crop ratio */}
            {item.type === "photo" && (
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
            )}

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
              {hasFile && (
                <button
                  onClick={handleDownload}
                  className="flex items-center gap-1.5 px-4 py-3 rounded-xl text-xs font-medium
                    glass-card-static text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] transition-all"
                >
                  <Download className="w-4 h-4" />
                  Download
                </button>
              )}
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
