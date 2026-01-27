import {
  LISTING_IMAGE_MAX_BYTES,
  LISTING_IMAGE_MAX_DIMENSION,
  LISTING_IMAGE_OUTPUT_MIME,
  LISTING_IMAGE_WEBP_MIN_QUALITY,
  LISTING_IMAGE_WEBP_QUALITY
} from "@/lib/constants";
import heic2any from "heic2any";
import { encode } from "@jsquash/webp";

type LoadedImage = {
  width: number;
  height: number;
  source: ImageBitmap | HTMLImageElement;
};

const HEIC_MIME_TYPES = new Set(["image/heic", "image/heif"]);

const normalizeHeic = async (file: File) => {
  const result = await heic2any({
    blob: file,
    toType: "image/jpeg",
    quality: 1
  });
  const blob = Array.isArray(result) ? result[0] : result;
  return new File([blob], file.name.replace(/\.[^/.]+$/, "") + ".jpg", {
    type: "image/jpeg",
    lastModified: Date.now()
  });
};

const loadImageFromFile = async (file: File): Promise<LoadedImage> => {
  const normalizedFile = HEIC_MIME_TYPES.has(file.type.toLowerCase())
    ? await normalizeHeic(file)
    : file;

  if ("createImageBitmap" in window) {
    const source = await createImageBitmap(normalizedFile);
    return { width: source.width, height: source.height, source };
  }

  const url = URL.createObjectURL(normalizedFile);
  try {
    const img = await new Promise<HTMLImageElement>((resolve, reject) => {
      const image = new Image();
      image.onload = () => resolve(image);
      image.onerror = () => reject(new Error("Image decode failed"));
      image.src = url;
    });
    return { width: img.naturalWidth, height: img.naturalHeight, source: img };
  } finally {
    URL.revokeObjectURL(url);
  }
};

const canvasToWebpBlob = async (canvas: HTMLCanvasElement, quality: number) => {
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing unavailable");
  const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
  const buffer = await encode(imageData, {
    quality: Math.round(quality * 100)
  });
  return new Blob([buffer], { type: LISTING_IMAGE_OUTPUT_MIME });
};

export const processListingImage = async (file: File): Promise<File> => {
  const { width, height, source } = await loadImageFromFile(file);
  const maxDimension = Math.max(width, height);
  const scale = maxDimension > LISTING_IMAGE_MAX_DIMENSION
    ? LISTING_IMAGE_MAX_DIMENSION / maxDimension
    : 1;
  const targetWidth = Math.max(1, Math.round(width * scale));
  const targetHeight = Math.max(1, Math.round(height * scale));

  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Image processing unavailable");

  ctx.drawImage(source, 0, 0, targetWidth, targetHeight);
  if (source instanceof ImageBitmap) {
    source.close();
  }

  let quality = LISTING_IMAGE_WEBP_QUALITY;
  let blob = await canvasToWebpBlob(canvas, quality);

  while (blob.size > LISTING_IMAGE_MAX_BYTES && quality > LISTING_IMAGE_WEBP_MIN_QUALITY) {
    quality = Math.max(LISTING_IMAGE_WEBP_MIN_QUALITY, Number((quality - 0.06).toFixed(2)));
    blob = await canvasToWebpBlob(canvas, quality);
  }

  if (blob.size > LISTING_IMAGE_MAX_BYTES) {
    throw new Error("Image exceeds 1MB after compression");
  }

  const baseName = file.name.replace(/\.[^/.]+$/, "");
  const processedName = `${baseName || "listing"}.webp`;
  return new File([blob], processedName, { type: LISTING_IMAGE_OUTPUT_MIME, lastModified: Date.now() });
};
