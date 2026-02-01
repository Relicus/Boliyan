import { Pressable, StyleSheet, Text, View } from 'react-native';

interface ErrorScreenProps {
  onRetry: () => void;
}

const TITLE = 'Something went wrong';
const SUBTITLE = 'Tap to reload the app.';
const RETRY_LABEL = 'Reload';

export function ErrorScreen({ onRetry }: ErrorScreenProps) {
  return (
    <View nativeID="mobile-error-screen" style={styles.container}>
      <Text style={styles.title}>{TITLE}</Text>
      <Text style={styles.subtitle}>{SUBTITLE}</Text>
      <Pressable
        nativeID="mobile-error-retry"
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
