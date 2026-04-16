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
import { ThemeProvider } from "../src/context/ThemeContext";
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

  // ─── Listener pour notifications tappées (foreground et background) ────────

  useEffect(() => {
    // Gérer les notifications sur lesquelles l'utilisateur a cliqué
    const subscription = Notifications.addNotificationResponseReceivedListener(
      (response) => {
        handleNotificationNavigation(response.notification);
      }
    );

    return () => subscription.remove();
  }, [router]);

  // ─── Gérer les notifications qui ont lancé l'app ────────────────────────

  useEffect(() => {
    // Vérifier la dernière notification qui a lancé l'app
    Notifications.getLastNotificationResponseAsync().then((response) => {
      if (response?.notification) {
        handleNotificationNavigation(response.notification);
      }
    });
  }, [router]);

  // ─── Fonction helper pour naviguer depuis une notification ────────────────

  const handleNotificationNavigation = (notification: Notifications.Notification) => {
    try {
      const missionId = (notification.request.content.data?.missionId as string) || 
                        (notification.request.content.data?.id as string);

      if (missionId) {
        router.push(`/mission/${missionId}`);
        console.log('[RootLayout] Navigation vers mission:', missionId);
      }
    } catch (err) {
      console.error('[RootLayout] Erreur navigation notification:', err);
    }
  };

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
      <ThemeProvider>
        <AuthProvider>
          <RootLayoutNav />
        </AuthProvider>
      </ThemeProvider>
    </SafeAreaProvider>
  );
}
