import { DarkTheme, NavigationContainer } from '@react-navigation/native';
import { StatusBar } from 'expo-status-bar';
import React from 'react';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { colors } from './src/constants/theme';
import { AppNavigator } from './src/navigation/AppNavigator';

// App-wide navigation theme built on our dark palette.
const navTheme = {
  ...DarkTheme,
  colors: {
    ...DarkTheme.colors,
    background: colors.bg,
    card: colors.bgElevated,
    text: colors.text,
    border: colors.border,
    primary: colors.primary,
    notification: colors.accent,
  },
};

// App root component that wires navigation and theming.
export default function App() {
  return (
    <SafeAreaProvider>
      <StatusBar style="light" />
      <NavigationContainer theme={navTheme}>
        <AppNavigator />
      </NavigationContainer>
    </SafeAreaProvider>
  );
}
