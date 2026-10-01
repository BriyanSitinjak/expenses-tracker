import { DarkTheme, DefaultTheme, NavigationContainer } from '@react-navigation/native';
import * as SplashScreen from 'expo-splash-screen';
import { StatusBar } from 'expo-status-bar';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { View } from 'react-native';
import { SafeAreaProvider } from 'react-native-safe-area-context';
import { AppSplash } from './src/components/AppSplash';
import { useAppTheme } from './src/hooks/useAppTheme';
import { AppNavigator } from './src/navigation/AppNavigator';
import { useBudgetStore } from './src/store/budgetStore';
import { useThemeStore } from './src/store/themeStore';

SplashScreen.preventAutoHideAsync().catch(() => {
  // Ignore if the splash module is unavailable (e.g. web).
});

function waitForPersistHydration(store: {
  persist: {
    hasHydrated: () => boolean;
    onFinishHydration: (cb: () => void) => () => void;
  };
}): Promise<void> {
  if (store.persist.hasHydrated()) return Promise.resolve();
  return new Promise((resolve) => {
    const unsub = store.persist.onFinishHydration(() => {
      unsub();
      resolve();
    });
  });
}

// App root component that wires splash, navigation, and theming.
export default function App() {
  const { colors, isDark } = useAppTheme();
  const [appReady, setAppReady] = useState(false);
  const [showBrandSplash, setShowBrandSplash] = useState(true);

  const navTheme = useMemo(
    () => ({
      ...(isDark ? DarkTheme : DefaultTheme),
      colors: {
        ...(isDark ? DarkTheme.colors : DefaultTheme.colors),
        background: colors.bg,
        card: colors.bgElevated,
        text: colors.text,
        border: colors.border,
        primary: colors.primary,
        notification: colors.accent,
      },
    }),
    [colors, isDark]
  );

  useEffect(() => {
    let cancelled = false;

    async function prepare() {
      try {
        await Promise.all([
          waitForPersistHydration(useThemeStore),
          waitForPersistHydration(useBudgetStore),
        ]);
      } finally {
        if (!cancelled) {
          setAppReady(true);
          await SplashScreen.hideAsync().catch(() => undefined);
        }
      }
    }

    void prepare();
    return () => {
      cancelled = true;
    };
  }, []);

  const handleBrandSplashFinished = useCallback(() => {
    setShowBrandSplash(false);
  }, []);

  if (!appReady) {
    return <View style={{ flex: 1, backgroundColor: colors.bg }} />;
  }

  return (
    <SafeAreaProvider>
      <StatusBar style={isDark ? 'light' : 'dark'} />
      <View style={{ flex: 1, backgroundColor: colors.bg }}>
        <NavigationContainer theme={navTheme}>
          <AppNavigator />
        </NavigationContainer>
        <AppSplash visible={showBrandSplash} onFinished={handleBrandSplashFinished} />
      </View>
    </SafeAreaProvider>
  );
}
