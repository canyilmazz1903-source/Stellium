import React from 'react';
import { Pressable, StyleSheet, Text, ViewStyle, TextStyle, StyleProp } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import Animated, { useSharedValue, useAnimatedStyle, withSpring } from 'react-native-reanimated';

const AnimatedPressable = Animated.createAnimatedComponent(Pressable);

interface CosmicButtonProps {
  title: string;
  onPress: () => void;
  variant?: 'gold' | 'outline' | 'ghost';
  style?: StyleProp<ViewStyle>;
  textStyle?: TextStyle;
  disabled?: boolean;
}

export default function CosmicButton({
  title,
  onPress,
  variant = 'gold',
  style,
  textStyle,
  disabled = false,
}: CosmicButtonProps) {
  const scale = useSharedValue(1);

  const animatedStyle = useAnimatedStyle(() => {
    return {
      transform: [{ scale: scale.value }],
    };
  });

  const handlePressIn = () => {
    if (disabled) return;
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(0.95, { damping: 10, stiffness: 120 });
  };

  const handlePressOut = () => {
    if (disabled) return;
    // eslint-disable-next-line react-hooks/immutability
    scale.value = withSpring(1, { damping: 10, stiffness: 120 });
  };

  if (variant === 'outline') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={[styles.outlineButton, animatedStyle, style, disabled && styles.disabled]}
      >
        <Text style={[styles.outlineText, textStyle]}>{title}</Text>
      </AnimatedPressable>
    );
  }

  if (variant === 'ghost') {
    return (
      <AnimatedPressable
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        onPress={onPress}
        disabled={disabled}
        style={[styles.ghostButton, animatedStyle, style, disabled && styles.disabled]}
      >
        <Text style={[styles.ghostText, textStyle]}>{title}</Text>
      </AnimatedPressable>
    );
  }

  // Premium gold-to-brass metallic gradient button
  return (
    <AnimatedPressable
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
      onPress={onPress}
      disabled={disabled}
      style={[animatedStyle, style]}
    >
      <LinearGradient
        colors={disabled ? ['#30363D', '#21262D'] : ['#F3E5AB', '#D4AF37', '#AA7C11']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.goldButton}
      >
        <Text style={[styles.goldText, textStyle, disabled && styles.disabledText]}>{title}</Text>
      </LinearGradient>
    </AnimatedPressable>
  );
}

const styles = StyleSheet.create({
  goldButton: {
    borderRadius: 25,
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 6 },
    shadowOpacity: 0.35,
    shadowRadius: 10,
    elevation: 4,
  },
  goldText: {
    color: '#0D1117', // Dark contrast text on gold
    fontSize: 16,
    fontWeight: '700',
    letterSpacing: 0.8,
  },
  outlineButton: {
    borderRadius: 25,
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.4)',
    backgroundColor: 'transparent',
    paddingVertical: 14,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  outlineText: {
    color: '#D4AF37',
    fontSize: 16,
    fontWeight: '600',
    letterSpacing: 0.5,
  },
  ghostButton: {
    paddingVertical: 12,
    paddingHorizontal: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  ghostText: {
    color: '#8B949E',
    fontSize: 14,
    fontWeight: '500',
  },
  disabled: {
    borderColor: '#30363D',
    opacity: 0.5,
  },
  disabledText: {
    color: '#8B949E',
  },
});
