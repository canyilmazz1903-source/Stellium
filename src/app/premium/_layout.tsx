import React from 'react';
import { Stack } from 'expo-router';
import { Platform } from 'react-native';

export default function PremiumLayout() {
  return (
    <Stack
      screenOptions={{
        headerStyle: {
          backgroundColor: '#0D1117',
        },
        headerTintColor: '#D4AF37',
        headerTitleStyle: {
          fontFamily: 'Cinzel',
          fontSize: 16,
          fontWeight: '700',
        },
        headerShadowVisible: false,
        headerBackTitle: 'Geri',
        headerBackTitleStyle: {
          fontFamily: 'Inter',
          fontSize: 14,
        },
        contentStyle: {
          backgroundColor: '#0D1117',
        },
        animation: Platform.OS === 'ios' ? 'default' : 'slide_from_right',
      }}
    >
      <Stack.Screen
        name="transit"
        options={{
          title: 'TRANSİT ANALİZİ',
        }}
      />
      <Stack.Screen
        name="synastry"
        options={{
          title: 'SİNASTRİ UYUMU',
        }}
      />
      <Stack.Screen
        name="yildizname"
        options={{
          title: 'YILDIZNAME RAPORU',
        }}
      />
    </Stack>
  );
}
