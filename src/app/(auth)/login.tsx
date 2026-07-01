import React, { useState, useEffect } from 'react';
import { StyleSheet, Text, View, KeyboardAvoidingView, Platform, ScrollView, Alert } from 'react-native';
import { useRouter } from 'expo-router';
import * as AppleAuthentication from 'expo-apple-authentication';
import { supabase } from '@/api/supabase';
import CosmicInput from '@/components/ui/CosmicInput';
import CosmicButton from '@/components/ui/CosmicButton';
import GlassCard from '@/components/glass/GlassCard';
import { BlurView } from 'expo-blur';
import Animated, { useSharedValue, useAnimatedStyle, withTiming, withRepeat, Easing } from 'react-native-reanimated';

export default function LoginScreen() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [appleAuthAvailable, setAppleAuthAvailable] = useState(false);
  const router = useRouter();

  // Check if Apple Sign In is available (available on iOS devices)
  useEffect(() => {
    AppleAuthentication.isAvailableAsync().then(setAppleAuthAvailable);
  }, []);

  // Reanimated shared values for background aura colors
  const breatheScale1 = useSharedValue(1);
  const breatheOpacity1 = useSharedValue(0.12);
  const breatheScale2 = useSharedValue(1);
  const breatheOpacity2 = useSharedValue(0.08);

  useEffect(() => {
    breatheScale1.value = withRepeat(
      withTiming(1.2, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    breatheOpacity1.value = withRepeat(
      withTiming(0.2, { duration: 6000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );

    breatheScale2.value = withRepeat(
      withTiming(1.3, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
    breatheOpacity2.value = withRepeat(
      withTiming(0.16, { duration: 8000, easing: Easing.inOut(Easing.ease) }),
      -1,
      true
    );
  }, []);

  const animatedAuraStyle1 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breatheScale1.value }],
      opacity: breatheOpacity1.value,
    };
  });

  const animatedAuraStyle2 = useAnimatedStyle(() => {
    return {
      transform: [{ scale: breatheScale2.value }],
      opacity: breatheOpacity2.value,
    };
  });

  const handleLogin = async () => {
    if (!email || !password) {
      setError('Lütfen e-posta ve şifrenizi doldurun.');
      return;
    }
    setError('');
    setLoading(false);
    
    try {
      setLoading(true);
      const { error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setError(error.message === 'Invalid login credentials' ? 'E-posta veya şifre hatalı.' : error.message);
      }
    } catch (err: any) {
      setError(err.message || 'Giriş yapılırken beklenmedik bir hata oluştu.');
    } finally {
      setLoading(false);
    }
  };

  const handleAppleSignIn = async () => {
    try {
      const credential = await AppleAuthentication.signInAsync({
        requestedScopes: [
          AppleAuthentication.AppleAuthenticationScope.FULL_NAME,
          AppleAuthentication.AppleAuthenticationScope.EMAIL,
        ],
      });

      if (credential.identityToken) {
        setLoading(true);
        const { error } = await supabase.auth.signInWithIdToken({
          provider: 'apple',
          token: credential.identityToken,
        });

        if (error) {
          Alert.alert('Apple Giriş Hatası', error.message);
        }
      }
    } catch (e: any) {
      if (e.code !== 'ERR_REQUEST_CANCELED') {
        Alert.alert('Giriş İptal Edildi', 'Apple ile giriş işlemi iptal edildi veya başarısız oldu.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.mainWrapper}>
      {/* Dynamic Auric Gradient Background */}
      <Animated.View 
        style={[
          styles.auricBackground,
          {
            backgroundColor: '#B2F7EF',
            top: -150,
            right: -150,
            width: 400,
            height: 400,
            borderRadius: 200,
          },
          animatedAuraStyle1
        ]}
      />
      <Animated.View 
        style={[
          styles.auricBackground,
          {
            backgroundColor: '#EFF7F6',
            bottom: -100,
            left: -100,
            width: 360,
            height: 360,
            borderRadius: 180,
          },
          animatedAuraStyle2
        ]}
      />
      
      {/* BlurView to make the aura soft and ethereal */}
      <BlurView intensity={90} tint="dark" style={StyleSheet.absoluteFill} />

      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        enabled={true}
        style={styles.container}
      >
      <ScrollView 
        contentContainerStyle={styles.scrollContainer} 
        keyboardShouldPersistTaps="handled"
        automaticallyAdjustKeyboardInsets={false}
      >
        <View style={styles.headerContainer}>
          <Text style={styles.title}>Stellium</Text>
          <Text style={styles.subtitle}>Mistisizm ve Astroloji Akademisi</Text>
        </View>

        <GlassCard style={styles.card}>
          <Text style={styles.cardTitle}>Kozmik Giriş</Text>
          
          <CosmicInput
            label="E-Posta Adresi"
            placeholder="ornek@kozmik.com"
            value={email}
            onChangeText={setEmail}
            keyboardType="email-address"
            error={error ? ' ' : undefined} // Reserves height for layout stability
          />

          <CosmicInput
            label="Şifre"
            placeholder="••••••"
            value={password}
            onChangeText={setPassword}
            secureTextEntry
          />

          {error ? <Text style={styles.errorText}>{error}</Text> : null}

          <CosmicButton
            title={loading ? 'Bağlanıyor...' : 'Giriş Yap'}
            onPress={handleLogin}
            disabled={loading}
            style={styles.button}
          />

          {appleAuthAvailable ? (
            <AppleAuthentication.AppleAuthenticationButton
              buttonType={AppleAuthentication.AppleAuthenticationButtonType.SIGN_IN}
              buttonStyle={AppleAuthentication.AppleAuthenticationButtonStyle.WHITE_OUTLINE}
              cornerRadius={25}
              style={styles.appleButton}
              onPress={handleAppleSignIn}
            />
          ) : null}

          <CosmicButton
            title="Doğum Haritası Oluştur (Kayıt Ol)"
            onPress={() => router.push('/(auth)/register')}
            variant="ghost"
            style={styles.registerButton}
          />
        </GlassCard>
      </ScrollView>
    </KeyboardAvoidingView>
  </View>
  );
}

const styles = StyleSheet.create({
  mainWrapper: {
    flex: 1,
    backgroundColor: '#0B0F19',
  },
  auricBackground: {
    position: 'absolute',
    opacity: 0.12,
  },
  container: {
    flex: 1,
    backgroundColor: 'transparent',
  },
  scrollContainer: {
    flexGrow: 1,
    padding: 24,
    paddingTop: 60,
    paddingBottom: 40,
  },
  headerContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  title: {
    fontFamily: 'Cinzel',
    fontSize: 38,
    color: '#D4AF37', // Antique Gold
    fontWeight: '700',
    letterSpacing: 2,
    textAlign: 'center',
    textShadowColor: 'rgba(212, 175, 55, 0.3)',
    textShadowOffset: { width: 0, height: 4 },
    textShadowRadius: 10,
  },
  subtitle: {
    fontFamily: 'Inter',
    fontSize: 14,
    color: '#8B949E', // Stardust Grey
    marginTop: 8,
    letterSpacing: 1,
  },
  card: {
    width: '100%',
  },
  cardTitle: {
    fontFamily: 'Cinzel',
    fontSize: 22,
    color: '#F0F6FC',
    fontWeight: '600',
    marginBottom: 24,
    textAlign: 'center',
    letterSpacing: 1,
  },
  button: {
    marginTop: 16,
  },
  appleButton: {
    width: '100%',
    height: 48,
    marginTop: 12,
  },
  registerButton: {
    marginTop: 16,
  },
  errorText: {
    color: '#FF7B72',
    fontSize: 14,
    textAlign: 'center',
    marginBottom: 16,
    fontFamily: 'Inter',
  },
});
