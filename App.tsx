import React from 'react';
import { NavigationContainer, DarkTheme, DefaultTheme } from '@react-navigation/native';
import { useColorScheme } from 'react-native';
import { AppNavigator } from './src/navigation/AppNavigator';

// App root component that wires navigation and system dark mode.
export default function App() {
  // Reads iOS appearance setting to optionally apply dark theme.
  const scheme = useColorScheme();

  return (
    <NavigationContainer theme={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <AppNavigator />
    </NavigationContainer>
  );
}
