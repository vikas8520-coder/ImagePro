export type MediaType = "photo" | "video";
export type Orientation = "portrait" | "landscape" | "square";
export type PostType = "feed" | "story" | "reel" | "carousel";
export type CropRatio = "1:1" | "4:5" | "16:9" | "9:16";

export interface CropData {
  x: number;
  y: number;
  width: number;
  height: number;
  unit: "px" | "%";
}

export interface MediaItem {
  id: string;
  file?: File;
  name: string;
  size: number;
  type: MediaType;
  mimeType: string;
  width: number;
  height: number;
  orientation: Orientation;
  thumbnailUrl: string;
  objectUrl?: string;
  needsReimport?: boolean;
  // Post preparation
  postType?: PostType;
  cropRatio?: CropRatio;
  cropData?: CropData;
  caption?: string;
  hashtags?: string;
  isReady: boolean;
  // Timestamps
  addedAt: number;
}

export type FilterTab =
  | "all"
  | "photos"
  | "videos"
  | "portrait"
  | "landscape"
  | "square"
  | "ready";

export type SortField = "name" | "size" | "type" | "date";
export type SortDirection = "asc" | "desc";
export type ViewMode = "grid" | "list";
