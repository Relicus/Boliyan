import type { AuthError } from "@supabase/supabase-js";
import { supabase } from "./supabase";
import { isNativeBridgeAvailable, NativeBridgeMethod, requestNative } from "./nativeBridge";

const AUTH_CALLBACK_PATH = "/auth/callback";
const NATIVE_LINK_SCHEME = "boliyan";
const GOOGLE_PROVIDER = "google" as const;
const NATIVE_CANCELLED_MESSAGE = "Action cancelled";

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

type OAuthProvider = "google" | "facebook";

type NativeAuthOutcome = "success" | "fallback" | "cancelled";

interface NativeAuthResult {
  outcome: NativeAuthOutcome;
  error?: AuthError;
}

interface OAuthLoginResult {
  didComplete: boolean;
  error?: AuthError;
}

function resolveNativeAuthError(error: unknown): NativeAuthOutcome {
  if (error instanceof Error && error.message === NATIVE_CANCELLED_MESSAGE) {
    return "cancelled";
  }

  return "fallback";
}

async function tryNativeGoogleSignIn(): Promise<NativeAuthResult> {
  if (!isNativeBridgeAvailable()) {
    return { outcome: "fallback" };
  }

  try {
    const nativeResult = await requestNative(NativeBridgeMethod.GoogleSignIn);
    if (!nativeResult?.idToken) {
      return { outcome: "fallback" };
    }

    const { error } = await supabase.auth.signInWithIdToken({
      provider: GOOGLE_PROVIDER,
      token: nativeResult.idToken,
      access_token: nativeResult.accessToken ?? undefined
    });

    if (error) {
      console.error("[NativeAuth] Google native sign-in failed", error);
      return { outcome: "fallback", error };
    }

    return { outcome: "success" };
  } catch (error) {
    console.error("[NativeAuth] Google native sign-in error", error);
    return { outcome: resolveNativeAuthError(error) };
  }
}

export async function loginWithProvider(
  provider: OAuthProvider,
  redirect?: string | null
): Promise<OAuthLoginResult> {
  if (provider === GOOGLE_PROVIDER) {
    const nativeResult = await tryNativeGoogleSignIn();
    if (nativeResult.outcome === "success") {
      return { didComplete: true };
    }
    if (nativeResult.outcome === "cancelled") {
      return { didComplete: false };
    }
    if (nativeResult.error) {
      console.error("[NativeAuth] Falling back after native error", nativeResult.error);
    }
  }

  const { error } = await supabase.auth.signInWithOAuth({
    provider,
    options: {
      redirectTo: getAuthRedirectUrl(redirect)
    }
  });

  if (error) {
    console.error("[NativeAuth] OAuth login failed", { provider, error });
    return { didComplete: false, error };
  }

  return { didComplete: false };
}
