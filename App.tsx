import React from 'react';
import { StatusBar } from 'expo-status-bar';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import MemoryGameScreen from './src/screens/GameScreen';

export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <MemoryGameScreen />
    </SafeAreaProvider>
  );
}
