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
 * - Configurer le listener pour les notifications push
 *
 * Note: Le groupe (tabs) est automatiquement chargé comme route initiale
 * car il contient un index.tsx
 */

import { Stack, useRouter, useSegments } from "expo-router";
import { StatusBar } from "expo-status-bar";
import { SafeAreaProvider } from "react-native-safe-area-context";
import { useEffect } from "react";
import * as Notifications from 'expo-notifications';
import { AuthProvider } from "../src/context/AuthContext";
import { useAuth } from "../src/context/AuthContext";
import { initNotificationHandler } from "../src/lib/notifications";

// Initialiser le handler dès le démarrage de l'app, avant tout rendu.
initNotificationHandler();

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

  // ─── Listener pour notifications entrantes (foreground et background) ────────

  useEffect(() => {
    // Écouter les notifications reçues en foreground
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        const { notification } = response;
        const missionId = notification.request.content.data?.missionId as string | undefined;

        if (missionId) {
          // Rediriger vers le détail de la mission
          router.push(`/mission/${missionId}`);
        }
      }
    );

    return () => subscription.remove();
  }, [router]);

  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/login" options={{ headerShown: false }} />
      <Stack.Screen name="(auth)/register" options={{ headerShown: false }} />
      <Stack.Screen name="mission/[id]/index" options={{ headerShown: false }} />
      <Stack.Screen name="mission/[id]/modify" options={{ headerShown: false }} />
      <Stack.Screen name="mission/[id]/delete" options={{ headerShown: false }} />
      <Stack.Screen name="mission/[id]/create" options={{ headerShown: false }} />
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
