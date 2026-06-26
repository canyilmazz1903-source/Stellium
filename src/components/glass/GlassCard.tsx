import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';

interface GlassCardProps {
  children: React.ReactNode;
  style?: StyleProp<ViewStyle>;
  intensity?: number;
  tint?: 'dark' | 'light' | 'default';
  borderColor?: string;
  className?: string;
}

export default function GlassCard({
  children,
  style,
  borderColor = 'rgba(255, 255, 255, 0.1)', // Ethereal white border
  className,
}: GlassCardProps) {
  const cardStyle = [
    styles.card,
    { borderColor, backgroundColor: 'rgba(15, 20, 30, 0.88)' }, 
    style,
  ];

  return <View style={cardStyle} className={className}>{children}</View>;
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

