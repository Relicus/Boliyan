import { useCallback } from 'react';
import { getNativeBridge } from '@/lib/nativeBridge';
import { NativeHapticType } from '@boliyan/shared/nativeBridge';

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
    async (type: keyof typeof NativeHapticType) => {
      const bridge = getNativeBridge();
      
      if (!bridge) {
        // Not in mobile app, no-op
        return;
      }

      try {
        await bridge.triggerHaptic({ type });
      } catch (error) {
        // Silently fail - haptics are enhancement, not critical
        console.warn('[Haptic] Failed:', error);
      }
    },
    []
  );

  // Light impact for subtle interactions (buttons, toggles)
  const light = useCallback(() => triggerHaptic('light'), [triggerHaptic]);

  // Medium impact for confirmations and important actions
  const medium = useCallback(() => triggerHaptic('medium'), [triggerHaptic]);

  // Heavy impact for destructive actions
  const heavy = useCallback(() => triggerHaptic('heavy'), [triggerHaptic]);

  // Selection feedback for pickers and steppers
  const selection = useCallback(() => triggerHaptic('selection'), [triggerHaptic]);

  // Success notification for completed actions
  const success = useCallback(() => triggerHaptic('success'), [triggerHaptic]);

  // Warning notification for caution states
  const warning = useCallback(() => triggerHaptic('warning'), [triggerHaptic]);

  // Error notification for failed actions
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
