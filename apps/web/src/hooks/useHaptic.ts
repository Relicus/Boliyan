import { useCallback } from 'react';
import { getNativeBridge } from '@/lib/nativeBridge';
import type { NativeHapticType } from '../../../../packages/shared/nativeBridge';

/**
 * Hook for triggering native haptic feedback from web components.
 * Works only when running inside the mobile WebView wrapper.
 * 
 * @example
 * const haptic = useHaptic();
 * 
 * // On button press
 * onClick={() => {
 *   haptic.light();
 *   handleAction();
 * }}
 */
export function useHaptic() {
  const triggerHaptic = useCallback(
    async (type: NativeHapticType) => {
      const bridge = getNativeBridge();
      
      if (!bridge) {
        return;
      }

      try {
        await bridge.triggerHaptic({ type });
      } catch (error) {
        // Silently fail - haptics are enhancement
      }
    },
    []
  );

  const light = useCallback(() => triggerHaptic('light'), [triggerHaptic]);
  const medium = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);
  const heavy = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);
  const selection = useCallback(() => triggerHaptic('selection'), [triggerHaptic]);
  const success = useCallback(() => triggerHaptic('success'), [triggerHaptic]);
  const warning = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);
  const error = useCallback(() => triggerHaptic('error'), [triggerHaptic]);

  return {
    light,
    medium,
    heavy,
    selection,
    success,
    warning,
    error,
  };
}
