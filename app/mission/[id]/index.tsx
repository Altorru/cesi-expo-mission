import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  TouchableOpacity,
  Modal,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter, useFocusEffect } from 'expo-router';
import { MaterialIcons } from '@expo/vector-icons';
import { Skeleton } from 'boneyard-js/native';
import {
  MISSION_HEADER_BONES,
  MISSION_DESC_BONES,
  MISSION_META_BONES,
} from '@/components/ui/SkeletonBones';
import { MissionNotificationPanel } from '@/components/features/MissionNotificationPanel';
import { useMission } from '@/hooks/useMissions';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { fetchUserPseudos } from '@/services/userService';
import type { PriorityLevel } from '@/types/mission';
import { getColors, spacing, radius, font } from '@/styles/theme';

// ─── Badge priorité ────────────────────────────────────────────────────────────

const PRIORITY_META: Record<PriorityLevel, { label: string; color: string }> = {
  Critique: { label: 'Critique', color: '#c0392b' },
  Urgent:   { label: 'Urgent',   color: '#e67e22' },
  Normal:   { label: 'Normal',   color: '#27ae60' },
};

// ─── Modal de confirmation d'attribution ──────────────────────────────────────

type AssignState = 'confirm' | 'loading' | 'success' | 'error';

interface ThemeColors {
  primary: string;
  secondary: string;
  background: string;
  text: string;
  textSecondary: string;
  border: string;
  cardBackground: string;
  inputBackground: string;
}

