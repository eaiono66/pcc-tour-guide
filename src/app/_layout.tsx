import { useEffect } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import { useFonts } from 'expo-font';
import * as SplashScreen from 'expo-splash-screen';

SplashScreen.preventAutoHideAsync();

export default function RootLayout() {
  const [loaded, error] = useFonts({
    'BebasNeue': require('../../assets/fonts/BebasNeue-Regular.ttf'),
    'InstrumentSerif': require('../../assets/fonts/InstrumentSerif-Italic.ttf'),
    'DMMono': require('../../assets/fonts/DMMono-Regular.ttf'),
    'DMMonoMedium': require('../../assets/fonts/DMMono-Medium.ttf'),
  });

  useEffect(() => {
    if (loaded || error) SplashScreen.hideAsync();
  }, [loaded, error]);

  if (!loaded && !error) return null;

  return (
    <>
      <StatusBar style="light" />
      <Stack screenOptions={{ headerShown: false }} />
    </>
  );
}
