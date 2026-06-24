import React, { useEffect } from 'react';
import { ThemeProvider, DarkTheme, Slot, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/api/supabase';
import { useFonts, Cinzel_400Regular, Cinzel_700Bold } from '@expo-google-fonts/cinzel';
import { CormorantGaramond_400Regular, CormorantGaramond_600SemiBold } from '@expo-google-fonts/cormorant-garamond';
import { Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function RootLayout() {
  const { session, isLoading, setSession, setUser, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Load design fonts
  const [fontsLoaded] = useFonts({
    Cinzel: Cinzel_400Regular,
    CinzelBold: Cinzel_700Bold,
    CormorantGaramond: CormorantGaramond_400Regular,
    CormorantGaramondSemiBold: CormorantGaramond_600SemiBold,
    Inter: Inter_400Regular,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
  });

  // 1. Initialize Supabase session on startup
  useEffect(() => {
    initialize();

    // 2. Set up auth state change listeners
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
        
        // Retrieve custom user profile if session changes
        if (session?.user) {
          useAuthStore.getState().initialize();
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [initialize, setSession, setUser]);

  // 3. Handle navigation gating
  useEffect(() => {
    if (isLoading || !fontsLoaded) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Redirect to login if user session is inactive
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Redirect to dashboard tabs if user session is active
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments, fontsLoaded, router]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#0D1117" />
      <Slot />
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#0D1117',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
