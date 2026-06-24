import React, { useState } from 'react';
import { StyleSheet, TextInput, View, Text, ViewStyle, TextStyle } from 'react-native';

interface CosmicInputProps {
  value: string;
  onChangeText: (text: string) => void;
  placeholder?: string;
  label?: string;
  secureTextEntry?: boolean;
  keyboardType?: 'default' | 'email-address' | 'numeric' | 'phone-pad';
  style?: ViewStyle;
  inputStyle?: TextStyle;
  error?: string;
}

export default function CosmicInput({
  value,
  onChangeText,
  placeholder,
  label,
  secureTextEntry,
  keyboardType = 'default',
  style,
  inputStyle,
  error,
}: CosmicInputProps) {
  const [isFocused, setIsFocused] = useState(false);

  return (
    <View style={[styles.container, style]}>
      {label && <Text style={styles.label}>{label}</Text>}
      <View
        style={[
          styles.inputContainer,
          isFocused && styles.inputFocused,
          error ? styles.inputError : null,
        ]}
      >
        <TextInput
          value={value}
          onChangeText={onChangeText}
          placeholder={placeholder}
          placeholderTextColor="#8B949E" // Stardust grey placeholder
          secureTextEntry={secureTextEntry}
          keyboardType={keyboardType}
          onFocus={() => setIsFocused(true)}
          onBlur={() => setIsFocused(false)}
          style={[styles.input, inputStyle]}
          autoCapitalize="none"
        />
      </View>
      {error && <Text style={styles.errorText}>{error}</Text>}
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    marginBottom: 16,
    width: '100%',
  },
  label: {
    color: '#D4AF37', // Antique gold
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 6,
    letterSpacing: 0.5,
  },
  inputContainer: {
    backgroundColor: 'rgba(22, 27, 34, 0.75)', // Glass obsidian background
    borderWidth: 1,
    borderColor: 'rgba(212, 175, 55, 0.15)', // Gold glass border
    borderRadius: 12,
    height: 52,
    justifyContent: 'center',
    paddingHorizontal: 16,
  },
  inputFocused: {
    borderColor: '#D4AF37', // Bright gold glow on focus
    shadowColor: '#D4AF37',
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.2,
    shadowRadius: 6,
  },
  inputError: {
    borderColor: '#FF7B72', // Warning red
  },
  input: {
    color: '#F0F6FC', // Bright text
    fontSize: 16,
    width: '100%',
  },
  errorText: {
    color: '#FF7B72',
    fontSize: 12,
    marginTop: 4,
  },
});
