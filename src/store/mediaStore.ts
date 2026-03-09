import { create } from "zustand";
import { persist } from "zustand/middleware";
import {
  MediaItem,
  FilterTab,
  SortField,
  SortDirection,
  ViewMode,
  PostType,
  CropRatio,
} from "@/types/media";

interface MediaStore {
  // Media library
  items: MediaItem[];
  selectedIds: Set<string>;
  editingId: string | null;

  // Filters & view
  activeFilter: FilterTab;
  searchQuery: string;
  sortField: SortField;
  sortDirection: SortDirection;
  viewMode: ViewMode;

  // Import state
  isImporting: boolean;
  importProgress: { processed: number; total: number } | null;

  // Actions
  addItems: (items: MediaItem[]) => void;
  removeItems: (ids: string[]) => void;
  clearAll: () => void;

  toggleSelection: (id: string) => void;
  selectAll: () => void;
  clearSelection: () => void;
  setEditingId: (id: string | null) => void;

  setFilter: (filter: FilterTab) => void;
  setSearchQuery: (query: string) => void;
  setSortField: (field: SortField) => void;
  toggleSortDirection: () => void;
  setViewMode: (mode: ViewMode) => void;

  setImporting: (importing: boolean) => void;
  setImportProgress: (progress: { processed: number; total: number } | null) => void;

  updateItem: (id: string, updates: Partial<MediaItem>) => void;
  batchUpdateItems: (ids: string[], updates: Partial<MediaItem>) => void;
  markReady: (id: string) => void;
  unmarkReady: (id: string) => void;
  batchMarkReady: (ids: string[]) => void;
  reorderItems: (activeId: string, overId: string) => void;

  // Computed
  getFilteredItems: () => MediaItem[];
  getReadyItems: () => MediaItem[];
  getStats: () => {
    total: number;
    photos: number;
    videos: number;
    ready: number;
    totalSize: number;
  };
}