function AssignModal({
  visible,
  label,
  onConfirm,
  onClose,
  themeColors,
}: {
  visible: boolean;
  label: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
  themeColors: ThemeColors;
}) {
  const [state, setState] = React.useState<AssignState>('confirm');
  const [errorMsg, setErrorMsg] = React.useState('');
  const modalStyles = createModalStyles(themeColors);

  React.useEffect(() => {
    if (visible) { setState('confirm'); setErrorMsg(''); }
  }, [visible]);

  const handleConfirm = async () => {
    setState('loading');
    try {
      await onConfirm();
      setState('success');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
      setState('error');
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade" onRequestClose={onClose}>
      <View style={modalStyles.overlay}>
        <View style={modalStyles.dialog}>
          {state === 'confirm' && (
            <>
              <MaterialIcons name="assignment-ind" size={36} color={themeColors.primary} />
              <Text style={modalStyles.dialogTitle}>{label}</Text>
              <Text style={modalStyles.dialogSub}>Confirmer cette action ?</Text>
              <View style={modalStyles.dialogRow}>
                <TouchableOpacity style={modalStyles.cancelBtn} onPress={onClose}>
                  <Text style={modalStyles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={modalStyles.confirmBtn} onPress={handleConfirm}>
                  <Text style={modalStyles.confirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {state === 'loading' && (
            <>
              <ActivityIndicator size="large" color={themeColors.primary} />
              <Text style={modalStyles.dialogSub}>En cours…</Text>
            </>
          )}

          {state === 'success' && (
            <>
              <MaterialIcons name="check-circle" size={40} color="#27ae60" />
              <Text style={modalStyles.dialogTitle}>Succès !</Text>
              <TouchableOpacity style={modalStyles.confirmBtn} onPress={onClose}>
                <Text style={modalStyles.confirmText}>Fermer</Text>
              </TouchableOpacity>
            </>
          )}

          {state === 'error' && (
            <>
              <MaterialIcons name="error-outline" size={40} color="#c0392b" />
              <Text style={modalStyles.dialogTitle}>Erreur</Text>
              <Text style={modalStyles.dialogSub}>{errorMsg}</Text>
              <TouchableOpacity style={modalStyles.confirmBtn} onPress={onClose}>
                <Text style={modalStyles.confirmText}>Fermer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

// ─── Écran détail ─────────────────────────────────────────────────────────────

export default function MissionDetailScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const styles = createMissionDetailStyles(themeColors);

  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { mission, isInitialLoading, error, refetch } = useMission(id);

  const [modalVisible, setModalVisible] = React.useState(false);
  const [pseudos, setPseudos] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (!mission) return;
    fetchUserPseudos([mission.author, mission.in_charge]).then(setPseudos);
  }, [mission?.author, mission?.in_charge]);

  // Refetch explicite au retour depuis modify (en complément du Realtime)
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch]),
  );

  const isAssignedToMe = mission?.in_charge === user?.id;
  const isAssignedToOther = !!mission?.in_charge && !isAssignedToMe;
  const isUnassigned = !mission?.in_charge;

  const handleAssign = async () => {
    const newAssignee = isAssignedToMe ? null : user?.id ?? null;
    const { error } = await supabase
      .from('courses')
      .update({ in_charge: newAssignee })
      .eq('id', id);
    if (error) throw new Error(error.message);
    await refetch();
  };

  const assignLabel = isAssignedToMe
    ? 'Se désassigner'
    : isUnassigned
    ? "S'attribuer la mission"
    : "Déjà attribuée à quelqu'un";

  if (isInitialLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <TouchableOpacity
            onPress={() => router.back()}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
          </TouchableOpacity>
          <Text style={styles.headerTitle}>Détail</Text>
          <View style={{ width: 64 }} />
        </View>

        <ScrollView contentContainerStyle={styles.content}>
          {/* Titre + chips — les 2 premiers enfants du vrai ScrollView regroupés */}
          <Skeleton loading initialBones={MISSION_HEADER_BONES}>
            <View style={{ height: MISSION_HEADER_BONES.height }} />
          </Skeleton>

          {/* Section description */}
          <Skeleton loading initialBones={MISSION_DESC_BONES}>
            <View style={{ height: MISSION_DESC_BONES.height }} />
          </Skeleton>

          {/* Meta-card : la View fournit fond blanc + ombre + radius */}
          <View style={[styles.metaCard, { overflow: 'hidden' }]}>
            <Skeleton loading initialBones={MISSION_META_BONES}>
              <View style={{ height: MISSION_META_BONES.height }} />
            </Skeleton>
          </View>

          {/* Bouton assignation — rendu directement comme View colorée */}
          <View style={[styles.assignBtn, { backgroundColor: themeColors.primary + '55' }]} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  if (error || !mission) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
        </TouchableOpacity>
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={40} color="#c0392b" />
          <Text style={styles.errorText}>{error ?? 'Mission introuvable'}</Text>
        </View>
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
        >
          <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
        </TouchableOpacity>

        <Text style={styles.headerTitle} numberOfLines={1}>Détail</Text>

        {/* Actions : modifier + supprimer */}
        <View style={styles.headerActions}>
          <TouchableOpacity
            onPress={() => router.push(`/mission/${id}/modify`)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="edit" size={22} color={themeColors.primary} />
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => router.push(`/mission/${id}/delete`)}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            <MaterialIcons name="delete-outline" size={22} color="#c0392b" />
          </TouchableOpacity>
        </View>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Titre */}
        <Text style={styles.title}>{mission.title}</Text>

        {/* Catégorie + Priorité */}
        {(mission.category || mission.priority) ? (
          <View style={styles.tagsRow}>
            {mission.category ? (
              <View style={styles.categoryChip}>
                <MaterialIcons name="label-outline" size={13} color={themeColors.primary} />
                <Text style={styles.categoryText}>{mission.category}</Text>
              </View>
            ) : null}
            {mission.priority ? (() => {
              const pm = PRIORITY_META[mission.priority as PriorityLevel] ?? { label: mission.priority, color: '#888' };
              return (
                <View style={[styles.priorityChip, { backgroundColor: pm.color + '22' }]}>
                  <Text style={[styles.priorityText, { color: pm.color }]}>{pm.label}</Text>
                </View>
              );
            })() : null}
          </View>
        ) : null}

        {/* Description */}
        {mission.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Description</Text>
            <Text style={styles.sectionText}>{mission.description}</Text>
          </View>
        ) : null}

        {/* Méta */}
        <View style={styles.metaCard}>
          <MetaRow icon="person-outline" label="Auteur" value={mission.author ? (pseudos[mission.author] || '—') : '—'} themeColors={themeColors} />
          <MetaRow
            icon="assignment-ind"
            label="Assignée à"
            value={
              isAssignedToMe
                ? 'Moi'
                : mission.in_charge
                ? (pseudos[mission.in_charge] || '—')
                : 'Non assignée'
            }
            valueColor={
              isAssignedToMe ? '#27ae60' : isAssignedToOther ? '#e67e22' : themeColors.text + '88'
            }
            themeColors={themeColors}
          />
          {mission.deadline ? (
            <MetaRow
              icon="event"
              label="Deadline"
              value={new Date(mission.deadline).toLocaleDateString('fr-FR')}
              themeColors={themeColors}
            />
          ) : null}
          <MetaRow
            icon="schedule"
            label="Créée le"
            value={new Date(mission.created_at).toLocaleDateString('fr-FR')}
            themeColors={themeColors}
          />
        </View>

        {/* Panel de notifications */}
        <MissionNotificationPanel
          missionId={mission.id}
          missionTitle={mission.title}
        />

        {/* Bouton d'attribution conditionnel */}
        <TouchableOpacity
          style={[
            styles.assignBtn,
            isAssignedToMe && styles.assignBtnUnassign,
            isAssignedToOther && styles.assignBtnDisabled,
          ]}
          onPress={() => !isAssignedToOther && setModalVisible(true)}
          disabled={isAssignedToOther}
        >
          <MaterialIcons
            name={isAssignedToMe ? 'person-remove' : 'person-add'}
            size={20}
            color="#fff"
          />
          <Text style={styles.assignBtnText}>{assignLabel}</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal confirmation attribution */}
      <AssignModal
        visible={modalVisible}
        label={assignLabel}
        onConfirm={handleAssign}
        onClose={() => setModalVisible(false)}
        themeColors={themeColors}
      />
    </SafeAreaView>
  );
}

