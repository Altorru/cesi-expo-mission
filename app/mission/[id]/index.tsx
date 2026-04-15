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
import { CommentsList } from '@/components/features/CommentsList';
import { CommentInput } from '@/components/features/CommentInput';
import { useMission } from '@/hooks/useMissions';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { fetchUserPseudos } from '@/services/userService';
import { updateMissionState } from '@/services/missionService';
import type { PriorityLevel, MissionState, Comment } from '@/types/mission';
import { getColors, spacing, radius, font } from '@/styles/theme';

// ─── Badge priorité ────────────────────────────────────────────────────────────

const PRIORITY_META: Record<PriorityLevel, { label: string; color: string }> = {
  Critique: { label: 'Critique', color: '#c0392b' },
  Urgent:   { label: 'Urgent',   color: '#e67e22' },
  Normal:   { label: 'Normal',   color: '#27ae60' },
};

// ─── Badge État ─────────────────────────────────────────────────────────────────

const STATE_META: Record<MissionState, { label: string; color: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }> = {
  'À faire':  { label: 'À faire',  color: '#8e44ad', icon: 'radio-button-unchecked' },
  'En cours': { label: 'En cours',  color: '#3498db', icon: 'schedule' },
  'Terminé':  { label: 'Terminé',   color: '#27ae60', icon: 'check-circle' },
};

// Fonction pour obtenir l'état suivant (flow du cycle de vie)
function getNextState(currentState: MissionState | null): MissionState | null {
  switch (currentState) {
    case null:
      return 'À faire';
    case 'À faire':
      return 'En cours';
    case 'En cours':
      return 'Terminé';
    case 'Terminé':
      return null;
    default:
      return 'À faire';
  }
}

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
  const {
    comments,
    isLoading: commentsLoading,
    hasMore: commentsHasMore,
    loadMore: loadMoreComments,
    addCommentOptimistic,
    deleteCommentOptimistic,
  } = useComments({ courseId: id, enabled: !isInitialLoading });

  const [modalVisible, setModalVisible] = React.useState(false);
  const [pseudos, setPseudos] = React.useState<Record<string, string>>({});
  const [commentError, setCommentError] = React.useState<string | null>(null);

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

  // ─── Gestion de l'état de la mission ───────────────────────────────

  const [isUpdatingState, setIsUpdatingState] = React.useState(false);

  const handleChangeState = async () => {
    const nextState = getNextState(mission?.state ?? null);
    setIsUpdatingState(true);
    try {
      await updateMissionState(id, nextState);
      await refetch();
    } catch (err) {
      console.error('Erreur lors du changement d\'état:', err);
    } finally {
      setIsUpdatingState(false);
    }
  };

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

        {/* État - Apple-like Segment Status */}
        <View style={styles.stateContainer}>
          <StateSegmentControl
            currentState={mission?.state ?? null}
            onStateChange={handleChangeState}
            isUpdating={isUpdatingState}
          />
        </View>

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

        {/* Section Commentaires */}
        <View>
          <Text style={styles.commentsTitle}>Commentaires</Text>
          <View style={{ marginTop: spacing.md, marginBottom: spacing.md }}>
            <CommentsList
              comments={comments}
              isLoading={commentsLoading}
              hasMore={commentsHasMore}
              onLoadMore={loadMoreComments}
              currentUserId={user?.id || ''}
              onCommentDeleted={deleteCommentOptimistic}
            />
          </View>
          {commentError && (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={16} color="#c0392b" />
              <Text style={styles.errorBannerText}>{commentError}</Text>
            </View>
          )}
          <CommentInput
            courseId={mission.id}
            userId={user?.id || ''}
            onCommentAdded={(comment) => {
              addCommentOptimistic(comment);
              setCommentError(null);
            }}
            onError={setCommentError}
            disabled={isInitialLoading}
          />
        </View>

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

// ─── Composant : State Segment Control (Apple-like) ────────────────────────

