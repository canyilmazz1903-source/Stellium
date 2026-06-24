import React from 'react';
import { StyleSheet, View, ViewStyle, Platform } from 'react-native';
import { BlurView } from 'expo-blur';

interface GlassCardProps {
  children: React.ReactNode;
  style?: ViewStyle;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  borderColor?: string;
}

export default function GlassCard({
  children,
  style,
  intensity = 30,
  tint = 'dark',
  borderColor = 'rgba(212, 175, 55, 0.18)', // Antique Gold / Brass transparent border
}: GlassCardProps) {
  const isAndroid = Platform.OS === 'android';

  const cardStyle = [
    styles.card,
    { borderColor },
    // On Android, blur is simulated using a darker solid semi-transparent obsidian color
    isAndroid && { backgroundColor: 'rgba(22, 27, 34, 0.88)' }, 
    style,
  ];

  if (isAndroid) {
    return <View style={cardStyle}>{children}</View>;
  }

  return (
    <BlurView intensity={intensity} tint={tint} style={cardStyle}>
      {children}
    </BlurView>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 1,
    padding: 20,
    overflow: 'hidden',
    // Premium soft shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
});
