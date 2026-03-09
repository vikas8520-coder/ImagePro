import { MediaItem, MediaType, Orientation } from "@/types/media";

let idCounter = 0;

function generateId(): string {
  return `media_${Date.now()}_${idCounter++}`;
}

function getMediaType(file: File): MediaType {
  return file.type.startsWith("video/") ? "video" : "photo";
}

function getOrientation(width: number, height: number): Orientation {
  const ratio = width / height;
  if (ratio > 1.05) return "landscape";
  if (ratio < 0.95) return "square";
  return "portrait";
}

function generateImageThumbnail(
  file: File,
  maxSize: number = 300
): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    const objectUrl = URL.createObjectURL(file);

    img.onload = () => {
      const { width, height } = img;
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / width, maxSize / height, 1);
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(objectUrl);
      resolve({ thumbnailUrl, width, height });
    };

    img.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load image: ${file.name}`));
    };

    img.src = objectUrl;
  });
}

function generateVideoThumbnail(
  file: File,
  maxSize: number = 300
): Promise<{ thumbnailUrl: string; width: number; height: number }> {
  return new Promise((resolve, reject) => {
    const video = document.createElement("video");
    const objectUrl = URL.createObjectURL(file);

    video.onloadedmetadata = () => {
      video.currentTime = Math.min(1, video.duration / 4);
    };

    video.onseeked = () => {
      const { videoWidth: width, videoHeight: height } = video;
      const canvas = document.createElement("canvas");
      const scale = Math.min(maxSize / width, maxSize / height, 1);
      canvas.width = width * scale;
      canvas.height = height * scale;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(video, 0, 0, canvas.width, canvas.height);

      const thumbnailUrl = canvas.toDataURL("image/jpeg", 0.7);
      URL.revokeObjectURL(objectUrl);
      resolve({ thumbnailUrl, width, height });
    };

    video.onerror = () => {
      URL.revokeObjectURL(objectUrl);
      reject(new Error(`Failed to load video: ${file.name}`));
    };

    video.preload = "metadata";
    video.src = objectUrl;
  });
}

export async function processFile(file: File): Promise<MediaItem> {
  const mediaType = getMediaType(file);
  const objectUrl = URL.createObjectURL(file);

  let thumbnailUrl: string;
  let width: number;
  let height: number;

  if (mediaType === "photo") {
    const result = await generateImageThumbnail(file);
    thumbnailUrl = result.thumbnailUrl;
    width = result.width;
    height = result.height;
  } else {
    const result = await generateVideoThumbnail(file);
    thumbnailUrl = result.thumbnailUrl;
    width = result.width;
    height = result.height;
  }

  return {
    id: generateId(),
    file,
    name: file.name,
    size: file.size,
    type: mediaType,
    mimeType: file.type,
    width,
    height,
    orientation: getOrientation(width, height),
    thumbnailUrl,
    objectUrl,
    isReady: false,
    addedAt: Date.now(),
  };
}

export async function processFiles(
  files: File[],
  onProgress?: (processed: number, total: number) => void
): Promise<MediaItem[]> {
  const mediaFiles = files.filter(
    (f) => f.type.startsWith("image/") || f.type.startsWith("video/")
  );
  const results: MediaItem[] = [];
  const BATCH_SIZE = 10;

  for (let i = 0; i < mediaFiles.length; i += BATCH_SIZE) {
    const batch = mediaFiles.slice(i, i + BATCH_SIZE);
    const batchResults = await Promise.allSettled(batch.map(processFile));

    for (const result of batchResults) {
      if (result.status === "fulfilled") {
        results.push(result.value);
      }
    }

    onProgress?.(Math.min(i + BATCH_SIZE, mediaFiles.length), mediaFiles.length);

    // Yield to browser between batches
    await new Promise((r) => setTimeout(r, 0));
  }

  return results;
}

export function formatFileSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  if (bytes < 1024 * 1024 * 1024)
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
  return `${(bytes / (1024 * 1024 * 1024)).toFixed(2)} GB`;
}
