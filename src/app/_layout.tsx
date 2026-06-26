import React, { useEffect } from 'react';
import { ThemeProvider, DarkTheme, Stack, useRouter, useSegments } from 'expo-router';
import { ActivityIndicator, View, StyleSheet, StatusBar } from 'react-native';
import { useAuthStore } from '@/store/authStore';
import { supabase } from '@/api/supabase';
import { useFonts, Inter_400Regular, Inter_600SemiBold, Inter_700Bold } from '@expo-google-fonts/inter';

export default function RootLayout() {
  const { session, isLoading, profile, setSession, setUser, initialize } = useAuthStore();
  const segments = useSegments();
  const router = useRouter();

  // Load design fonts
  const [fontsLoaded] = useFonts({
    Inter: Inter_400Regular,
    InterSemiBold: Inter_600SemiBold,
    InterBold: Inter_700Bold,
    // Map old fonts to Inter to prevent layout crashes
    Cinzel: Inter_700Bold,
    CinzelBold: Inter_700Bold,
    CormorantGaramond: Inter_400Regular,
    CormorantGaramondSemiBold: Inter_600SemiBold,
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

    const inAuthGroup = (segments as string[])[0] === '(auth)';
    const isCompleteProfileScreen = (segments as string[])[1] === 'complete-profile';

    if (!session) {
      if (!inAuthGroup) {
        // Redirect to login if user session is inactive
        router.replace('/(auth)/login');
      }
    } else {
      const isProfileComplete = profile && profile.name && profile.birth_date && profile.birth_place;
      
      if (!isProfileComplete) {
        if (!isCompleteProfileScreen) {
          // Redirect to complete profile screen if details are missing
          router.replace('/(auth)/complete-profile');
        }
      } else {
        if (inAuthGroup) {
          // Redirect to dashboard tabs if user session is active and profile complete
          router.replace('/(tabs)');
        }
      }
    }
  }, [session, profile, isLoading, segments, fontsLoaded, router]);

  if (isLoading || !fontsLoaded) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#D4AF37" />
      </View>
    );
  }

  return (
    <ThemeProvider value={DarkTheme}>
      <StatusBar barStyle="light-content" backgroundColor="#000000" />
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="(tabs)" />
        <Stack.Screen name="(auth)" />
        <Stack.Screen 
          name="premium/transit" 
          options={{ 
            headerShown: true, 
            title: 'TRANSİT ANALİZİ', 
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#D4AF37',
            headerTitleStyle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700' },
            headerShadowVisible: false,
            headerBackTitle: 'Geri',
            headerBackTitleStyle: { fontFamily: 'Inter', fontSize: 14 },
            gestureEnabled: true,
            gestureResponseDistance: { start: 120 },
          }} 
        />
        <Stack.Screen 
          name="premium/synastry" 
          options={{ 
            headerShown: true, 
            title: 'SİNASTRİ UYUMU', 
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#D4AF37',
            headerTitleStyle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700' },
            headerShadowVisible: false,
            headerBackTitle: 'Geri',
            headerBackTitleStyle: { fontFamily: 'Inter', fontSize: 14 },
            gestureEnabled: true,
            gestureResponseDistance: { start: 120 },
          }} 
        />
        <Stack.Screen 
          name="premium/yildizname" 
          options={{ 
            headerShown: true, 
            title: 'YILDIZNAME RAPORU', 
            headerStyle: { backgroundColor: '#000000' },
            headerTintColor: '#D4AF37',
            headerTitleStyle: { fontFamily: 'Inter', fontSize: 16, fontWeight: '700' },
            headerShadowVisible: false,
            headerBackTitle: 'Geri',
            headerBackTitleStyle: { fontFamily: 'Inter', fontSize: 14 },
            gestureEnabled: true,
            gestureResponseDistance: { start: 120 },
          }} 
        />
      </Stack>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  loadingContainer: {
    flex: 1,
    backgroundColor: '#000000',
    justifyContent: 'center',
    alignItems: 'center',
  },
});
