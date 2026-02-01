export const DEFAULT_WEB_ORIGIN = 'http://192.168.18.187:3000';
export const DEFAULT_LINK_SCHEME = 'boliyan';
export const DEFAULT_WEB_PATH = '/';

export const WEB_ORIGIN = process.env.EXPO_PUBLIC_WEB_ORIGIN ?? DEFAULT_WEB_ORIGIN;
export const LINK_SCHEME = process.env.EXPO_PUBLIC_LINK_SCHEME ?? DEFAULT_LINK_SCHEME;
export const LINK_PREFIX = `${LINK_SCHEME}://`;
export const ORIGIN_WHITELIST = [`${WEB_ORIGIN}*`, `${LINK_PREFIX}*`];

export const BRIDGE_RESPONSE_TIMEOUT_MS = 15000;
export const WEBVIEW_ERROR_THRESHOLD_MS = 8000;
