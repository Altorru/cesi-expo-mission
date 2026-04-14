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

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import { AuthProvider } from "../src/context/AuthContext";
import { useAuth } from "../src/context/AuthContext";

/**
 * Composant séparé car useAuth() nécessite d'être
 * à l'intérieur de AuthProvider
 */
function RootLayoutNav() {
  const segments = useSegments();
  const router = useRouter();
  const { session, isLoading } = useAuth();

  useEffect(() => {
    if (isLoading) return;

    const inAuthGroup = segments[0] === '(auth)';

    if (!session && !inAuthGroup) {
      // Pas de session → rediriger vers login
      router.replace('/(auth)/login');
    } else if (session && inAuthGroup) {
      // Session active → rediriger vers l'app
      router.replace('/(tabs)');
    }
  }, [session, isLoading, segments]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
      <Stack.Screen name="mission/[id]" options={{ headerShown: false }} />
    </Stack>
  );
}

export default function RootLayout() {
  return (
    <SafeAreaProvider>
      <StatusBar style="auto" />
      <AuthProvider>
        <RootLayoutNav />
      </AuthProvider>
    </SafeAreaProvider>
  );
}