export const useMediaStore = create<MediaStore>()(
  persist(
    (set, get) => ({
      items: [],
      selectedIds: new Set(),
      editingId: null,

      activeFilter: "all",
      searchQuery: "",
      sortField: "date",
      sortDirection: "desc",
      viewMode: "grid",

      isImporting: false,
      importProgress: null,

      addItems: (newItems) =>
        set((state) => {
          // Auto-merge: if a persisted item matches by name+size, restore its metadata
          const merged: MediaItem[] = [];
          for (const newItem of newItems) {
            const existing = state.items.find(
              (i) => i.needsReimport && i.name === newItem.name && i.size === newItem.size
            );
            if (existing) {
              merged.push({
                ...newItem,
                caption: existing.caption,
                hashtags: existing.hashtags,
                cropRatio: existing.cropRatio,
                cropData: existing.cropData,
                postType: existing.postType,
                isReady: existing.isReady,
                needsReimport: false,
              });
            } else {
              merged.push(newItem);
            }
          }
          // Remove matched persisted items, add merged
          const matchedNames = new Set(
            merged.filter((m) => !m.needsReimport).map((m) => `${m.name}:${m.size}`)
          );
          const remaining = state.items.filter(
            (i) => !(i.needsReimport && matchedNames.has(`${i.name}:${i.size}`))
          );
          return { items: [...remaining, ...merged] };
        }),

      removeItems: (ids) =>
        set((state) => {
          const idSet = new Set(ids);
          const removed = state.items.filter((item) => idSet.has(item.id));
          removed.forEach((item) => {
            if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
          });
          const newSelected = new Set(state.selectedIds);
          ids.forEach((id) => newSelected.delete(id));
          return {
            items: state.items.filter((item) => !idSet.has(item.id)),
            selectedIds: newSelected,
            editingId: state.editingId && idSet.has(state.editingId) ? null : state.editingId,
          };
        }),

      clearAll: () =>
        set((state) => {
          state.items.forEach((item) => {
            if (item.objectUrl) URL.revokeObjectURL(item.objectUrl);
          });
          return { items: [], selectedIds: new Set(), editingId: null };
        }),

      toggleSelection: (id) =>
        set((state) => {
          const newSelected = new Set(state.selectedIds);
          if (newSelected.has(id)) newSelected.delete(id);
          else newSelected.add(id);
          return { selectedIds: newSelected };
        }),

      selectAll: () =>
        set(() => ({
          selectedIds: new Set(get().getFilteredItems().map((item) => item.id)),
        })),

      clearSelection: () => set({ selectedIds: new Set() }),

      setEditingId: (id) => set({ editingId: id }),

      setFilter: (filter) => set({ activeFilter: filter }),
      setSearchQuery: (query) => set({ searchQuery: query }),
      setSortField: (field) => set({ sortField: field }),
      toggleSortDirection: () =>
        set((state) => ({
          sortDirection: state.sortDirection === "asc" ? "desc" : "asc",
        })),
      setViewMode: (mode) => set({ viewMode: mode }),

      setImporting: (importing) => set({ isImporting: importing }),
      setImportProgress: (progress) => set({ importProgress: progress }),

      updateItem: (id, updates) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, ...updates } : item
          ),
        })),

      batchUpdateItems: (ids, updates) =>
        set((state) => {
          const idSet = new Set(ids);
          return {
            items: state.items.map((item) =>
              idSet.has(item.id) ? { ...item, ...updates } : item
            ),
          };
        }),

      markReady: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isReady: true } : item
          ),
        })),

      unmarkReady: (id) =>
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isReady: false } : item
          ),
        })),

      batchMarkReady: (ids) =>
        set((state) => {
          const idSet = new Set(ids);
          return {
            items: state.items.map((item) =>
              idSet.has(item.id) ? { ...item, isReady: true } : item
            ),
          };
        }),

      reorderItems: (activeId, overId) =>
        set((state) => {
          const oldIndex = state.items.findIndex((i) => i.id === activeId);
          const newIndex = state.items.findIndex((i) => i.id === overId);
          if (oldIndex === -1 || newIndex === -1) return state;
          const newItems = [...state.items];
          const [moved] = newItems.splice(oldIndex, 1);
          newItems.splice(newIndex, 0, moved);
          return { items: newItems };
        }),

      getFilteredItems: () => {
        const { items, activeFilter, searchQuery, sortField, sortDirection } = get();

        let filtered = items;

        switch (activeFilter) {
          case "photos":
            filtered = filtered.filter((i) => i.type === "photo");
            break;
          case "videos":
            filtered = filtered.filter((i) => i.type === "video");
            break;
          case "portrait":
            filtered = filtered.filter((i) => i.orientation === "portrait");
            break;
          case "landscape":
            filtered = filtered.filter((i) => i.orientation === "landscape");
            break;
          case "square":
            filtered = filtered.filter((i) => i.orientation === "square");
            break;
          case "ready":
            filtered = filtered.filter((i) => i.isReady);
            break;
        }

        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          filtered = filtered.filter((i) => i.name.toLowerCase().includes(q));
        }

        const dir = sortDirection === "asc" ? 1 : -1;
        filtered = [...filtered].sort((a, b) => {
          switch (sortField) {
            case "name":
              return dir * a.name.localeCompare(b.name);
            case "size":
              return dir * (a.size - b.size);
            case "type":
              return dir * a.type.localeCompare(b.type);
            case "date":
              return dir * (a.addedAt - b.addedAt);
            default:
              return 0;
          }
        });

        return filtered;
      },

      getReadyItems: () => get().items.filter((i) => i.isReady),

      getStats: () => {
        const { items } = get();
        return {
          total: items.length,
          photos: items.filter((i) => i.type === "photo").length,
          videos: items.filter((i) => i.type === "video").length,
          ready: items.filter((i) => i.isReady).length,
          totalSize: items.reduce((sum, i) => sum + i.size, 0),
        };
      },
    }),
    {
      name: "imagepro-media-store",
      version: 1,
      partialize: (state) => ({
        items: state.items.map(({ file, objectUrl, ...rest }) => ({
          ...rest,
          needsReimport: true,
        })),
        viewMode: state.viewMode,
        sortField: state.sortField,
        sortDirection: state.sortDirection,
      }),
      merge: (persisted, current) => ({
        ...current,
        ...(persisted as Partial<MediaStore>),
        selectedIds: new Set(),
        editingId: null,
        isImporting: false,
        importProgress: null,
      }),
    }
  )
);
