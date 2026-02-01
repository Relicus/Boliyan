import NetInfo from '@react-native-community/netinfo';
import * as AuthSession from 'expo-auth-session';
import * as ImagePicker from 'expo-image-picker';
import * as Location from 'expo-location';
import * as Notifications from 'expo-notifications';
import * as SecureStore from 'expo-secure-store';
import Constants from 'expo-constants';
import { Platform, Share } from 'react-native';

import {
  NativeBridgeMethod,
  type NativeBridgeError,
  type NativeBridgeRequest,
  type NativeBridgeResponse,
  type NativeImageFile,
  type NativeSecureStorageResult
} from '../../../packages/shared/nativeBridge';
import { buildErrorResponse, buildSuccessResponse } from './bridge';
import {
  GOOGLE_ANDROID_CLIENT_ID,
  GOOGLE_AUTH_REDIRECT_PATH,
  GOOGLE_IOS_CLIENT_ID,
  LINK_SCHEME
} from './constants';

const DEFAULT_ERROR_MESSAGE = 'Native bridge error';
const CANCELLED_MESSAGE = 'Action cancelled';
const GOOGLE_DISCOVERY_URL = 'https://accounts.google.com';
const GOOGLE_SCOPES = ['openid', 'profile', 'email'];
const GOOGLE_CLIENT_ID_ERROR = 'Missing Google client ID';
const GOOGLE_TOKEN_ERROR = 'Missing Google id_token';

function buildError(code: NativeBridgeError['code'], message: string): NativeBridgeError {
  return { code, message };
}

