import React from 'react';
import { View, Text, StyleSheet, Pressable, ScrollView } from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

interface Props {
  children: React.ReactNode;
}

interface State {
  hasError: boolean;
  error: Error | null;
}

// Catches any render/lifecycle error in the tree below it. In a release
// build an uncaught React render error becomes a fatal abort (SIGABRT via
// RCTExceptionsManager) -- i.e. the app just closes. This boundary turns
// that into a recoverable on-screen message and persists the error so it
// can be inspected later from Settings, so the app can never silently die.
export default class ErrorBoundary extends React.Component<Props, State> {
  state: State = { hasError: false, error: null };

  static getDerivedStateFromError(error: Error): State {
    return { hasError: true, error };
  }

  componentDidCatch(error: Error, info: { componentStack?: string }) {
    try {
      AsyncStorage.setItem(
        'stellium_last_fatal_error',
        JSON.stringify({
          message: error?.message ?? String(error),
          stack: error?.stack ?? null,
          componentStack: info?.componentStack ?? null,
          timestamp: new Date().toISOString(),
          source: 'ErrorBoundary',
        })
      ).catch(() => {});
    } catch {
      // Never let error reporting itself throw.
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null });
  };

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <ScrollView contentContainerStyle={styles.content}>
            <Text style={styles.emoji}>🌙</Text>
            <Text style={styles.title}>Kozmik Bir Dalgalanma</Text>
            <Text style={styles.subtitle}>
              Beklenmedik bir sorun oluştu. Endişelenmeyin, verileriniz güvende. Tekrar denemek için aşağıdaki düğmeye dokunun.
            </Text>

            <Pressable
              onPress={this.handleReset}
              style={({ pressed }) => [styles.button, pressed && { opacity: 0.85 }]}
            >
              <Text style={styles.buttonText}>Tekrar Dene</Text>
            </Pressable>

            {__DEV__ && this.state.error && (
              <Text style={styles.errorText} selectable>
                {this.state.error.message}
                {'\n\n'}
                {this.state.error.stack}
              </Text>
            )}
          </ScrollView>
        </View>
      );
    }

    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  content: {
    flexGrow: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 56,
    marginBottom: 20,
  },
  title: {
    fontFamily: 'Inter',
    fontSize: 22,
    fontWeight: '700',
    color: '#D4AF37',
    textAlign: 'center',
    marginBottom: 12,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.6)',
    textAlign: 'center',
    lineHeight: 20,
    marginBottom: 28,
  },
  button: {
    backgroundColor: '#D4AF37',
    paddingHorizontal: 32,
    paddingVertical: 14,
    borderRadius: 14,
  },
  buttonText: {
    fontFamily: 'Inter',
    fontSize: 15,
    fontWeight: '700',
    color: '#0B0F19',
  },
  errorText: {
    fontFamily: 'Inter',
    fontSize: 10,
    color: 'rgba(255, 100, 100, 0.7)',
    marginTop: 28,
    textAlign: 'left',
  },
});
