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
import { useLocalSearchParams, useRouter } from 'expo-router'; // 7a
import { MaterialIcons } from '@expo/vector-icons';
import { useMission } from '@/hooks/useMissions';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { PriorityLevel } from '@/types/mission';
import { colors, spacing, radius, font } from '@/styles/theme';

// ─── Badge priorité ────────────────────────────────────────────────────────────

const PRIORITY_META: Record<PriorityLevel, { label: string; color: string }> = {
  Critique: { label: 'Critique', color: '#c0392b' },
  Urgent:   { label: 'Urgent',   color: '#e67e22' },
  Normal:   { label: 'Normal',   color: '#27ae60' },
};

// ─── Modal de confirmation d'attribution (7d) ─────────────────────────────────

type AssignState = 'confirm' | 'loading' | 'success' | 'error';

function AssignModal({
  visible,
  label,
  onConfirm,
  onClose,
}: {
  visible: boolean;
  label: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}) {
  const [state, setState] = React.useState<AssignState>('confirm');
  const [errorMsg, setErrorMsg] = React.useState('');

  // Reset quand le modal s'ouvre
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
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {state === 'confirm' && (
            <>
              <MaterialIcons name="assignment-ind" size={36} color={colors.primary} />
              <Text style={styles.dialogTitle}>{label}</Text>
              <Text style={styles.dialogSub}>Confirmer cette action ?</Text>
              <View style={styles.dialogRow}>
                <TouchableOpacity style={styles.cancelBtn} onPress={onClose}>
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity style={styles.confirmBtn} onPress={handleConfirm}>
                  <Text style={styles.confirmText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {state === 'loading' && (
            <>
              <ActivityIndicator size="large" color={colors.primary} />
              <Text style={styles.dialogSub}>En cours…</Text>
            </>
          )}

          {state === 'success' && (
            <>
              <MaterialIcons name="check-circle" size={40} color="#27ae60" />
              <Text style={styles.dialogTitle}>Succès !</Text>
              <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
                <Text style={styles.confirmText}>Fermer</Text>
              </TouchableOpacity>
            </>
          )}

          {state === 'error' && (
            <>
              <MaterialIcons name="error-outline" size={40} color="#c0392b" />
              <Text style={styles.dialogTitle}>Erreur</Text>
              <Text style={styles.dialogSub}>{errorMsg}</Text>
              <TouchableOpacity style={styles.confirmBtn} onPress={onClose}>
                <Text style={styles.confirmText}>Fermer</Text>
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
  // 7a — récupération de l'id depuis la route dynamique
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { mission, isLoading, error, refetch } = useMission(id);

  const [modalVisible, setModalVisible] = React.useState(false);

  // 7c — déterminer l'état d'attribution
  const isAssignedToMe = mission?.in_charge === user?.id;
  const isAssignedToOther = !!mission?.in_charge && !isAssignedToMe;
  const isUnassigned = !mission?.in_charge;

  // 7b — UPDATE in_charge dans Supabase
  const handleAssign = async () => {
    const newAssignee = isAssignedToMe ? null : user?.id ?? null;
    const { error } = await supabase
      .from('courses')
      .update({ in_charge: newAssignee })
      .eq('id', id);
    if (error) throw new Error(error.message);
    await refetch();
  };

  // Label du bouton selon l'état (7c)
  const assignLabel = isAssignedToMe
    ? 'Se désassigner'
    : isUnassigned
    ? "S'attribuer la mission"
    : 'Déjà attribuée à quelqu\'un';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (error || !mission) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
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
        <TouchableOpacity onPress={() => router.back()} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
          <MaterialIcons name="arrow-back" size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.headerTitle} numberOfLines={1}>Détail</Text>
        <View style={{ width: 24 }} />
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Titre */}
        <Text style={styles.title}>{mission.title}</Text>

        {/* Catégorie + Priorité */}
        {(mission.category || mission.priority) ? (
          <View style={styles.tagsRow}>
            {mission.category ? (
              <View style={styles.categoryChip}>
                <MaterialIcons name="label-outline" size={13} color={colors.primary} />
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
          <MetaRow icon="person-outline" label="Auteur" value={mission.author ?? '—'} />
          <MetaRow
            icon="assignment-ind"
            label="Assignée à"
            value={
              isAssignedToMe
                ? 'Moi'
                : mission.in_charge ?? 'Non assignée'
            }
            valueColor={isAssignedToMe ? '#27ae60' : isAssignedToOther ? '#e67e22' : colors.text + '88'}
          />
          {mission.deadline ? (
            <MetaRow
              icon="event"
              label="Deadline"
              value={new Date(mission.deadline).toLocaleDateString('fr-FR')}
            />
          ) : null}
          <MetaRow icon="schedule" label="Créée le" value={new Date(mission.created_at).toLocaleDateString('fr-FR')} />
        </View>

        {/* 7c — Bouton d'attribution conditionnel */}
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

      {/* 7d — Modal confirmation */}
      <AssignModal
        visible={modalVisible}
        label={assignLabel}
        onConfirm={handleAssign}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

function MetaRow({
  icon,
  label,
  value,
  valueColor,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  valueColor?: string;
}) {
  return (
    <View style={styles.metaRow}>
      <MaterialIcons name={icon} size={16} color={colors.secondary} style={{ marginRight: spacing.sm }} />
      <Text style={styles.metaLabel}>{label}</Text>
      <Text style={[styles.metaValue, valueColor ? { color: valueColor } : null]}>{value}</Text>
    </View>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.background },
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
    color: colors.primary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.lg,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    alignSelf: 'flex-start',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
  tagsRow: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    backgroundColor: colors.primary + '18',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: font.size.sm,
    color: colors.primary,
    fontWeight: font.weight.medium,
  },
  priorityChip: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.xs,
    borderRadius: radius.full,
  },
  priorityText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
  section: { gap: spacing.xs },
  sectionLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.bold,
    color: colors.secondary,
    textTransform: 'uppercase',
    letterSpacing: 0.6,
  },
  sectionText: {
    fontSize: font.size.md,
    color: colors.text,
    lineHeight: 22,
  },
  metaCard: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  metaRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.xs,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e9f5',
  },
  metaLabel: {
    flex: 1,
    fontSize: font.size.sm,
    color: colors.text + '88',
  },
  metaValue: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.text,
    textAlign: 'right',
    flexShrink: 1,
  },
  assignBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
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
  // Modal
  overlay: {
    flex: 1,
    backgroundColor: '#00000055',
    alignItems: 'center',
    justifyContent: 'center',
  },
  dialog: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.xl,
    width: '80%',
    alignItems: 'center',
    gap: spacing.md,
  },
  dialogTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
    textAlign: 'center',
  },
  dialogSub: {
    fontSize: font.size.sm,
    color: colors.text + '99',
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
    borderColor: colors.secondary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  cancelText: {
    color: colors.secondary,
    fontWeight: font.weight.medium,
  },
  confirmBtn: {
    flex: 1,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
  },
  confirmText: {
    color: '#fff',
    fontWeight: font.weight.bold,
  },
});
