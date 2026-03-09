"use client";

import { useState, useRef, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Send, Loader2, Bot, User, ExternalLink, Star, BarChart3 } from "lucide-react";
import { toast } from "sonner";

interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system";
  text: string;
  data?: Record<string, unknown>;
}

interface FeedbackChatProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function FeedbackChat({ isOpen, onClose }: FeedbackChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const [rating, setRating] = useState(0);
  const [showAnalysis, setShowAnalysis] = useState(false);
  const [analysis, setAnalysis] = useState<Record<string, unknown> | null>(null);
  const [analyzingLoading, setAnalyzingLoading] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Welcome message
  useEffect(() => {
    if (isOpen && messages.length === 0) {
      setMessages([
        {
          id: "welcome",
          role: "assistant",
          text: "Hey! I'm the ImagePro feedback bot. Tell me what's on your mind — bugs, feature ideas, or just how you feel about the app. I'll triage it and track it for the team.",
        },
      ]);
    }
  }, [isOpen]);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  useEffect(() => {
    if (isOpen) inputRef.current?.focus();
  }, [isOpen]);

  const addMessage = (msg: ChatMessage) => {
    setMessages((prev) => [...prev, msg]);
  };

  const handleSend = async () => {
    const text = input.trim();
    if (!text || loading) return;

    setInput("");
    addMessage({ id: Date.now().toString(), role: "user", text });
    setLoading(true);

    try {
      // 1. Save feedback to DB
      const saveRes = await fetch("/api/feedback", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type: "general", message: text, rating }),
      });
      const saveData = await saveRes.json();
      const feedbackId = saveData.feedback?.id;

      // 2. Triage with AI
      const triageRes = await fetch("/api/feedback/triage", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ message: text, feedbackId }),
      });

      if (triageRes.ok) {
        const triageData = await triageRes.json();
        const triage = triageData.triage;

        // Show AI response
        addMessage({
          id: `ai-${Date.now()}`,
          role: "assistant",
          text: triage.response,
          data: {
            type: triage.type,
            priority: triage.priority,
            sentiment: triage.sentiment,
            component: triage.component,
            summary: triage.summary,
            model: triageData.ai?.model,
          },
        });

        // 3. Auto-create GitHub issue for P0/P1
        if (triage.priority === "P0" || triage.priority === "P1") {
          const ghRes = await fetch("/api/feedback/github", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              feedbackId,
              type: triage.type,
              priority: triage.priority,
              summary: triage.summary,
              message: text,
              component: triage.component,
              sentiment: triage.sentiment,
            }),
          });

          if (ghRes.ok) {
            const ghData = await ghRes.json();
            addMessage({
              id: `gh-${Date.now()}`,
              role: "system",
              text: `Created GitHub issue #${ghData.issue.number}`,
              data: { url: ghData.issue.url },
            });
          }
        }
      } else {
        // Triage failed — still saved
        addMessage({
          id: `fallback-${Date.now()}`,
          role: "assistant",
          text: "Thanks for your feedback! I saved it but couldn't analyze it right now. The team will review it manually.",
        });
      }
    } catch {
      addMessage({
        id: `err-${Date.now()}`,
        role: "assistant",
        text: "Sorry, something went wrong. Your feedback was saved though — we'll review it.",
      });
    } finally {
      setLoading(false);
      setRating(0);
    }
  };

  const handleAnalyze = async () => {
    setShowAnalysis(true);
    setAnalyzingLoading(true);
    try {
      const res = await fetch("/api/feedback/analyze");
      if (res.ok) {
        const data = await res.json();
        setAnalysis(data.analysis);
      } else {
        toast.error("Analysis failed");
      }
    } catch {
      toast.error("Network error");
    } finally {
      setAnalyzingLoading(false);
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center" role="dialog" aria-label="Feedback chat">
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
            className="relative w-full max-w-lg mx-4 flex flex-col glass-surface overflow-hidden"
            style={{
              background: "var(--panel-bg)",
              borderRadius: "var(--glass-radius)",
              height: "min(600px, 80vh)",
            }}
          >
            {/* Header */}
            <div
              className="px-5 py-3 flex items-center justify-between flex-shrink-0"
              style={{ borderBottom: "1px solid var(--glass-border)" }}
            >
              <div className="flex items-center gap-2">
                <Bot className="w-5 h-5 text-[var(--accent)]" />
                <h2 className="text-sm font-semibold text-[var(--text-strong)]">Feedback Agent</h2>
                <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--accent-muted)] text-[var(--accent)] font-medium">
                  AI
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={handleAnalyze}
                  className="p-1.5 rounded-lg hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] transition-colors"
                  title="Analyze all feedback"
                >
                  <BarChart3 className="w-4 h-4" />
                </button>
                <button
                  onClick={onClose}
                  className="p-1.5 rounded-lg hover:bg-[var(--glass-bg-hover)] text-[var(--text-muted)] transition-colors"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Analysis overlay */}
            {showAnalysis && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/40 backdrop-blur-sm">
                <div
                  className="w-[90%] max-h-[80%] overflow-y-auto glass-surface p-5"
                  style={{ background: "var(--panel-bg)", borderRadius: "var(--glass-radius)" }}
                >
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-sm font-semibold text-[var(--text-strong)]">Feedback Analysis</h3>
                    <button
                      onClick={() => setShowAnalysis(false)}
                      className="p-1 rounded hover:bg-[var(--glass-bg-hover)]"
                    >
                      <X className="w-4 h-4 text-[var(--text-muted)]" />
                    </button>
                  </div>
                  {analyzingLoading ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-5 h-5 animate-spin mx-auto mb-2 text-[var(--accent)]" />
                      <p className="text-xs text-[var(--text-muted)]">Analyzing feedback...</p>
                    </div>
                  ) : analysis ? (
                    <div className="space-y-3 text-xs">
                      <p className="text-[var(--text-default)]">{analysis.summary as string}</p>
                      {(analysis.topIssues as string[])?.length > 0 && (
                        <div>
                          <p className="font-semibold text-[var(--error)] mb-1">Top Issues</p>
                          <ul className="space-y-0.5 text-[var(--text-muted)]">
                            {(analysis.topIssues as string[]).map((t, i) => <li key={i}>• {t}</li>)}
                          </ul>
                        </div>
                      )}
                      {(analysis.topRequests as string[])?.length > 0 && (
                        <div>
                          <p className="font-semibold text-[var(--warning)] mb-1">Top Requests</p>
                          <ul className="space-y-0.5 text-[var(--text-muted)]">
                            {(analysis.topRequests as string[]).map((t, i) => <li key={i}>• {t}</li>)}
                          </ul>
                        </div>
                      )}
                      {(analysis.recommendations as string[])?.length > 0 && (
                        <div>
                          <p className="font-semibold text-[var(--accent)] mb-1">Recommendations</p>
                          <ul className="space-y-0.5 text-[var(--text-muted)]">
                            {(analysis.recommendations as string[]).map((t, i) => <li key={i}>• {t}</li>)}
                          </ul>
                        </div>
                      )}
                    </div>
                  ) : (
                    <p className="text-xs text-[var(--text-muted)] text-center py-4">No feedback to analyze yet</p>
                  )}
                </div>
              </div>
            )}

            {/* Messages */}
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex gap-2 ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  {msg.role !== "user" && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5"
                      style={{ background: msg.role === "system" ? "var(--info-muted)" : "var(--accent-muted)" }}>
                      <Bot className="w-3.5 h-3.5" style={{ color: msg.role === "system" ? "var(--info)" : "var(--accent)" }} />
                    </div>
                  )}
                  <div
                    className={`max-w-[80%] px-3 py-2 rounded-xl text-sm ${
                      msg.role === "user"
                        ? "bg-[var(--accent)] text-black"
                        : msg.role === "system"
                        ? "bg-[var(--info-muted)] text-[var(--text-default)]"
                        : "glass-card-static text-[var(--text-default)]"
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{msg.text}</p>
                    {msg.data && msg.role === "assistant" && (
                      <div className="mt-2 pt-2 flex flex-wrap gap-1.5" style={{ borderTop: "1px solid var(--glass-border)" }}>
                        {msg.data.type ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--glass-bg-hover)] font-medium">
                            {String(msg.data.type)}
                          </span>
                        ) : null}
                        {msg.data.priority ? (
                          <span className={`text-[10px] px-1.5 py-0.5 rounded-md font-bold ${
                            String(msg.data.priority) === "P0" ? "bg-[var(--error-muted)] text-[var(--error)]" :
                            String(msg.data.priority) === "P1" ? "bg-[var(--warning-muted)] text-[var(--warning)]" :
                            "bg-[var(--glass-bg-hover)]"
                          }`}>
                            {String(msg.data.priority)}
                          </span>
                        ) : null}
                        {msg.data.component ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--glass-bg-hover)]">
                            {String(msg.data.component)}
                          </span>
                        ) : null}
                        {msg.data.model ? (
                          <span className="text-[10px] px-1.5 py-0.5 rounded-md bg-[var(--glass-bg-hover)] text-[var(--text-ghost)] ml-auto">
                            via {String(msg.data.model)}
                          </span>
                        ) : null}
                      </div>
                    )}
                    {msg.data?.url ? (
                      <a
                        href={String(msg.data.url)}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-1 mt-1 text-[10px] text-[var(--info)] hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        View on GitHub
                      </a>
                    ) : null}
                  </div>
                  {msg.role === "user" && (
                    <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 bg-[var(--glass-bg-hover)]">
                      <User className="w-3.5 h-3.5 text-[var(--text-muted)]" />
                    </div>
                  )}
                </div>
              ))}
              {loading && (
                <div className="flex gap-2">
                  <div className="w-6 h-6 rounded-full flex items-center justify-center flex-shrink-0" style={{ background: "var(--accent-muted)" }}>
                    <Bot className="w-3.5 h-3.5 text-[var(--accent)]" />
                  </div>
                  <div className="glass-card-static px-3 py-2 rounded-xl">
                    <Loader2 className="w-4 h-4 animate-spin text-[var(--text-ghost)]" />
                  </div>
                </div>
              )}
            </div>

            {/* Rating + Input */}
            <div className="flex-shrink-0 p-3" style={{ borderTop: "1px solid var(--glass-border)" }}>
              {/* Optional rating */}
              <div className="flex items-center gap-1 mb-2 px-1">
                <span className="text-[10px] text-[var(--text-ghost)] mr-1">Rate:</span>
                {[1, 2, 3, 4, 5].map((n) => (
                  <button key={n} onClick={() => setRating(rating === n ? 0 : n)} className="transition-transform hover:scale-110">
                    <Star className="w-3.5 h-3.5" fill={n <= rating ? "var(--warning)" : "none"} stroke={n <= rating ? "var(--warning)" : "var(--text-ghost)"} />
                  </button>
                ))}
              </div>
              <div className="flex gap-2">
                <input
                  ref={inputRef}
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                  placeholder="Describe a bug, request a feature, or share thoughts..."
                  disabled={loading}
                  className="flex-1 px-3 py-2 rounded-xl text-sm
                    text-[var(--text-default)] placeholder:text-[var(--text-ghost)]
                    focus:outline-none focus:ring-1 focus:ring-[var(--accent-muted)]
                    disabled:opacity-50 transition-all"
                  style={{ background: "var(--bg-base)", border: "1px solid var(--glass-border)" }}
                />
                <button
                  onClick={handleSend}
                  disabled={loading || !input.trim()}
                  className="p-2 rounded-xl bg-[var(--accent)] text-black hover:bg-[var(--accent-hover)]
                    disabled:opacity-30 disabled:cursor-not-allowed transition-all"
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}
