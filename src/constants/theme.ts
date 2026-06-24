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
    background: '#0D1117',         // Deep night blue
    backgroundElement: '#161B22',  // Obsidian / dark grey
    backgroundSelected: '#21262D', // Light accent
    textSecondary: '#8B949E',      // Stardust grey
    gold: '#D4AF37',               // Antique gold
    goldLight: '#F3E5AB',          // Warm gold highlight
    goldDark: '#8C6D12',           // Brass shadow
  },
} as const;

export type ThemeColor = keyof typeof Colors.dark;

export const Fonts = Platform.select({
  ios: {
    sans: 'Inter',
    serif: 'Cinzel', // Main header font
    serifSub: 'CormorantGaramond',
    rounded: 'System',
    mono: 'Courier',
  },
  default: {
    sans: 'System',
    serif: 'serif',
    serifSub: 'serif',
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
  border: 'rgba(212, 175, 55, 0.15)', // Antique gold subtle border
  bg: 'rgba(22, 27, 34, 0.65)',        // Semi-transparent obsidian
  blur: 20,                            // Blur intensity
  shadow: {
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.4,
    shadowRadius: 16,
    elevation: 8,
  }
};
