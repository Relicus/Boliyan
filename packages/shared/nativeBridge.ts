export const NativeBridgeMethod = {
  GetLocation: 'getLocation',
  RequestNotificationPermission: 'requestNotificationPermission',
  GetPushToken: 'getPushToken',
  PickImage: 'pickImage',
  Share: 'share',
  GetNetworkState: 'getNetworkState',
  PlaySound: 'playSound',
  SecureStorageGet: 'secureStorageGet',
  SecureStorageSet: 'secureStorageSet',
  SecureStorageRemove: 'secureStorageRemove'
} as const;

export const NativeBridgeGlobalName = 'BoliyanNativeBridge' as const;
export const NativeBridgeReadyFlag = 'BoliyanNativeReady' as const;

export type NativeBridgeMethod = (typeof NativeBridgeMethod)[keyof typeof NativeBridgeMethod];

export const NativeSoundType = {
  Tap: 'tap',
  Success: 'success',
  Error: 'error'
} as const;

export type NativeSoundType = (typeof NativeSoundType)[keyof typeof NativeSoundType];

export type NativePermissionStatus = 'granted' | 'denied' | 'undetermined';
export type NativePlatform = 'ios' | 'android';

export interface NativeLocationResult {
  lat: number;
  lng: number;
  accuracy: number | null;
  source: 'gps' | 'network';
}

export interface NativeNotificationPermissionResult {
  status: NativePermissionStatus;
}

export interface NativePushTokenResult {
  token: string;
  platform: NativePlatform;
}

export interface NativeImageFile {
  uri: string;
  mime: string;
  size: number | null;
  name?: string;
}

export interface NativeImageResult {
  files: NativeImageFile[];
}

export interface NativeSharePayload {
  title?: string;
  message?: string;
  url?: string;
}

export interface NativeShareResult {
  ok: boolean;
}

export interface NativeNetworkState {
  online: boolean;
  type?: string;
}

export interface NativeSoundResult {
  ok: boolean;
}

export interface NativeSecureStoragePayload {
  key: string;
  value?: string;
}

export interface NativeSecureStorageResult {
  ok: boolean;
  value?: string | null;
}

export type NativeBridgePayloadMap = {
  [NativeBridgeMethod.GetLocation]?: {
    highAccuracy?: boolean;
  };
  [NativeBridgeMethod.RequestNotificationPermission]?: undefined;
  [NativeBridgeMethod.GetPushToken]?: undefined;
  [NativeBridgeMethod.PickImage]?: {
    allowsMultiple?: boolean;
    quality?: number;
    source?: 'camera' | 'library';
  };
  [NativeBridgeMethod.Share]?: NativeSharePayload;
  [NativeBridgeMethod.GetNetworkState]?: undefined;
  [NativeBridgeMethod.PlaySound]?: {
    type: NativeSoundType;
  };
  [NativeBridgeMethod.SecureStorageGet]: NativeSecureStoragePayload;
  [NativeBridgeMethod.SecureStorageSet]: NativeSecureStoragePayload;
  [NativeBridgeMethod.SecureStorageRemove]: NativeSecureStoragePayload;
};

export type NativeBridgeResultMap = {
  [NativeBridgeMethod.GetLocation]: NativeLocationResult;
  [NativeBridgeMethod.RequestNotificationPermission]: NativeNotificationPermissionResult;
  [NativeBridgeMethod.GetPushToken]: NativePushTokenResult;
  [NativeBridgeMethod.PickImage]: NativeImageResult;
  [NativeBridgeMethod.Share]: NativeShareResult;
  [NativeBridgeMethod.GetNetworkState]: NativeNetworkState;
  [NativeBridgeMethod.PlaySound]: NativeSoundResult;
  [NativeBridgeMethod.SecureStorageGet]: NativeSecureStorageResult;
  [NativeBridgeMethod.SecureStorageSet]: NativeSecureStorageResult;
  [NativeBridgeMethod.SecureStorageRemove]: NativeSecureStorageResult;
};

export type NativeBridgeErrorCode = 'unsupported' | 'denied' | 'invalid' | 'not_found' | 'unknown';

export interface NativeBridgeError {
  code: NativeBridgeErrorCode;
  message: string;
}

export interface NativeBridgeRequest<T extends NativeBridgeMethod = NativeBridgeMethod> {
  id: string;
  type: T;
  payload?: NativeBridgePayloadMap[T];
}

export interface NativeBridgeResponse<T extends NativeBridgeMethod = NativeBridgeMethod> {
  id: string;
  type: T;
  ok: boolean;
  data?: NativeBridgeResultMap[T];
  error?: NativeBridgeError;
}

export type NativeBridge = {
  [K in NativeBridgeMethod]: (
    payload?: NativeBridgePayloadMap[K]
  ) => Promise<NativeBridgeResultMap[K]>;
};