function StateSegmentControl({
  currentState,
  onStateChange,
  isUpdating,
}: {
  currentState: MissionState | null;
  onStateChange: () => void;
  isUpdating: boolean;
}) {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const styles = createStateSegmentStyles(themeColors);

  const nextState = getNextState(currentState);
  const currentIndex = currentState === null ? 0 : (currentState === 'À faire' ? 1 : currentState === 'En cours' ? 2 : 3);

  return (
    <View style={styles.wrapper}>
      <Text style={styles.label}>
        Progression
      </Text>
      
      <View style={styles.row}>
        {[
          { key: null as MissionState | null, label: 'À faire', color: '#8e44ad', icon: 'radio-button-unchecked' as const },
          { key: 'En cours' as MissionState, label: 'En cours', color: '#3498db', icon: 'schedule' as const },
          { key: 'Terminé' as MissionState, label: 'Terminé', color: '#27ae60', icon: 'check-circle' as const },
        ].map((state, idx) => {
          const isCurrent = currentState === state.key;
          const isNext = nextState === state.key;
          const isClickable = isNext || (currentState === null && idx === 0);
          const isPast = idx < currentIndex;

          return (
            <TouchableOpacity
              key={idx}
              style={[
                styles.pill,
                isCurrent && [styles.pillActive, { backgroundColor: state.color }],
                isClickable && !isCurrent && [styles.pillNext, { borderColor: state.color }],
                isPast && styles.pillPast,
              ]}
              onPress={isClickable ? onStateChange : undefined}
              disabled={!isClickable || isUpdating}
              activeOpacity={isClickable ? 0.7 : 1}
            >
              <MaterialIcons
                name={state.icon}
                size={16}
                color={isCurrent ? '#fff' : isClickable ? state.color : themeColors.text + '44'}
              />
              <Text
                style={[
                  styles.pillText,
                  isCurrent && { color: '#fff', fontWeight: font.weight.bold },
                  isClickable && !isCurrent && { color: state.color, fontWeight: font.weight.medium },
                  isPast && { color: themeColors.text + '44' },
                ]}
              >
                {state.label}
              </Text>
              {isUpdating && isCurrent && (
                <ActivityIndicator size={14} color="#fff" style={{ marginLeft: 4 }} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>

      {/* Hint */}
      {nextState !== null && (
        <Text style={styles.hint}>
          Tap "{
            nextState === 'En cours' ? 'En cours' :
            nextState === 'Terminé' ? 'Terminé' :
            'À faire'
          }" pour avancer
        </Text>
      )}
      {nextState === null && (
        <Text style={styles.hint}>
          ✓ Mission complétée
        </Text>
      )}
    </View>
  );
}

function createStateSegmentStyles(themeColors: ThemeColors) {
  return StyleSheet.create({
    wrapper: {
      gap: spacing.sm,
    },
    label: {
      fontSize: font.size.xs,
      fontWeight: font.weight.bold,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: themeColors.text + '88',
    },
    row: {
      flexDirection: 'row',
      gap: spacing.sm,
    },
    pill: {
      flex: 1,
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.xs,
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.md,
      borderRadius: radius.full,
      borderWidth: 1.5,
      borderColor: 'transparent',
      backgroundColor: themeColors.cardBackground,
    },
    pillActive: {
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    pillNext: {
      backgroundColor: themeColors.background,
    },
    pillPast: {
      backgroundColor: themeColors.background,
    },
    pillText: {
      fontSize: font.size.sm,
      fontWeight: font.weight.medium,
      flex: 1,
      textAlign: 'center',
    },
    hint: {
      fontSize: font.size.xs,
      textAlign: 'center',
      marginTop: spacing.xs,
      color: themeColors.text + '66',
    },
  });
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
    stateContainer: {
      gap: spacing.md,
    },
    stateBadgeDetail: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: radius.lg,
    },
    stateLabel: {
      fontSize: font.size.xs,
      fontWeight: font.weight.medium,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      marginBottom: spacing.xs,
    },
    stateValueRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    stateValue: {
      fontSize: font.size.lg,
      fontWeight: font.weight.bold,
    },
    stateNextBtn: {
      width: 48,
      height: 48,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOpacity: 0.1,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
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
    commentsTitle: {
      fontSize: font.size.lg,
      fontWeight: font.weight.bold,
      color: themeColors.text,
      marginBottom: spacing.xs,
    },
    errorBanner: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
      backgroundColor: '#c0392b' + '15',
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
      borderLeftWidth: 3,
      borderLeftColor: '#c0392b',
    },
    errorBannerText: {
      flex: 1,
      fontSize: font.size.sm,
      color: '#c0392b',
      fontFamily: font.family.regular,
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
