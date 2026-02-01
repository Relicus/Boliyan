import { ActivityIndicator, StyleSheet, Text, View } from 'react-native';

interface LoadingScreenProps {
  label?: string;
}

const DEFAULT_LABEL = 'Loading Boliyan';

export function LoadingScreen({ label = DEFAULT_LABEL }: LoadingScreenProps) {
  return (
    <View nativeID="mobile-loading-screen" style={styles.container}>
      <ActivityIndicator color={styles.indicator.color} size="large" />
      <Text style={styles.title}>{label}</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: '#0b0b0b'
  },
  indicator: {
    color: '#f4f4f4'
  },
  title: {
    marginTop: 16,
    fontSize: 16,
    color: '#f4f4f4',
    letterSpacing: 0.3
  }
});
