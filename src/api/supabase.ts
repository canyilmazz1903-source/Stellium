import 'react-native-url-polyfill/auto';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { createClient } from '@supabase/supabase-js';

// Expo automatically loads environment variables starting with EXPO_PUBLIC_ from .env files
const supabaseUrl = process.env.EXPO_PUBLIC_SUPABASE_URL || 'https://your-placeholder-supabase-url.supabase.co';
const supabaseAnonKey = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY || 'your-placeholder-supabase-anon-key';

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    storage: AsyncStorage,
    autoRefreshToken: true,
    persistSession: true,
    detectSessionInUrl: false, // Disabled in React Native to avoid redirect loops
  },
});
