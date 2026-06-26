import '../global.css';
import { Platform } from 'react-native';

export const Colors = {
  // We keep a single dark-academia oriented palette for both light/dark,
  // or define a premium dark mode as the default experience
  light: {
    text: '#0D1117',
    background: '#F0F2F5',
    backgroundElement: '#FFFFFF',
    backgroundSelected: '#E2E8F0',
    textSecondary: '#4A5568',
    gold: '#AA7C11',
    goldLight: '#D4AF37',
  },
  dark: {
    text: '#F0F6FC',               // Light text for dark bg
    background: '#000000',         // Pure OLED Black
    backgroundElement: '#121212',  // Very dark grey
    backgroundSelected: '#1C1C1E', // Dark accent
    textSecondary: '#8E8E93',      // Slate grey
    gold: '#D4AF37',               // Antique gold
    goldLight: '#F3E5AB',          // Warm gold highlight
    goldDark: '#8C6D12',           // Brass shadow
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter',
    serif: 'Inter', // Sans-Serif only for Ethereal Aura
    serifSub: 'Inter',
    rounded: 'System',
    mono: 'Courier',
  },
  default: {
    sans: 'System',
    serif: 'System',
    serifSub: 'System',
    rounded: 'System',
    mono: 'monospace',
  },
});

export const Spacing = {
  half: 2,
  one: 4,
  two: 8,
  three: 16,
  four: 24,
  five: 32,
  six: 64,
} as const;

export const BottomTabInset = Platform.select({ ios: 50, android: 80 }) ?? 0;
export const MaxContentWidth = 800;

// Glassmorphism styling tokens for custom UI components
export const Glass = {
  border: 'rgba(255, 255, 255, 0.1)', // Subtle white transparent border
  bg: 'rgba(15, 20, 30, 0.7)',        // Ethereal dark blue-grey tint
  blur: 20,                            // Blur intensity
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  }
};
