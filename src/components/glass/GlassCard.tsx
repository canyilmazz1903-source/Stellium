import React from 'react';
import { StyleSheet, View, ViewStyle, StyleProp } from 'react-native';
import { BlurView } from 'expo-blur';

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
  intensity = 35,
  tint = 'dark',
  borderColor = 'rgba(255, 255, 255, 0.08)',
  className,
}: GlassCardProps) {
  const cardStyle = [
    styles.card,
    { borderColor },
    style,
  ];

  return (
    <View style={cardStyle} className={className}>
      <BlurView
        intensity={intensity}
        tint={tint}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.contentContainer}>
        {children}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    borderWidth: 0.8,
    overflow: 'hidden',
    backgroundColor: 'rgba(12, 16, 26, 0.75)',
    // Premium soft shadow
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 10 },
    shadowOpacity: 0.45,
    shadowRadius: 18,
    elevation: 8,
  },
  contentContainer: {
    padding: 20,
    backgroundColor: 'transparent',
  },
});


