import Constants from 'expo-constants';
import { useCallback, useEffect, useState } from 'react';

import { WEB_ORIGIN } from '../constants';

const VERSION_CHECK_ENDPOINT = `${WEB_ORIGIN}/api/mobile/version`;
const CHECK_INTERVAL_MS = 60 * 60 * 1000; // Re-check every 1 hour

interface VersionInfo {
  minVersion: string;
  latestVersion: string;
  updateUrl?: string;
}

interface VersionCheckResult {
  needsForceUpdate: boolean;
  needsSoftUpdate: boolean;
  updateUrl: string | null;
  dismiss: () => void;
}

function parseVersion(v: string): number[] {
  return v.split('.').map(Number);
}

function isVersionBelow(current: string, target: string): boolean {
  const c = parseVersion(current);
  const t = parseVersion(target);

  for (let i = 0; i < Math.max(c.length, t.length); i++) {
    const cv = c[i] ?? 0;
    const tv = t[i] ?? 0;
    if (cv < tv) return true;
    if (cv > tv) return false;
  }

  return false;
}

export function useVersionCheck(): VersionCheckResult {
  const [needsForceUpdate, setNeedsForceUpdate] = useState(false);
  const [needsSoftUpdate, setNeedsSoftUpdate] = useState(false);
  const [updateUrl, setUpdateUrl] = useState<string | null>(null);
  const [dismissed, setDismissed] = useState(false);

  const currentVersion = Constants.expoConfig?.version ?? '1.0.0';

  const checkVersion = useCallback(async () => {
    try {
      const response = await fetch(VERSION_CHECK_ENDPOINT, {
        headers: { 'X-App-Version': currentVersion }
      });

      if (!response.ok) {
        return;
      }

      const info: VersionInfo = await response.json();

      if (info.minVersion && isVersionBelow(currentVersion, info.minVersion)) {
        setNeedsForceUpdate(true);
        setUpdateUrl(info.updateUrl ?? null);
        return;
      }

      if (info.latestVersion && isVersionBelow(currentVersion, info.latestVersion)) {
        setNeedsSoftUpdate(true);
        setUpdateUrl(info.updateUrl ?? null);
      }
    } catch {
      // Silently fail — version check should never block the app
    }
  }, [currentVersion]);

  const dismiss = useCallback(() => {
    setDismissed(true);
    setNeedsSoftUpdate(false);
  }, []);

  useEffect(() => {
    checkVersion();
    const interval = setInterval(checkVersion, CHECK_INTERVAL_MS);
    return () => clearInterval(interval);
  }, [checkVersion]);

  return {
    needsForceUpdate,
    needsSoftUpdate: needsSoftUpdate && !dismissed,
    updateUrl,
    dismiss
  };
}
