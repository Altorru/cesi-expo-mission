import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Alert, ActivityIndicator } from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import {
  sendMissionNotification,
  sendMissionNotificationToAll,
} from '@/lib/notifications';
import { colors, spacing, font } from '@/styles/theme';

interface MissionNotificationPanelProps {
  missionId: string;
  missionTitle: string;
}

export function MissionNotificationPanel({
  missionId,
  missionTitle,
}: MissionNotificationPanelProps) {
  const [sendingLocal, setSendingLocal] = useState(false);
  const [sendingAll, setSendingAll] = useState(false);

  const handleSendLocal = async () => {
    setSendingLocal(true);
    try {
      await sendMissionNotification({
        missionId,
        title: `📋 ${missionTitle}`,
        body: 'Une notification locale pour cette mission.',
      });
      Alert.alert('Succès', 'Notification locale envoyée.');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setSendingLocal(false);
    }
  };

  const handleSendToAll = async () => {
    setSendingAll(true);
    try {
      await sendMissionNotificationToAll({
        missionId,
        title: `📋 ${missionTitle}`,
        body: 'Consultez les détails de cette mission.',
      });
      Alert.alert('Succès', 'Notification envoyée à tous les utilisateurs.');
    } catch (e) {
      Alert.alert('Erreur', String(e));
    } finally {
      setSendingAll(false);
    }
  };

  return (
    <View style={styles.panel}>
      <View style={styles.header}>
        <MaterialIcons name="notifications-active" size={18} color={colors.primary} />
        <Text style={styles.title}>Notifications</Text>
      </View>

      <TouchableOpacity
        style={[styles.button, sendingLocal && styles.buttonDisabled]}
        onPress={handleSendLocal}
        disabled={sendingLocal}
      >
        {sendingLocal ? (
          <ActivityIndicator color={colors.background} size={16} />
        ) : (
          <>
            <MaterialIcons name="smartphone" size={16} color={colors.background} />
            <Text style={styles.buttonText}>Notif locale</Text>
          </>
        )}
      </TouchableOpacity>

      <TouchableOpacity
        style={[styles.button, styles.buttonDanger, sendingAll && styles.buttonDisabled]}
        onPress={handleSendToAll}
        disabled={sendingAll}
      >
        {sendingAll ? (
          <ActivityIndicator color={colors.background} size={16} />
        ) : (
          <>
            <MaterialIcons name="broadcast-on-personal" size={16} color={colors.background} />
            <Text style={styles.buttonText}>À tous les users</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: {
    marginTop: spacing.lg,
    marginHorizontal: 0,
    padding: spacing.md,
    borderRadius: 12,
    backgroundColor: "#fff",
    borderLeftWidth: 4,
    borderLeftColor: colors.primary,
    gap: spacing.sm,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.sm,
  },
  title: {
    color: colors.text,
    fontWeight: font.weight.bold,
    fontSize: font.size.sm,
  },
  button: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
    paddingVertical: spacing.sm,
    borderRadius: 8,
  },
  buttonDanger: {
    backgroundColor: '#f38ba8',
  },
  buttonDisabled: {
    opacity: 0.6,
  },
  buttonText: {
    color: colors.background,
    fontWeight: font.weight.medium,
    fontSize: font.size.xs,
  },
});
