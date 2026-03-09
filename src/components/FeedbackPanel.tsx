"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Star, Bug, Lightbulb, MessageSquare, Trash2, ExternalLink, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface FeedbackEntry {
  id: number;
  type: "bug" | "feature" | "general";
  message: string;
  rating: number;
  created_at: string;
}

const feedbackTypes = [
  { key: "bug" as const, label: "Bug", icon: Bug, color: "var(--error)" },
  { key: "feature" as const, label: "Feature", icon: Lightbulb, color: "var(--warning)" },
  { key: "general" as const, label: "General", icon: MessageSquare, color: "var(--info)" },
];

interface FeedbackPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackPanel({ isOpen, onClose }: FeedbackPanelProps) {
  const [entries, setEntries] = useState<FeedbackEntry[]>([]);
  const [type, setType] = useState<FeedbackEntry["type"]>("general");
  const [message, setMessage] = useState("");
  const [rating, setRating] = useState(0);
  const [tab, setTab] = useState<"write" | "view">("write");
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Fetch feedback when opening the View tab
  useEffect(() => {
    if (isOpen && tab === "view") {
      fetchFeedback();
    }
  }, [isOpen, tab]);

  const fetchFeedback = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/feedback");
      if (res.ok) {
        const data = await res.json();
        setEntries(data.feedback || []);
      }
    } catch {
      toast.error("Failed to load feedback");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async () => {
    if (!message.trim()) {
      toast.error("Please write a message");
      return;
    }

    setSubmitting(true);
    try {
      const res = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, message: message.trim(), rating }),
      });

      if (res.ok) {
        setMessage("");
        setRating(0);
        setType("general");
        toast.success("Feedback submitted! Thank you.");
      } else {
        const data = await res.json();
        toast.error(data.error || "Failed to submit");
      }
    } catch {
      toast.error("Network error — feedback not submitted");
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      const res = await fetch(`/api/feedback?id=${id}`, { method: "DELETE" });
      if (res.ok) {
        setEntries((prev) => prev.filter((e) => e.id !== id));
        toast.success("Feedback deleted");
      }
    } catch {
      toast.error("Failed to delete");
    }
  };

  const handleExport = () => {
    const blob = new Blob([JSON.stringify(entries, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `imagepro-feedback-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success(`Exported ${entries.length} feedback entries`);
  };

  const handleSubmitToGitHub = () => {
    const labels = type === "bug" ? "bug" : type === "feature" ? "enhancement" : "feedback";
    const stars = rating > 0 ? `\n\nRating: ${"⭐".repeat(rating)} (${rating}/5)` : "";
    const body = encodeURIComponent(`${message}${stars}\n\n---\n_Submitted via ImagePro feedback panel_`);
    const title = encodeURIComponent(`[${type.toUpperCase()}] ${message.slice(0, 60)}${message.length > 60 ? "..." : ""}`);
    window.open(
      `https://github.com/vikas8520-coder/ImagePro/issues/new?title=${title}&body=${body}&labels=${labels}`,
      "_blank"
    );
  };

  const typeIcon = (t: FeedbackEntry["type"]) => {
    const found = feedbackTypes.find((ft) => ft.key === t);
    return found ? { Icon: found.icon, color: found.color } : { Icon: MessageSquare, color: "var(--info)" };
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Feedback">
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
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
              <h2 className="text-lg font-semibold text-[var(--text-strong)]">Feedback</h2>
              <div className="flex items-center gap-2">
                <div className="flex items-center glass-card-static overflow-hidden p-0.5 mr-2">
                  <button
                    onClick={() => setTab("write")}
                    className={`px-3 py-1 rounded-[10px] text-xs font-medium transition-all ${
                      tab === "write" ? "bg-[var(--accent)] text-black" : "text-[var(--text-muted)]"
                    }`}
                  >
                    Write
                  </button>
                  <button
                    onClick={() => setTab("view")}
                    className={`px-3 py-1 rounded-[10px] text-xs font-medium transition-all ${
                      tab === "view" ? "bg-[var(--accent)] text-black" : "text-[var(--text-muted)]"
                    }`}
                  >
                    View ({entries.length})
                  </button>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 rounded-lg hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>
            </div>

            {tab === "write" ? (
              <div className="p-6 space-y-5">
                {/* Type selector */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Type</label>
                  <div className="flex gap-2">
                    {feedbackTypes.map(({ key, label, icon: Icon, color }) => (
                      <button
                        key={key}
                        onClick={() => setType(key)}
                        className={`flex items-center gap-1.5 px-3 py-2 rounded-xl text-sm font-medium transition-all ${
                          type === key
                            ? "bg-[var(--accent)] text-black"
                            : "bg-[var(--glass-bg-hover)] text-[var(--text-muted)] border border-[var(--glass-border)]"
                        }`}
                      >
                        <Icon className="w-3.5 h-3.5" style={type !== key ? { color } : undefined} />
                        {label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Rating (optional)</label>
                  <div className="flex gap-1">
                    {[1, 2, 3, 4, 5].map((n) => (
                      <button
                        key={n}
                        onClick={() => setRating(rating === n ? 0 : n)}
                        className="p-1 transition-transform hover:scale-110"
                      >
                        <Star
                          className="w-5 h-5 transition-colors"
                          fill={n <= rating ? "var(--warning)" : "none"}
                          stroke={n <= rating ? "var(--warning)" : "var(--text-ghost)"}
                        />
                      </button>
                    ))}
                  </div>
                </div>

                {/* Message */}
                <div>
                  <label className="text-xs font-medium text-[var(--text-muted)] mb-2 block">Message</label>
                  <textarea
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    placeholder="What's on your mind? Bug reports, feature ideas, or general thoughts..."
                    rows={4}
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

                {/* Actions */}
                <div className="flex gap-2">
                  <button
                    onClick={handleSubmit}
                    disabled={submitting}
                    className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium
                      bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)] transition-all
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {submitting ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Send className="w-4 h-4" />
                    )}
                    {submitting ? "Submitting..." : "Submit"}
                  </button>
                  {message.trim() && (
                    <button
                      onClick={handleSubmitToGitHub}
                      className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl text-sm font-medium
                        glass-card-static text-[var(--text-secondary)] hover:bg-[var(--glass-bg-hover)] transition-all"
                      title="Open as GitHub Issue"
                    >
                      <ExternalLink className="w-4 h-4" />
                      GitHub
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="p-6 max-h-[60vh] overflow-y-auto">
                {loading ? (
                  <div className="text-center py-12">
                    <Loader2 className="w-6 h-6 mx-auto mb-3 animate-spin text-[var(--text-ghost)]" />
                    <p className="text-sm text-[var(--text-muted)]">Loading feedback...</p>
                  </div>
                ) : entries.length === 0 ? (
                  <div className="text-center py-12">
                    <MessageSquare className="w-8 h-8 mx-auto mb-3 text-[var(--text-ghost)]" />
                    <p className="text-sm text-[var(--text-muted)]">No feedback yet</p>
                    <p className="text-xs text-[var(--text-ghost)] mt-1">Switch to Write tab to leave feedback</p>
                  </div>
                ) : (
                  <div className="space-y-3">
                    {entries.map((entry) => {
                      const { Icon, color } = typeIcon(entry.type);
                      return (
                        <div key={entry.id} className="glass-card-static p-3 group">
                          <div className="flex items-start justify-between gap-2">
                            <div className="flex items-center gap-2 mb-1.5">
                              <Icon className="w-3.5 h-3.5 flex-shrink-0" style={{ color }} />
                              <span className="text-[10px] uppercase font-bold text-[var(--text-ghost)]">
                                {entry.type}
                              </span>
                              {entry.rating > 0 && (
                                <span className="text-[10px] text-[var(--warning)]">
                                  {"★".repeat(entry.rating)}
                                </span>
                              )}
                              <span className="text-[10px] text-[var(--text-ghost)] ml-auto">
                                {new Date(entry.created_at).toLocaleDateString()}
                              </span>
                            </div>
                            <button
                              onClick={() => handleDelete(entry.id)}
                              className="p-1 rounded opacity-0 group-hover:opacity-100 hover:bg-[var(--error-muted)] transition-all"
                            >
                              <Trash2 className="w-3 h-3 text-[var(--error)]" />
                            </button>
                          </div>
                          <p className="text-sm text-[var(--text-default)] whitespace-pre-wrap">
                            {entry.message}
                          </p>
                        </div>
                      );
                    })}
                  </div>
                )}

                {entries.length > 0 && !loading && (
                  <div className="mt-4 pt-4" style={{ borderTop: "1px solid var(--glass-border)" }}>
                    <button
                      onClick={handleExport}
                      className="w-full flex items-center justify-center gap-2 py-2 rounded-xl text-xs font-medium
                        glass-card-static text-[var(--text-muted)] hover:bg-[var(--glass-bg-hover)] transition-all"
                    >
                      Export as JSON
                    </button>
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
