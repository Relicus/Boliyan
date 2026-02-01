import type {
  NativeBridge,
  NativeBridgeMethod,
  NativeBridgePayloadMap,
  NativeBridgeResultMap
} from '../../../../packages/shared/nativeBridge';
import {
  NativeBridgeGlobalName,
  NativeBridgeReadyFlag
} from '../../../../packages/shared/nativeBridge';

export const NATIVE_BRIDGE_GLOBAL_NAME = NativeBridgeGlobalName;
export const NATIVE_BRIDGE_READY_FLAG = NativeBridgeReadyFlag;

function getBridgeFromWindow(): NativeBridge | null {
  if (typeof window === 'undefined') {
    return null;
  }

  const maybeBridge = (window as typeof window & {
    [NATIVE_BRIDGE_GLOBAL_NAME]?: NativeBridge;
  })[NATIVE_BRIDGE_GLOBAL_NAME];

  return maybeBridge ?? null;
}

export function isNativeBridgeAvailable(): boolean {
  return getBridgeFromWindow() !== null;
}

export function getNativeBridge(): NativeBridge | null {
  return getBridgeFromWindow();
}

export async function requestNative<T extends NativeBridgeMethod>(
  method: T,
  payload?: NativeBridgePayloadMap[T]
): Promise<NativeBridgeResultMap[T] | null> {
  const bridge = getBridgeFromWindow();

  if (!bridge) {
    console.warn(`[NativeBridge] requestNative called for ${method} but bridge not found on window`);
    return null;
  }

  console.log(`[NativeBridge] Sending request: ${method}`, payload);
  try {
    const result = await bridge[method](payload);
    console.log(`[NativeBridge] Got response for ${method}:`, result);
    return result;
  } catch (err) {
    console.error(`[NativeBridge] Error calling ${method}:`, err);
    throw err;
  }
}
