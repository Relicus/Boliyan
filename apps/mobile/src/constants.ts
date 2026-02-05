import Constants from 'expo-constants';

type ExpoClientManifest = {
  debuggerHost?: string;
};

type ExpoClientManifest2 = {
  extra?: {
    expoClient?: {
      hostUri?: string;
    };
  };
};

const expoConstants = Constants as Constants & {
  manifest?: ExpoClientManifest;
  manifest2?: ExpoClientManifest2;
};

function extractHost(hostUri: string): string {
  const normalized = hostUri
    .replace('exp://', '')
    .replace('http://', '')
    .replace('https://', '')
    .split('/')[0];
  return normalized.split(':')[0];
}

const debuggerHost =
  Constants.expoConfig?.hostUri ??
  expoConstants.manifest?.debuggerHost ??
  expoConstants.manifest2?.extra?.expoClient?.hostUri ??
  null;
const localhost = debuggerHost ? extractHost(debuggerHost) : 'localhost';
export const DEFAULT_WEB_ORIGIN = `http://${localhost}:3000`;
export const DEFAULT_LINK_SCHEME = 'boliyan';
export const DEFAULT_WEB_PATH = '/';
export const GOOGLE_AUTH_REDIRECT_PATH = 'auth/google';

export const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN;
export const LINK_SCHEME = process.env.EXPO_PUBLIC_LINK_SCHEME ?? DEFAULT_LINK_SCHEME;
export const LINK_PREFIX = `${LINK_SCHEME}://`;
export const ORIGIN_WHITELIST = [`${WEB_ORIGIN}*`, `${LINK_PREFIX}*`];

export const BRIDGE_RESPONSE_TIMEOUT_MS = 15000;
export const WEBVIEW_ERROR_THRESHOLD_MS = 8000;

export const GOOGLE_CLIENT_ID = process.env.EXPO_PUBLIC_GOOGLE_CLIENT_ID ?? '';
export const GOOGLE_IOS_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID ?? GOOGLE_CLIENT_ID;
export const GOOGLE_ANDROID_CLIENT_ID =
  process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID ?? GOOGLE_CLIENT_ID;
