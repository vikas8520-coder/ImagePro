"use client";

import { AnimatePresence } from "framer-motion";
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import {
  SortableContext,
  rectSortingStrategy,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { useMediaStore } from "@/store/mediaStore";
import MediaCard from "./MediaCard";
import MediaListRow from "./MediaListRow";
import SkeletonGrid from "./SkeletonGrid";

export default function MediaGrid() {
  const { getFilteredItems, selectedIds, viewMode, isImporting, reorderItems } =
    useMediaStore();
  const items = getFilteredItems();

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: { distance: 8 },
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    if (over && active.id !== over.id) {
      reorderItems(active.id as string, over.id as string);
    }
  };

  if (isImporting && items.length === 0) {
    return <SkeletonGrid />;
  }

  if (items.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center py-20" role="status">
        <p className="text-sm text-[var(--text-muted)]">No media matches your filter</p>
        <p className="text-xs text-[var(--text-ghost)] mt-1">
          Try adjusting your filters or search query
        </p>
      </div>
    );
  }

  const itemIds = items.map((i) => i.id);

  if (viewMode === "list") {
    return (
      <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
        <SortableContext items={itemIds} strategy={verticalListSortingStrategy}>
          <div className="space-y-1" role="list" aria-label="Media files list">
            <div
              className="grid grid-cols-[auto_auto_1fr_100px_100px_80px_80px_80px] gap-3 px-3 py-2
                text-[10px] text-[var(--text-ghost)] uppercase tracking-wider font-medium"
              aria-hidden="true"
            >
              <div className="w-5" />
              <div className="w-5" />
              <div>Name</div>
              <div>Type</div>
              <div>Orientation</div>
              <div>Size</div>
              <div>Dimensions</div>
              <div>Status</div>
            </div>
            {items.map((item) => (
              <MediaListRow
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
              />
            ))}
          </div>
        </SortableContext>
      </DndContext>
    );
  }

  return (
    <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
      <SortableContext items={itemIds} strategy={rectSortingStrategy}>
        <div
          className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-6 gap-3"
          role="list"
          aria-label="Media files grid"
        >
          <AnimatePresence mode="popLayout">
            {items.map((item) => (
              <MediaCard
                key={item.id}
                item={item}
                isSelected={selectedIds.has(item.id)}
              />
            ))}
          </AnimatePresence>
        </div>
      </SortableContext>
    </DndContext>
  );
}
