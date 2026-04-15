import { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { globalStyles } from "@/styles/theme";
import {
  registerForPushNotificationsAsync,
  sendLocalNotification,
  sendPushNotificationToAll,
} from "@/lib/notifications";

type TokenStatus = "loading" | "unavailable" | string;

export default function App() {
  const [tokenStatus, setTokenStatus] = useState<TokenStatus>("loading");
  const [sendingAll, setSendingAll] = useState(false);

  useEffect(() => {
    registerForPushNotificationsAsync()
      .then((token) => setTokenStatus(token ?? "unavailable"))
      .catch(() => setTokenStatus("unavailable"));
  }, []);

  const handleTestNotification = async () => {
    try {
      await sendLocalNotification(
        "Test DEV 🔔",
        "La notification locale fonctionne correctement !",
        { screen: "home" }
      );
      Alert.alert("Notif envoyée", "Tu la recevras dans ~1 seconde.");
    } catch (e) {
      Alert.alert("Erreur", String(e));
    }
  };

  const handleSendToAll = async () => {
    setSendingAll(true);
    try {
      await sendPushNotificationToAll({
        title: "📢 Message à tous",
        body: "Ceci est une notification envoyée à tous les utilisateurs.",
        data: { screen: "home" },
      });
      Alert.alert("Succès", "Notification envoyée à tous les utilisateurs.");
    } catch (e) {
      Alert.alert("Erreur", String(e));
    } finally {
      setSendingAll(false);
    }
  };

  const tokenDisplay = () => {
    if (tokenStatus === "loading") return { text: "Chargement…", color: "#a6adc8" };
    if (tokenStatus === "unavailable")
      return {
        text: "Non disponible (Expo Go / simulateur)\nUtilise un dev build pour les push tokens.",
        color: "#f38ba8",
      };
    return { text: tokenStatus, color: "#a6e3a1" };
  };

  const { text, color } = tokenDisplay();

  return (
    <SafeAreaView style={globalStyles.container}>
      <View style={globalStyles.container}>
        <Text style={globalStyles.title}>Bienvenue !</Text>

        <View style={styles.debugPanel}>
          <Text style={styles.debugTitle}>🛠 Debug Notifications</Text>

          <Text style={styles.tokenLabel}>Expo Push Token :</Text>
          <Text style={[styles.tokenValue, { color }]} selectable>
            {text}
          </Text>

          <TouchableOpacity style={styles.button} onPress={handleTestNotification}>
            <Text style={styles.buttonText}>Envoyer une notif locale</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[styles.button, styles.buttonDanger, sendingAll && styles.buttonDisabled]}
            onPress={handleSendToAll}
            disabled={sendingAll}
          >
            {sendingAll ? (
              <ActivityIndicator color="#1e1e2e" />
            ) : (
              <Text style={styles.buttonText}>📢 Notifier tous les utilisateurs</Text>
            )}
          </TouchableOpacity>
        </View>
      </View>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  debugPanel: {
    marginTop: 32,
    marginHorizontal: 16,
    padding: 16,
    borderRadius: 12,
    backgroundColor: "#1e1e2e",
    gap: 8,
  },
  debugTitle: {
    color: "#cdd6f4",
    fontWeight: "700",
    fontSize: 16,
    marginBottom: 4,
  },
  tokenLabel: {
    color: "#a6adc8",
    fontSize: 12,
  },
  tokenValue: {
    fontSize: 11,
    fontFamily: "monospace",
  },
  button: {
    marginTop: 12,
    backgroundColor: "#89b4fa",
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: "center",
  },
  buttonDanger: {
    backgroundColor: "#f38ba8",
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: "#1e1e2e",
    fontWeight: "700",
    fontSize: 14,
  },
});
