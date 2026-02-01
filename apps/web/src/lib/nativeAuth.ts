import { isNativeBridgeAvailable } from "./nativeBridge";

const AUTH_CALLBACK_PATH = "/auth/callback";
const NATIVE_LINK_SCHEME = "boliyan";

function getBaseRedirectUrl(): string {
  if (isNativeBridgeAvailable()) {
    return `${NATIVE_LINK_SCHEME}://${AUTH_CALLBACK_PATH.slice(1)}`;
  }

  if (typeof window === "undefined") {
    return AUTH_CALLBACK_PATH;
  }

  return `${window.location.origin}${AUTH_CALLBACK_PATH}`;
}

export function getAuthRedirectUrl(redirect?: string | null): string {
  const base = getBaseRedirectUrl();
  if (!redirect) {
    return base;
  }

  const separator = base.includes("?") ? "&" : "?";
  return `${base}${separator}redirect=${encodeURIComponent(redirect)}`;
}
