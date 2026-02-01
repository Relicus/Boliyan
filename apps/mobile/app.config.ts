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
  userInterfaceStyle: 'light',
  runtimeVersion: {
    policy: 'sdkVersion'
  },
  ios: {
    supportsTablet: true
  },
  android: {
    package: 'com.boliyan.app'
  },
  // NOTE: expo-notifications remote push requires Development Build
  // Local notifications still work in Expo Go
  plugins: [
    'expo-notifications',
    'expo-image-picker',
    'expo-location',
    'expo-secure-store'
  ],
  extra: projectId ? { eas: { projectId } } : {}
});
