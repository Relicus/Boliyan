import * as Haptics from "expo-haptics";

/**
 * Centralized haptic feedback hook providing semantic haptic methods.
 * 
 * Usage:
 * const haptic = useHaptic();
 * haptic.light(); // Subtle tap for most UI interactions
 * haptic.success(); // Success confirmation
 */
export const useHaptic = () => {
  // Light tap for subtle interactions (buttons, toggles, taps)
  const light = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
  
  // Medium impact for confirmations and important actions
  const medium = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
  
  // Heavy impact for destructive actions only
  const heavy = () => Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Heavy);
  
  // Selection feedback for pickers, steppers, and sliders
  const selection = () => Haptics.selectionAsync();
  
  // Success notification for completed actions
  const success = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
  
  // Warning notification for caution states
  const warning = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Warning);
  
  // Error notification for failed actions
  const error = () => Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
  
  return { light, medium, heavy, selection, success, warning, error };
};
