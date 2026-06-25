import React from 'react';
import { StyleSheet, View, ViewStyle } from 'react-native';

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
  borderColor = 'rgba(212, 175, 55, 0.18)', // Antique Gold / Brass transparent border
}: GlassCardProps) {
  const cardStyle = [
    styles.card,
    { borderColor, backgroundColor: 'rgba(22, 27, 34, 0.88)' }, 
    style,
  ];

  return <View style={cardStyle}>{children}</View>;
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

