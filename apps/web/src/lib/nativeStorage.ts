import {
  NativeBridgeMethod
} from '../../../../packages/shared/nativeBridge';
import { requestNative } from './nativeBridge';

export function createNativeBackedStorage(): Storage {
  return {
    getItem: (key: string) => {
      return window.localStorage.getItem(key);
    },
    setItem: (key: string, value: string) => {
      window.localStorage.setItem(key, value);
      void requestNative(NativeBridgeMethod.SecureStorageSet, { key, value });
    },
    removeItem: (key: string) => {
      window.localStorage.removeItem(key);
      void requestNative(NativeBridgeMethod.SecureStorageRemove, { key });
    },
    key: (index: number) => window.localStorage.key(index),
    clear: () => {
      window.localStorage.clear();
    },
    get length() {
      return window.localStorage.length;
    }
  };
}

export async function hydrateStorageFromNative(key: string): Promise<void> {
  if (typeof window === 'undefined') {
    return;
  }

  const existing = window.localStorage.getItem(key);
  if (existing) {
    return;
  }

  const result = await requestNative(NativeBridgeMethod.SecureStorageGet, { key });
  if (result?.ok && result.value) {
    window.localStorage.setItem(key, result.value);
  }
}
