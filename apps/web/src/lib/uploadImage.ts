import { LISTING_IMAGE_UPLOAD_MIME_TYPES, isAllowedListingImageUpload } from "@/lib/constants";

export async function uploadListingImage(file: File): Promise<string> {
  if (!isAllowedListingImageUpload(file)) {
    throw new Error(`Unsupported image type. Allowed: ${LISTING_IMAGE_UPLOAD_MIME_TYPES.join(", ")}`);
  }
  const response = await fetch("/api/upload-url", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      fileName: file.name,
      contentType: file.type,
    }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.error || "Failed to get upload URL");
  }

  const payload = await response.json();
  const uploadUrl = payload?.uploadUrl as string | undefined;
  const objectKey = payload?.objectKey as string | undefined;

  if (!uploadUrl || !objectKey) {
    throw new Error("Upload URL response invalid");
  }

  const uploadResponse = await fetch(uploadUrl, {
    method: "PUT",
    headers: {
      "Content-Type": file.type,
    },
    body: file,
  });

  if (!uploadResponse.ok) {
    throw new Error("Upload failed");
  }

  return objectKey;
}
