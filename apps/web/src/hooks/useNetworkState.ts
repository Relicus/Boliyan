"use client";

import { useState, useEffect, useCallback } from "react";
import { requestNative, isNativeBridgeAvailable, NativeBridgeMethod } from "@/lib/nativeBridge";

interface NetworkState {
  /** Whether the device is online */
  isOnline: boolean;
  /** Network connection type (wifi, cellular, none, unknown) */
  type: "wifi" | "cellular" | "none" | "unknown";
  /** Whether the state has been initialized */
  isInitialized: boolean;
}

/**
 * useNetworkState - Detects online/offline status
 * 
 * On native (mobile): Uses native bridge to get real network state
 * On web: Falls back to navigator.onLine with online/offline events
 * 
 * @returns NetworkState object with isOnline, type, and isInitialized
 */
export function useNetworkState(): NetworkState {
  const [state, setState] = useState<NetworkState>({
    isOnline: true, // Optimistic default
    type: "unknown",
    isInitialized: false,
  });

  // Fetch network state from native bridge
  const fetchNativeNetworkState = useCallback(async () => {
    if (!isNativeBridgeAvailable()) return false;
    
    try {
      const response = await requestNative(NativeBridgeMethod.GetNetworkState, undefined);
      
      if (response && response.online !== undefined) {
        const netType = String(response.type || "unknown").toLowerCase();
        setState({
          isOnline: response.online,
          type: netType === "wifi" ? "wifi" : 
                netType === "cellular" ? "cellular" : 
                netType === "none" ? "none" : "unknown",
          isInitialized: true,
        });
        return true;
      }
    } catch (err) {
      console.warn("[useNetworkState] Native bridge error:", err);
    }
    
    return false;
  }, []);

  // Initialize network state
  useEffect(() => {
    const init = async () => {
      // Try native first
      const usedNative = await fetchNativeNetworkState();
      
      // Fall back to browser API
      if (!usedNative && typeof navigator !== "undefined") {
        setState({
          isOnline: navigator.onLine,
          type: "unknown",
          isInitialized: true,
        });
      }
    };

    init();
  }, [fetchNativeNetworkState]);

  // Listen for browser online/offline events (works in WebView too)
  useEffect(() => {
    if (typeof window === "undefined") return;

    const handleOnline = () => {
      setState(prev => ({ ...prev, isOnline: true }));
      // Re-fetch native state for accurate type
      fetchNativeNetworkState();
    };

    const handleOffline = () => {
      setState(prev => ({ ...prev, isOnline: false, type: "none" }));
    };

    window.addEventListener("online", handleOnline);
    window.addEventListener("offline", handleOffline);

    return () => {
      window.removeEventListener("online", handleOnline);
      window.removeEventListener("offline", handleOffline);
    };
  }, [fetchNativeNetworkState]);

  return state;
}
