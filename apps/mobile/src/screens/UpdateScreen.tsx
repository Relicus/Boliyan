import { Linking, Platform, Pressable, StyleSheet, Text, View } from 'react-native';

interface UpdateScreenProps {
  isForced: boolean;
  updateUrl: string | null;
  onDismiss: () => void;
}

const FORCE_TITLE = 'Update Required';
const FORCE_SUBTITLE = 'A new version of Boliyan is available. Please update to continue.';
const SOFT_TITLE = 'Update Available';
const SOFT_SUBTITLE = 'A new version of Boliyan is available with improvements and fixes.';
const UPDATE_LABEL = 'Update Now';
const DISMISS_LABEL = 'Not Now';

const DEFAULT_IOS_URL = 'https://apps.apple.com/app/boliyan/id0000000000';
const DEFAULT_ANDROID_URL = 'https://play.google.com/store/apps/details?id=com.boliyan.app';

function getDefaultStoreUrl(): string {
  return Platform.OS === 'ios' ? DEFAULT_IOS_URL : DEFAULT_ANDROID_URL;
}

export function UpdateScreen({ isForced, updateUrl, onDismiss }: UpdateScreenProps) {
  const storeUrl = updateUrl ?? getDefaultStoreUrl();

  const handleUpdate = () => {
    Linking.openURL(storeUrl).catch(() => undefined);
  };

  return (
    <View nativeID="mobile-update-screen" style={styles.container}>
      <View nativeID="mobile-update-content" style={styles.content}>
        <Text style={styles.emoji}>🚀</Text>
        <Text style={styles.title}>{isForced ? FORCE_TITLE : SOFT_TITLE}</Text>
        <Text style={styles.subtitle}>{isForced ? FORCE_SUBTITLE : SOFT_SUBTITLE}</Text>

        <Pressable
          nativeID="mobile-update-btn"
          onPress={handleUpdate}
          style={({ pressed }: { pressed: boolean }) => [
            styles.updateButton,
            pressed && styles.buttonPressed
          ]}
        >
          <Text style={styles.updateButtonLabel}>{UPDATE_LABEL}</Text>
        </Pressable>

        {!isForced && (
          <Pressable
            nativeID="mobile-update-dismiss-btn"
            onPress={onDismiss}
            style={({ pressed }: { pressed: boolean }) => [
              styles.dismissButton,
              pressed && styles.buttonPressed
            ]}
          >
            <Text style={styles.dismissButtonLabel}>{DISMISS_LABEL}</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0b',
    paddingHorizontal: 32
  },
  content: {
    alignItems: 'center',
    maxWidth: 320
  },
  emoji: {
    fontSize: 48,
    marginBottom: 16
  },
  title: {
    fontSize: 22,
    fontWeight: '600',
    color: '#f4f4f4',
    marginBottom: 8,
    textAlign: 'center'
  },
  subtitle: {
    fontSize: 15,
    color: '#b5b5b5',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 28
  },
  updateButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: '#2563eb',
    alignItems: 'center',
    marginBottom: 12
  },
  updateButtonLabel: {
    fontSize: 16,
    fontWeight: '600',
    color: '#ffffff'
  },
  dismissButton: {
    width: '100%',
    paddingVertical: 14,
    borderRadius: 999,
    backgroundColor: 'transparent',
    alignItems: 'center'
  },
  dismissButtonLabel: {
    fontSize: 15,
    color: '#888888'
  },
  buttonPressed: {
    opacity: 0.7
  }
});
