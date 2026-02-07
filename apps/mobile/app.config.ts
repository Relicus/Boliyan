import type { ConfigContext, ExpoConfig } from 'expo/config';

const projectId =
  process.env.EXPO_EAS_PROJECT_ID ?? process.env.EXPO_PUBLIC_EAS_PROJECT_ID;

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: 'Boliyan',
  slug: 'boliyan',
  scheme: 'boliyan',
  version: '1.0.0',
  orientation: 'portrait',
  userInterfaceStyle: 'dark',
  icon: './assets/icon.png',
  splash: {
    image: './assets/splash-icon.png',
    resizeMode: 'contain',
    backgroundColor: '#0b0b0b'
  },
  runtimeVersion: {
    policy: 'sdkVersion'
  },
  updates: {
    url: `https://u.expo.dev/${projectId ?? ''}`,
    fallbackToCacheTimeout: 0
  },
  ios: {
    supportsTablet: true,
    bundleIdentifier: 'com.boliyan.app',
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        'Boliyan uses your location to show nearby listings and help buyers find items close to you.',
      NSPhotoLibraryUsageDescription:
        'Boliyan needs access to your photos so you can add images to your listings.',
      NSCameraUsageDescription:
        'Boliyan needs camera access so you can take photos of items you want to sell.'
    }
  },
  android: {
    package: 'com.boliyan.app',
    adaptiveIcon: {
      foregroundImage: './assets/adaptive-icon.png',
      backgroundColor: '#0b0b0b'
    }
  },
  plugins: [
    'expo-notifications',
    'expo-image-picker',
    'expo-location',
    'expo-secure-store'
  ],
  extra: {
    ...(projectId ? { eas: { projectId } } : {}),
    privacyPolicyUrl: 'https://boliyan.pk/privacy-policy'
  }
});
