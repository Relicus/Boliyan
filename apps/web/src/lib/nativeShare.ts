import { NativeBridgeMethod } from '../../../../packages/shared/nativeBridge';
import { isNativeBridgeAvailable, requestNative } from './nativeBridge';

export type SharePayload = {
  title?: string;
  message?: string;
  url?: string;
};

type NavigatorShare = {
  share: (data: { title?: string; text?: string; url?: string }) => Promise<void>;
};

export async function shareContent(payload: SharePayload): Promise<boolean> {
  if (isNativeBridgeAvailable()) {
    const result = await requestNative(NativeBridgeMethod.Share, payload);
    return Boolean(result?.ok);
  }

  if (typeof navigator !== 'undefined' && 'share' in navigator) {
    const navigatorShare = navigator as Navigator & NavigatorShare;
    await navigatorShare.share({
      title: payload.title,
      text: payload.message,
      url: payload.url
    });
    return true;
  }

  return false;
}