function buildNonce(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2)}`;
}

function getGoogleClientId(): string {
  if (Platform.OS === 'ios') {
    return GOOGLE_IOS_CLIENT_ID;
  }

  return GOOGLE_ANDROID_CLIENT_ID;
}

function getProjectId(): string | null {
  const fromExpoConfig = Constants.expoConfig?.extra?.eas?.projectId;
  const fromEasConfig = Constants.easConfig?.projectId;
  return (fromExpoConfig ?? fromEasConfig ?? null) as string | null;
}

function buildImageFiles(
  assets: ImagePicker.ImagePickerAsset[],
  options: { preferDataUrl?: boolean } = {}
): NativeImageFile[] {
  const preferDataUrl = options.preferDataUrl ?? false;

  return assets.map((asset) => {
    const mime = asset.mimeType ?? 'image/jpeg';
    const dataUrl =
      preferDataUrl && asset.base64
        ? `data:${mime};base64,${asset.base64}`
        : asset.uri;

    return {
      uri: dataUrl,
      mime,
      size: asset.fileSize ?? null,
      name: asset.fileName ?? undefined
    };
  });
}

async function handleGetLocation(request: NativeBridgeRequest) {
  console.log('[NativeBridge] handleGetLocation called:', request);
  
  const permission = await Location.requestForegroundPermissionsAsync();
  console.log('[NativeBridge] Location permission status:', permission.status);
  
  if (permission.status !== 'granted') {
    console.log('[NativeBridge] Location permission denied');
    return buildErrorResponse(request, buildError('denied', 'Location permission denied'));
  }

  const payload = request.payload as { highAccuracy?: boolean } | undefined;
  const accuracy = payload?.highAccuracy
    ? Location.Accuracy.Highest
    : Location.Accuracy.Balanced;
  
  console.log('[NativeBridge] Getting position with accuracy:', accuracy);
  const position = await Location.getCurrentPositionAsync({ accuracy });
  console.log('[NativeBridge] Got position:', position.coords);

  return buildSuccessResponse(request, {
    lat: position.coords.latitude,
    lng: position.coords.longitude,
    accuracy: position.coords.accuracy ?? null,
    source: payload?.highAccuracy ? 'gps' : 'network'
  });
}

async function handleRequestNotificationPermission(request: NativeBridgeRequest) {
  const current = await Notifications.getPermissionsAsync();
  const resolved =
    current.status === 'granted'
      ? current
      : await Notifications.requestPermissionsAsync();

  return buildSuccessResponse(request, {
    status: resolved.status
  });
}

async function handleGetPushToken(request: NativeBridgeRequest) {
  const permission = await Notifications.getPermissionsAsync();
  if (permission.status !== 'granted') {
    const requested = await Notifications.requestPermissionsAsync();
    if (requested.status !== 'granted') {
      return buildErrorResponse(request, buildError('denied', 'Push permission denied'));
    }
  }

  const projectId = getProjectId();
  if (!projectId) {
    return buildErrorResponse(request, buildError('invalid', 'Missing EAS project ID'));
  }

  const token = await Notifications.getExpoPushTokenAsync({ projectId });

  return buildSuccessResponse(request, {
    token: token.data,
    platform: Platform.OS === 'ios' ? 'ios' : 'android'
  });
}

async function handlePickImage(request: NativeBridgeRequest) {
  const payload = request.payload as
    | { allowsMultiple?: boolean; quality?: number; source?: 'camera' | 'library' }
    | undefined;
  const source = payload?.source ?? 'library';
  const quality = payload?.quality ?? 0.9;
  const allowsMultiple = payload?.allowsMultiple ?? false;

  if (source === 'camera') {
    const cameraPermission = await ImagePicker.requestCameraPermissionsAsync();
    if (!cameraPermission.granted) {
      return buildErrorResponse(request, buildError('denied', 'Camera permission denied'));
    }
  } else {
    const libraryPermission = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (!libraryPermission.granted) {
      return buildErrorResponse(request, buildError('denied', 'Photo library permission denied'));
    }
  }

  const result =
    source === 'camera'
      ? await ImagePicker.launchCameraAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality,
          base64: true
        })
      : await ImagePicker.launchImageLibraryAsync({
          mediaTypes: ImagePicker.MediaTypeOptions.Images,
          quality,
          allowsMultipleSelection: allowsMultiple
        });

  if (result.canceled || !result.assets?.length) {
    return buildErrorResponse(request, buildError('not_found', CANCELLED_MESSAGE));
  }

  return buildSuccessResponse(request, {
    files: buildImageFiles(result.assets, { preferDataUrl: source === 'camera' })
  });
}

async function handleShare(request: NativeBridgeRequest) {
  const payload = request.payload as { title?: string; message?: string; url?: string } | undefined;
  const messageParts = [payload?.message, payload?.url].filter(Boolean);
  const message = messageParts.join(' ');

  const result = await Share.share({
    title: payload?.title,
    message
  });

  return buildSuccessResponse(request, {
    ok: result.action === Share.sharedAction
  });
}

async function handleNetworkState(request: NativeBridgeRequest) {
  const state = await NetInfo.fetch();
  return buildSuccessResponse(request, {
    online: Boolean(state.isConnected),
    type: state.type
  });
}

async function handlePlaySound(request: NativeBridgeRequest) {
  return buildErrorResponse(request, buildError('unsupported', 'Sound bridge not configured'));
}

async function handleSecureStorageGet(request: NativeBridgeRequest) {
  const payload = request.payload as { key: string } | undefined;
  if (!payload?.key) {
    return buildErrorResponse(request, buildError('invalid', DEFAULT_ERROR_MESSAGE));
  }

  const value = await SecureStore.getItemAsync(payload.key);
  const result: NativeSecureStorageResult = { ok: true, value };
  return buildSuccessResponse(request, result);
}

async function handleSecureStorageSet(request: NativeBridgeRequest) {
  const payload = request.payload as { key: string; value?: string } | undefined;
  if (!payload?.key || payload.value === undefined) {
    return buildErrorResponse(request, buildError('invalid', DEFAULT_ERROR_MESSAGE));
  }

  await SecureStore.setItemAsync(payload.key, payload.value);
  const result: NativeSecureStorageResult = { ok: true };
  return buildSuccessResponse(request, result);
}

async function handleSecureStorageRemove(request: NativeBridgeRequest) {
  const payload = request.payload as { key: string } | undefined;
  if (!payload?.key) {
    return buildErrorResponse(request, buildError('invalid', DEFAULT_ERROR_MESSAGE));
  }

  await SecureStore.deleteItemAsync(payload.key);
  const result: NativeSecureStorageResult = { ok: true };
  return buildSuccessResponse(request, result);
}

async function handleGoogleSignIn(request: NativeBridgeRequest) {
  const clientId = getGoogleClientId();
  if (!clientId) {
    return buildErrorResponse(request, buildError('invalid', GOOGLE_CLIENT_ID_ERROR));
  }

  const redirectUri = AuthSession.makeRedirectUri({
    scheme: LINK_SCHEME,
    path: GOOGLE_AUTH_REDIRECT_PATH
  });

  const discovery = await AuthSession.fetchDiscoveryAsync(GOOGLE_DISCOVERY_URL);
  const authRequest = new AuthSession.AuthRequest({
    clientId,
    redirectUri,
    scopes: GOOGLE_SCOPES,
    responseType: AuthSession.ResponseType.IdToken,
    extraParams: {
      nonce: buildNonce(),
      prompt: 'select_account'
    }
  });

  const result = await authRequest.promptAsync(discovery, {
    useProxy: false,
    preferEphemeralSession: true
  });

  if (result.type !== 'success') {
    return buildErrorResponse(request, buildError('not_found', CANCELLED_MESSAGE));
  }

  const idToken = result.params?.id_token;
  if (!idToken) {
    return buildErrorResponse(request, buildError('invalid', GOOGLE_TOKEN_ERROR));
  }

  return buildSuccessResponse(request, {
    idToken,
    accessToken: result.params?.access_token ?? null
  });
}

export async function handleBridgeRequest(
  request: NativeBridgeRequest
): Promise<NativeBridgeResponse> {
  try {
    switch (request.type) {
      case NativeBridgeMethod.GetLocation:
        return await handleGetLocation(request);
      case NativeBridgeMethod.RequestNotificationPermission:
        return await handleRequestNotificationPermission(request);
      case NativeBridgeMethod.GetPushToken:
        return await handleGetPushToken(request);
      case NativeBridgeMethod.PickImage:
        return await handlePickImage(request);
      case NativeBridgeMethod.Share:
        return await handleShare(request);
      case NativeBridgeMethod.GetNetworkState:
        return await handleNetworkState(request);
      case NativeBridgeMethod.PlaySound:
        return await handlePlaySound(request);
      case NativeBridgeMethod.SecureStorageGet:
        return await handleSecureStorageGet(request);
      case NativeBridgeMethod.SecureStorageSet:
        return await handleSecureStorageSet(request);
      case NativeBridgeMethod.SecureStorageRemove:
        return await handleSecureStorageRemove(request);
      case NativeBridgeMethod.GoogleSignIn:
        return await handleGoogleSignIn(request);
      default:
        return buildErrorResponse(request, buildError('unsupported', DEFAULT_ERROR_MESSAGE));
    }
  } catch (err) {
    return buildErrorResponse(request, buildError('unknown', DEFAULT_ERROR_MESSAGE));
  }
}
