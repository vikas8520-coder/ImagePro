import { CropData, MediaItem } from "@/types/media";

export function cropImageToBlob(
  imageSrc: string,
  cropData: CropData,
  displayWidth: number,
  displayHeight: number,
  naturalWidth: number,
  naturalHeight: number,
): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      // Scale crop coordinates from display size to natural size
      const scaleX = naturalWidth / displayWidth;
      const scaleY = naturalHeight / displayHeight;

      const sx = cropData.x * scaleX;
      const sy = cropData.y * scaleY;
      const sw = cropData.width * scaleX;
      const sh = cropData.height * scaleY;

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      canvas.toBlob(
        (blob) => {
          if (blob) resolve(blob);
          else reject(new Error("Canvas toBlob failed"));
        },
        "image/jpeg",
        0.92
      );
    };
    img.onerror = reject;
    img.src = imageSrc;
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  a.click();
  URL.revokeObjectURL(url);
}

export async function downloadCroppedImage(item: MediaItem) {
  if (!item.objectUrl || !item.cropData) return;

  const blob = await cropImageToBlob(
    item.objectUrl,
    item.cropData,
    item.cropData.width / (item.cropData.width / item.cropData.width), // will be set from actual display
    item.cropData.height / (item.cropData.height / item.cropData.height),
    item.width,
    item.height,
  );

  const baseName = item.name.replace(/\.[^.]+$/, "");
  downloadBlob(blob, `${baseName}-cropped.jpg`);
}

export async function downloadOriginalImage(item: MediaItem) {
  if (!item.objectUrl) return;
  const a = document.createElement("a");
  a.href = item.objectUrl;
  a.download = item.name;
  a.click();
}

export async function batchDownloadCropped(items: MediaItem[]) {
  for (const item of items) {
    if (!item.objectUrl) continue;

    if (item.cropData) {
      // For cropped items, we need to use natural dimensions directly
      // since cropData is stored in display pixels
      const blob = await cropImageToCanvas(item);
      if (blob) {
        const baseName = item.name.replace(/\.[^.]+$/, "");
        downloadBlob(blob, `${baseName}-cropped.jpg`);
      }
    } else {
      // No crop — download original
      const a = document.createElement("a");
      a.href = item.objectUrl;
      a.download = item.name;
      a.click();
    }

    // Small delay between downloads to avoid browser blocking
    await new Promise((r) => setTimeout(r, 300));
  }
}

export function cropImageToCanvas(item: MediaItem): Promise<Blob | null> {
  return new Promise((resolve) => {
    if (!item.objectUrl || !item.cropData) {
      resolve(null);
      return;
    }

    const img = new Image();
    img.onload = () => {
      const cropData = item.cropData!;

      // cropData is stored as percentage-based values
      let sx: number, sy: number, sw: number, sh: number;

      if (cropData.unit === "%") {
        sx = (cropData.x / 100) * img.naturalWidth;
        sy = (cropData.y / 100) * img.naturalHeight;
        sw = (cropData.width / 100) * img.naturalWidth;
        sh = (cropData.height / 100) * img.naturalHeight;
      } else {
        // px values are relative to the displayed image, need to scale
        // Since we don't know display size at download time, store as %
        sx = cropData.x;
        sy = cropData.y;
        sw = cropData.width;
        sh = cropData.height;
      }

      const canvas = document.createElement("canvas");
      canvas.width = sw;
      canvas.height = sh;

      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, sx, sy, sw, sh, 0, 0, sw, sh);

      canvas.toBlob(
        (blob) => resolve(blob),
        "image/jpeg",
        0.92
      );
    };
    img.onerror = () => resolve(null);
    img.src = item.objectUrl!;
  });
}
