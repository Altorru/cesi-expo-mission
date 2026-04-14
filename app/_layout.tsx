/**
 * Layout Racine - Point d'entrée de l'application
 *
 * Ce fichier définit la structure globale de l'application.
 * Il enveloppe toutes les routes avec les providers nécessaires.
 */

/**
 * RootLayout - Layout principal de l'application
 *
 * Responsabilités :
 * - Fournir le SafeAreaProvider pour gérer les encoches iOS/Android
 * - Configurer la navigation Stack
 * - Gérer la StatusBar
 *
 * Note: Le groupe (tabs) est automatiquement chargé comme route initiale
 * car il contient un index.tsx
 */

import { useEffect } from "react";
import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";

/**
 * Composant séparé car useAuth() nécessite d'être
 * à l'intérieur de AuthProvider
 */
function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <RootLayoutNav />
    </SafeAreaProvider>
  );
}
