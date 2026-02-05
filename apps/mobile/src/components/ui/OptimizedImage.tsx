import { Image, ImageStyle, ImageProps } from 'expo-image';
import { useState, useCallback } from 'react';
import { View, StyleSheet, ActivityIndicator, StyleProp, ViewStyle } from 'react-native';

const BLURMAP = {
  // Common blurhashes can be added here as fallbacks
  default: 'L6PZfSi_.AyE_3t7t7R**0o#DgR4'
};

interface OptimizedImageProps extends Omit<ImageProps, 'source'> {
  source: string | { uri: string };
  style?: StyleProp<ImageStyle>;
  containerStyle?: StyleProp<ViewStyle>;
  showLoading?: boolean;
}

export function OptimizedImage({ 
  source, 
  style, 
  containerStyle,
  showLoading = true,
  ...props 
}: OptimizedImageProps) {
  const [isLoading, setIsLoading] = useState(true);
  const [hasError, setHasError] = useState(false);

  const handleLoadStart = useCallback(() => {
    setIsLoading(true);
    setHasError(false);
  }, []);

  const handleLoadEnd = useCallback(() => {
    setIsLoading(false);
  }, []);

  const handleError = useCallback(() => {
    setIsLoading(false);
    setHasError(true);
  }, []);

  const imageSource = typeof source === 'string' ? { uri: source } : source;

  return (
    <View style={[styles.container, containerStyle]}>
      <Image
        {...props}
        source={imageSource}
        style={[styles.image, style]}
        onLoadStart={handleLoadStart}
        onLoad={handleLoadEnd}
        onError={handleError}
        transition={200} // Smooth fade in
        cachePolicy="memory-disk"
        placeholder={BLURMAP.default}
        contentFit="cover"
      />
      
      {showLoading && isLoading && !hasError && (
        <View style={[styles.absoluteFill, styles.centered]}>
          <ActivityIndicator size="small" color="#94a3b8" />
        </View>
      )}

      {hasError && (
        <View style={[styles.absoluteFill, styles.centered, styles.errorContainer]}>
          {/* We could render an icon here */}
          <View style={styles.errorPlaceholder} />
        </View>
      )}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    overflow: 'hidden',
    backgroundColor: '#f1f5f9', // slate-100
  },
  image: {
    width: '100%',
    height: '100%',
  },
  absoluteFill: {
    ...StyleSheet.absoluteFillObject,
  },
  centered: {
    justifyContent: 'center',
    alignItems: 'center',
  },
  errorContainer: {
    backgroundColor: '#cbd5e1', // slate-300
  },
  errorPlaceholder: {
    width: '50%',
    height: '2px',
    backgroundColor: '#94a3b8',
  }
});
