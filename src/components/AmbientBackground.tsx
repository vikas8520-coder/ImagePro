"use client";

import { useMediaStore } from "@/store/mediaStore";

type Phase = "empty" | "import" | "curate" | "ready";

function getPhase(total: number, ready: number, isImporting: boolean): Phase {
  if (isImporting) return "import";
  if (total === 0) return "empty";
  if (ready > 0 && ready >= total * 0.5) return "ready";
  return "curate";
}

export default function AmbientBackground() {
  const isImporting = useMediaStore((s) => s.isImporting);
  const total = useMediaStore((s) => s.items.length);
  const ready = useMediaStore((s) => s.items.filter((i) => i.isReady).length);
  const phase = getPhase(total, ready, isImporting);

  return (
    <div
      className={`fixed inset-0 pointer-events-none z-0 ambient-${phase}`}
      aria-hidden="true"
    >
      <div
        className="ambient-orb ambient-orb-1"
        style={{
          width: "600px",
          height: "600px",
          top: "-10%",
          right: "-5%",
        }}
      />
      <div
        className="ambient-orb ambient-orb-2"
        style={{
          width: "500px",
          height: "500px",
          bottom: "-15%",
          left: "-10%",
        }}
      />
    </div>
  );
}
