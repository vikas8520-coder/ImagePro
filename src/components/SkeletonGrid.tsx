"use client";

export function SkeletonCard() {
  return (
    <div className="glass-card-static overflow-hidden" aria-hidden="true">
      <div className="aspect-square skeleton" />
      <div className="p-3 space-y-2">
        <div className="skeleton h-3 w-3/4" />
        <div className="skeleton h-2.5 w-1/2" />
      </div>
    </div>
  );
}

export default function SkeletonGrid() {
  return (
    <div
      className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
      aria-label="Loading media..."
      role="progressbar"
    >
      {Array.from({ length: 12 }).map((_, i) => (
        <SkeletonCard key={i} />
      ))}
    </div>
  );
}
