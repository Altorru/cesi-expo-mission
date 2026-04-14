import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { useMissionOnce } from '@/hooks/useMissions';
import { deleteMission } from '@/services/missionService';
import { colors, spacing, radius, font } from '@/styles/theme';

// ─── Écran de suppression ─────────────────────────────────────────────────────

export default function DeleteMissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { mission, isLoading } = useMissionOnce(id);

  const [deleting, setDeleting] = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleDelete = async () => {
    setDeleting(true);
    setErrorMsg('');
    try {
      await deleteMission(id);
      // Retour à la liste des missions après suppression
      router.replace('/(tabs)/missions');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
      setDeleting(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          disabled={deleting}
        >
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Supprimer</Text>
        <View style={{ width: 24 }} />
      </View>

      {/* Contenu centré */}
      <View style={styles.content}>
        {/* Carte d'avertissement */}
        <View style={styles.warningCard}>
          <MaterialIcons name="warning" size={52} color="#c0392b" />
          <Text style={styles.warningTitle}>Suppression définitive</Text>
          <Text style={styles.warningText}>
            Vous êtes sur le point de supprimer la mission :
          </Text>
          <Text style={styles.missionTitle} numberOfLines={2}>
            « {mission?.title ?? '…'} »
          </Text>
          <Text style={styles.warningSubtext}>
            Cette action est irréversible.
          </Text>
        </View>

        {/* Bannière d'erreur */}
        {errorMsg ? (
          <View style={styles.errorBanner}>
            <MaterialIcons name="error-outline" size={16} color="#c0392b" />
            <Text style={styles.errorText}>{errorMsg}</Text>
          </View>
        ) : null}

        {/* Bouton supprimer */}
        <TouchableOpacity
          style={[styles.deleteBtn, deleting && styles.btnDisabled]}
          onPress={handleDelete}
          disabled={deleting}
        >
          {deleting
            ? <ActivityIndicator size="small" color="#fff" />
            : <MaterialIcons name="delete-forever" size={20} color="#fff" />
          }
          <Text style={styles.deleteBtnText}>
            {deleting ? 'Suppression…' : 'Supprimer définitivement'}
          </Text>
        </TouchableOpacity>

        {/* Bouton annuler */}
        <TouchableOpacity
          style={[styles.cancelBtn, deleting && styles.btnDisabled]}
          onPress={() => router.back()}
          disabled={deleting}
        >
          <Text style={styles.cancelText}>Annuler</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
  },
  headerTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.primary,
  },
  content: {
    flex: 1,
    padding: spacing.lg,
    justifyContent: 'center',
    gap: spacing.lg,
  },
  warningCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.xl,
    alignItems: 'center',
    gap: spacing.md,
    borderWidth: 1.5,
    borderColor: '#fdecea',
  },
  warningTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: '#c0392b',
    textAlign: 'center',
  },
  warningText: {
    fontSize: font.size.sm,
    color: colors.text + '99',
    textAlign: 'center',
  },
  missionTitle: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
    paddingHorizontal: spacing.md,
  },
  warningSubtext: {
    fontSize: font.size.xs,
    color: '#c0392b99',
    textAlign: 'center',
  },
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: '#fdecea',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  errorText: {
    color: '#c0392b',
    fontSize: font.size.sm,
    flex: 1,
  },
  deleteBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: '#c0392b',
    borderRadius: radius.md,
    padding: spacing.md,
  },
  btnDisabled: { opacity: 0.6 },
  deleteBtnText: {
    color: '#fff',
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
  cancelBtn: {
    borderWidth: 1,
    borderColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.secondary,
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
  },
});
