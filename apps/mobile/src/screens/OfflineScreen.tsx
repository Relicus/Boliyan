import { Pressable, StyleSheet, Text, View } from 'react-native';

interface OfflineScreenProps {
  onRetry: () => void;
}

const TITLE = 'You are offline';
const SUBTITLE = 'Reconnect to continue.';
const RETRY_LABEL = 'Try again';

export function OfflineScreen({ onRetry }: OfflineScreenProps) {
  return (
    <View nativeID="mobile-offline-screen" style={styles.container}>
      <Text style={styles.title}>{TITLE}</Text>
      <Text style={styles.subtitle}>{SUBTITLE}</Text>
      <Pressable
        nativeID="mobile-offline-retry"
        onPress={onRetry}
        style={({ pressed }: { pressed: boolean }) => [
          styles.button,
          pressed && styles.buttonPressed
        ]}
      >
        <Text style={styles.buttonLabel}>{RETRY_LABEL}</Text>
      </Pressable>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0b',
    paddingHorizontal: 24
  },
  title: {
    fontSize: 20,
    color: '#f4f4f4',
    marginBottom: 8
  },
  subtitle: {
    fontSize: 14,
    color: '#b5b5b5',
    marginBottom: 20
  },
  button: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    borderRadius: 999,
    backgroundColor: '#f4f4f4'
  },
  buttonPressed: {
    opacity: 0.7
  },
  buttonLabel: {
    fontSize: 14,
    color: '#0b0b0b'
  }
});
