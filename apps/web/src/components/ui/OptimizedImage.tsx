"use client";

import { useState, useCallback, memo } from "react";
import Image, { type ImageProps } from "next/image";
import { cn } from "@/lib/utils";

// Default placeholder - subtle gradient that works everywhere
const DEFAULT_BLUR_DATA_URL = "data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImciIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNlMmU4ZjA7c3RvcC1vcGFjaXR5OjEiLz48c3RvcCBvZmZzZXQ9IjEwMCUiIHN0eWxlPSJzdG9wLWNvbG9yOiNjYmQzZGQ7c3RvcC1vcGFjaXR5OjEiLz48L2xpbmVhckdyYWRpZW50PjwvZGVmcz48cmVjdCB3aWR0aD0iMTAwIiBoZWlnaHQ9IjEwMCIgZmlsbD0idXJsKCNnKSIvPjwvc3ZnPg==";

// Fallback image for errors
const FALLBACK_IMAGE = "/images/placeholder.svg";

interface OptimizedImageProps extends Omit<ImageProps, "onError" | "onLoad"> {
  /**
   * Custom blurhash/placeholder data URL
   * Falls back to a subtle gray gradient if not provided
   */
  blurDataURL?: string;
  
  /**
   * Custom fallback image on error
   * Falls back to /images/placeholder.jpg if not provided
   */
  fallbackSrc?: string;
  
  /**
   * Whether to show a fade-in animation on load
   * @default true
   */
  fadeIn?: boolean;
  
  /**
   * Container className for the wrapper div
   */
  containerClassName?: string;
  
  /**
   * Callback when image fully loads
   */
  onImageLoad?: () => void;
  
  /**
   * Callback when image fails to load
   */
  onImageError?: () => void;
}

/**
 * OptimizedImage - Progressive loading image with blurhash placeholder
 * 
 * Features:
 * - Blur placeholder during load (can accept blurhash or data URL)
 * - Graceful error fallback
 * - Smooth fade-in transition
 * - Built on Next.js Image for automatic optimization
 */
const OptimizedImage = memo(({
  src,
  alt,
  blurDataURL,
  fallbackSrc = FALLBACK_IMAGE,
  fadeIn = true,
  containerClassName,
  className,
  onImageLoad,
  onImageError,
  ...props
}: OptimizedImageProps) => {
  const [isLoaded, setIsLoaded] = useState(false);
  const [hasError, setHasError] = useState(false);
  
  const handleLoad = useCallback(() => {
    setIsLoaded(true);
    onImageLoad?.();
  }, [onImageLoad]);
  
  const handleError = useCallback(() => {
    setHasError(true);
    onImageError?.();
  }, [onImageError]);
  
  // Use fallback src if error occurred
  const imageSrc = hasError ? fallbackSrc : src;
  
  return (
    <div className={cn("relative overflow-hidden", props.fill && "w-full h-full", containerClassName)}>
      <Image
        src={imageSrc}
        alt={alt}
        placeholder="blur"
        blurDataURL={blurDataURL || DEFAULT_BLUR_DATA_URL}
        onLoad={handleLoad}
        onError={handleError}
        className={cn(
          className,
          fadeIn && "transition-opacity duration-300",
          fadeIn && !isLoaded && !hasError && "opacity-0", 
          fadeIn && (isLoaded || hasError) && "opacity-100"
        )}
        {...props}
      />
    </div>
  );
});

OptimizedImage.displayName = "OptimizedImage";

export { OptimizedImage, DEFAULT_BLUR_DATA_URL };
