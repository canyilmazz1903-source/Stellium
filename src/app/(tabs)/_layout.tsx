import React from 'react';
import { Tabs } from 'expo-router';
import { BlurView } from 'expo-blur';
import { Platform, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

export default function TabLayout() {
  return (
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: '#D4AF37',   // Gold tint for active tab
        tabBarInactiveTintColor: '#8B949E', // Stardust grey for inactive tab
        tabBarStyle: styles.tabBar,
        tabBarBackground: () => (
          Platform.OS === 'ios' ? (
            <BlurView intensity={30} tint="dark" style={StyleSheet.absoluteFill} />
          ) : null
        ),
        tabBarLabelStyle: styles.tabBarLabel,
      }}
    >
      <Tabs.Screen
        name="index"
        options={{
          title: 'Kozmik',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="sparkles" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="chart"
        options={{
          title: 'Harita',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="compass-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="esma"
        options={{
          title: 'Zikir & Ebced',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="finger-print-outline" size={size} color={color} />
          ),
        }}
      />
      <Tabs.Screen
        name="settings"
        options={{
          title: 'Ayarlar',
          tabBarIcon: ({ color, size }) => (
            <Ionicons name="settings-outline" size={size} color={color} />
          ),
        }}
      />
    </Tabs>
  );
}

const styles = StyleSheet.create({
  tabBar: {
    position: 'absolute',
    borderTopWidth: 1,
    borderTopColor: 'rgba(212, 175, 55, 0.15)', // Antique gold top border
    backgroundColor: Platform.OS === 'ios' ? 'transparent' : '#0D1117', // Android fallback solid background
    height: Platform.OS === 'ios' ? 88 : 64,
    paddingBottom: Platform.OS === 'ios' ? 28 : 10,
    paddingTop: 8,
    elevation: 0,
    shadowOpacity: 0,
  },
  tabBarLabel: {
    fontSize: 11,
    fontWeight: '500',
    fontFamily: 'Inter',
  },
});