function MetaRow({
  icon,
  label,
  value,
  valueColor,
  themeColors,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  valueColor?: string;
  themeColors: ThemeColors;
}) {
  const metaStyles = createMetaRowStyles(themeColors);
  return (
    <View style={metaStyles.metaRow}>
      <MaterialIcons name={icon} size={16} color={themeColors.secondary} style={{ marginRight: spacing.sm }} />
      <Text style={metaStyles.metaLabel}>{label}</Text>
      <Text style={[metaStyles.metaValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

function createMissionDetailStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    safe: { flex: 1, backgroundColor: themeColors.background },
    backBtn: { padding: spacing.md },
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
      color: themeColors.primary,
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    content: {
      padding: spacing.lg,
      gap: spacing.lg,
    },
    title: {
      fontSize: font.size.xl,
      fontWeight: font.weight.bold,
      color: themeColors.text,
    },
    tagsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    categoryChip: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.xs,
      backgroundColor: themeColors.primary + '15',
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    categoryText: {
      fontSize: font.size.xs,
      color: themeColors.primary,
      fontWeight: font.weight.medium,
    },
    priorityChip: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    priorityText: {
      fontSize: font.size.xs,
      fontWeight: font.weight.bold,
    },
    section: { gap: spacing.xs },
    sectionLabel: {
      fontSize: font.size.sm,
      fontWeight: font.weight.medium,
      color: themeColors.text + '88',
      textTransform: 'uppercase',
      letterSpacing: 0.5,
    },
    sectionText: {
      fontSize: font.size.md,
      color: themeColors.text,
      lineHeight: 22,
    },
    metaCard: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
    },
    assignBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: themeColors.primary,
      borderRadius: radius.md,
      padding: spacing.md,
      marginTop: spacing.sm,
    },
    assignBtnUnassign: { backgroundColor: '#c0392b' },
    assignBtnDisabled: { backgroundColor: '#aaa' },
    assignBtnText: {
      color: '#fff',
      fontSize: font.size.md,
      fontWeight: font.weight.bold,
    },
    center: {
      flex: 1,
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.md,
    },
    errorText: {
      fontSize: font.size.sm,
      color: '#c0392b',
      textAlign: 'center',
      paddingHorizontal: spacing.lg,
    },
  });
}

function createMetaRowStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    metaRow: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.xs,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    metaLabel: {
      flex: 1,
      fontSize: font.size.sm,
      color: themeColors.text + '88',
    },
    metaValue: {
      fontSize: font.size.sm,
      fontWeight: font.weight.medium,
      color: themeColors.text,
      textAlign: 'right',
      flexShrink: 1,
    },
  });
}

function createModalStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#00000055',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dialog: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: radius.lg,
      padding: spacing.xl,
      width: '80%',
      alignItems: 'center',
      gap: spacing.md,
    },
    dialogTitle: {
      fontSize: font.size.lg,
      fontWeight: font.weight.bold,
      color: themeColors.text,
      textAlign: 'center',
    },
    dialogSub: {
      fontSize: font.size.sm,
      color: themeColors.text + '99',
      textAlign: 'center',
    },
    dialogRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
    },
    cancelBtn: {
      flex: 1,
      borderWidth: 1,
      borderColor: themeColors.secondary,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    cancelText: {
      color: themeColors.secondary,
      fontWeight: font.weight.medium,
    },
    confirmBtn: {
      flex: 1,
      alignSelf: 'stretch',
      backgroundColor: themeColors.primary,
      borderRadius: radius.md,
      padding: spacing.md,
      alignItems: 'center',
    },
    confirmText: {
      color: '#fff',
      fontWeight: font.weight.bold,
    },
  });
}
