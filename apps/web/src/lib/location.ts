/**
 * Unified Location Service
 * 
 * Uses native GPS when running in the mobile app (via native bridge),
 * falls back to browser's navigator.geolocation on web.
 */

import { NativeBridgeMethod } from '../../../../packages/shared/nativeBridge';
import { isNativeBridgeAvailable, requestNative } from './nativeBridge';

export interface LocationResult {
  lat: number;
  lng: number;
  accuracy: number | null;
  source: 'native-gps' | 'native-network' | 'browser';
}

export interface LocationError {
  code: 'permission_denied' | 'unavailable' | 'timeout' | 'unknown';
  message: string;
}

export type LocationOptions = {
  /** Request high-accuracy GPS (slower, more battery) */
  highAccuracy?: boolean;
  /** Timeout in milliseconds (default 10s) */
  timeout?: number;
};

/**
 * Check if we're running inside the mobile app with native location available
 */
export function isNativeLocationAvailable(): boolean {
  return isNativeBridgeAvailable();
}

/**
 * Get current location using native GPS (if available) or browser geolocation
 */
export async function getCurrentLocation(
  options: LocationOptions = {}
): Promise<LocationResult> {
  const { highAccuracy = false, timeout = 10000 } = options;

  // Try native bridge first (mobile app)
  if (isNativeBridgeAvailable()) {
    try {
      // Add timeout to native request to prevent hanging
      const nativePromise = requestNative(NativeBridgeMethod.GetLocation, { highAccuracy });
      const timeoutPromise = new Promise<null>((_, reject) => 
        setTimeout(() => reject(new Error('Native location timeout')), timeout)
      );
      
      const result = await Promise.race([nativePromise, timeoutPromise]);
      
      if (result) {
        return {
          lat: result.lat,
          lng: result.lng,
          accuracy: result.accuracy,
          source: result.source === 'gps' ? 'native-gps' : 'native-network'
        };
      }
    } catch (err) {
      console.warn('[Location] Native location failed, falling back to browser:', err);
    }
  } else {
    console.log('[Location] Native bridge not available, using browser geolocation');
  }

  // Fallback to browser geolocation
  return getBrowserLocation({ highAccuracy, timeout });
}

/**
 * Get location using browser's navigator.geolocation API
 */
function getBrowserLocation(options: LocationOptions): Promise<LocationResult> {
  return new Promise((resolve, reject) => {
    if (!('geolocation' in navigator)) {
      reject({
        code: 'unavailable',
        message: 'Geolocation is not supported by this browser'
      } as LocationError);
      return;
    }

    navigator.geolocation.getCurrentPosition(
      (position) => {
        resolve({
          lat: position.coords.latitude,
          lng: position.coords.longitude,
          accuracy: position.coords.accuracy,
          source: 'browser'
        });
      },
      (error) => {
        let errorCode: LocationError['code'] = 'unknown';
        let message = error.message;

        switch (error.code) {
          case error.PERMISSION_DENIED:
            errorCode = 'permission_denied';
            message = 'Location permission denied';
            break;
          case error.POSITION_UNAVAILABLE:
            errorCode = 'unavailable';
            message = 'Location information unavailable';
            break;
          case error.TIMEOUT:
            errorCode = 'timeout';
            message = 'Location request timed out';
            break;
        }

        reject({ code: errorCode, message } as LocationError);
      },
      {
        enableHighAccuracy: options.highAccuracy ?? false,
        timeout: options.timeout ?? 10000,
        maximumAge: 60000 // Accept cached position up to 1 minute old
      }
    );
  });
}
