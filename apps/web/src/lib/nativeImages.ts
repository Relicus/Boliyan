import type { NativeImageFile } from '../../../../packages/shared/nativeBridge';
import { NativeBridgeMethod } from '../../../../packages/shared/nativeBridge';
import { isNativeBridgeAvailable, requestNative } from './nativeBridge';

const DEFAULT_MIME = 'image/jpeg';
const DEFAULT_EXTENSION = 'jpg';
const DEFAULT_NAME_PREFIX = 'image';
const NATIVE_IMAGE_FETCH_FAILED = 'Native image fetch failed';

const MIME_EXTENSION_MAP: Record<string, string> = {
  'image/jpeg': 'jpg',
  'image/jpg': 'jpg',
  'image/png': 'png',
  'image/webp': 'webp',
  'image/heic': 'heic',
  'image/heif': 'heif'
};

export type NativeImagePickerOptions = {
  allowsMultiple?: boolean;
  quality?: number;
  source?: 'camera' | 'library';
};

export function isNativeImagePickerAvailable(): boolean {
  return isNativeBridgeAvailable();
}

function getExtensionFromMime(mime?: string): string {
  if (!mime) {
    return DEFAULT_EXTENSION;
  }

  return MIME_EXTENSION_MAP[mime] ?? DEFAULT_EXTENSION;
}

async function nativeImageToFile(file: NativeImageFile): Promise<File> {
  const response = await fetch(file.uri);
  if (!response.ok) {
    throw new Error(NATIVE_IMAGE_FETCH_FAILED);
  }

  const blob = await response.blob();
  const mime = file.mime ?? blob.type ?? DEFAULT_MIME;
  const extension = getExtensionFromMime(mime);
  const name = file.name ?? `${DEFAULT_NAME_PREFIX}-${Date.now()}.${extension}`;
  return new File([blob], name, { type: mime });
}

export async function pickNativeImages(
  options: NativeImagePickerOptions = {}
): Promise<File[]> {
  if (!isNativeBridgeAvailable()) {
    return [];
  }

  const result = await requestNative(NativeBridgeMethod.PickImage, options);
  const files = result?.files ?? [];

  if (!files.length) {
    return [];
  }

  return Promise.all(files.map(nativeImageToFile));
}
