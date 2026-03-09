"use client";

import { motion } from "framer-motion";
import { Camera, Sparkles, Zap } from "lucide-react";
import { useMediaStore } from "@/store/mediaStore";
import AmbientBackground from "@/components/AmbientBackground";
import Sidebar from "@/components/Sidebar";
import Header from "@/components/Header";
import CommandPalette from "@/components/CommandPalette";
import DropZone from "@/components/DropZone";
import FilterBar from "@/components/FilterBar";
import MediaGrid from "@/components/MediaGrid";
import PostEditor from "@/components/PostEditor";
import NextAction from "@/components/NextAction";

export default function Home() {
  const { items, editingId } = useMediaStore();
  const hasMedia = items.length > 0;

  return (
    <div className="min-h-screen relative" style={{ background: "var(--bg-base)" }}>
      {/* B1: Ambient background orbs */}
      <AmbientBackground />

      {/* A3: Command palette */}
      <CommandPalette />

      {/* A4: Persistent sidebar */}
      <Sidebar />

      {/* Main content area — offset by sidebar */}
      <div className="pl-[60px] lg:pl-[220px] transition-all duration-300 relative z-10">
        <Header />

        <main className="max-w-[1600px] mx-auto px-6 py-6" role="main">
          {!hasMedia ? (
            /* C5: Motivational empty state */
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, ease: [0.4, 0, 0.2, 1] }}
              className="max-w-2xl mx-auto mt-16"
            >
              {/* Hero */}
              <div className="text-center mb-10">
                <motion.div
                  initial={{ scale: 0.8, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1, duration: 0.4 }}
                  className="w-16 h-16 rounded-2xl mx-auto mb-6 flex items-center justify-center"
                  style={{ background: "var(--accent-muted)" }}
                >
                  <Camera className="w-8 h-8" style={{ color: "var(--accent)" }} />
                </motion.div>
                <h2 className="text-3xl font-bold text-[var(--text-strong)] mb-3 tracking-tight">
                  Your next post starts here
                </h2>
                <p className="text-[var(--text-muted)] text-base max-w-md mx-auto">
                  Import your photos and videos. ImagePro auto-detects types,
                  orientations, and gets your Instagram posts ready.
                </p>
              </div>

              {/* Drop zone */}
              <DropZone />

              {/* Feature hints */}
              <div className="grid grid-cols-3 gap-4 mt-8">
                {[
                  {
                    icon: Sparkles,
                    title: "Auto-Categorize",
                    desc: "Photos, videos, orientations detected instantly",
                  },
                  {
                    icon: Camera,
                    title: "Instagram-Ready",
                    desc: "Crop ratios, captions, hashtags — all in one place",
                  },
                  {
                    icon: Zap,
                    title: "Batch Processing",
                    desc: "Handle 400+ files at once, up to 10GB",
                  },
                ].map(({ icon: Icon, title, desc }) => (
                  <div key={title} className="glass-card p-4 text-center">
                    <Icon
                      className="w-5 h-5 mx-auto mb-2"
                      style={{ color: "var(--accent)" }}
                    />
                    <p className="text-xs font-medium text-[var(--text-default)] mb-1">
                      {title}
                    </p>
                    <p className="text-[10px] text-[var(--text-faint)] leading-relaxed">
                      {desc}
                    </p>
                  </div>
                ))}
              </div>

              {/* Keyboard hint */}
              <p className="text-center text-[10px] text-[var(--text-ghost)] mt-6">
                Press{" "}
                <kbd className="font-mono bg-[var(--kbd-bg)] px-1.5 py-0.5 rounded">
                  ⌘K
                </kbd>{" "}
                anytime to open the command palette
              </p>
            </motion.div>
          ) : (
            /* Workspace */
            <div className="space-y-5">
              {/* B4: Next action suggestion */}
              <NextAction />
              <FilterBar />
              <MediaGrid />
            </div>
          )}
        </main>
      </div>

      {/* Post editor slide-over */}
      {editingId && <PostEditor />}
    </div>
  );
}
