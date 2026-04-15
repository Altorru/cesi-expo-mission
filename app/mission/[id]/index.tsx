import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
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
import { CommentsList } from '@/components/features/CommentsList';
import { CommentInput } from '@/components/features/CommentInput';
import { ProgressionCard } from '@/components/features/MissionDetail/ProgressionCard';
import { MetadataCard } from '@/components/features/MissionDetail/MetadataCard';
import { DescriptionCard } from '@/components/features/MissionDetail/DescriptionCard';
import { TabsControl } from '@/components/features/MissionDetail/TabsControl';
import { AssignModal } from '@/components/features/MissionDetail/AssignModal';
import { useMission } from '@/hooks/useMissions';
import { useComments } from '@/hooks/useComments';
import { useAuth } from '@/context/AuthContext';
import { useTheme } from '@/context/ThemeContext';
import { supabase } from '@/lib/supabase';
import { fetchUserPseudos } from '@/services/userService';
import { updateMissionState } from '@/services/missionService';
import { getColors, spacing, radius, font } from '@/styles/theme';
import type { MissionState } from '@/types/mission';

// ─── Écran détail avec onglets ────────────────────────────────────────────

export default function MissionDetailScreen() {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const styles = createStyles(themeColors);

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

  // État UI
  const [activeTab, setActiveTab] = useState<'details' | 'comments'>('details');
  const [modalVisible, setModalVisible] = useState(false);
  const [pseudos, setPseudos] = useState<Record<string, string>>({});
  const [commentError, setCommentError] = useState<string | null>(null);
  const [isUpdatingState, setIsUpdatingState] = useState(false);

  // Chargement des pseudos
  React.useEffect(() => {
    if (!mission) return;
    fetchUserPseudos([mission.author, mission.in_charge]).then(setPseudos);
  }, [mission?.author, mission?.in_charge]);

  // Refetch au retour de la page
  useFocusEffect(
    React.useCallback(() => {
      refetch();
    }, [refetch])
  );

  // États d'assignation
  const isAssignedToMe = mission?.in_charge === user?.id;
  const isAssignedToOther = !!mission?.in_charge && !isAssignedToMe;
  const isUnassigned = !mission?.in_charge;

  // Changement d'état de la mission (progression libre)
  const handleChangeState = async (newState: MissionState | null) => {
    if (!mission) return;

    setIsUpdatingState(true);
    try {
      await updateMissionState(id, newState);
      await refetch();
    } catch (err) {
      console.error('Erreur changement état:', err);
    } finally {
      setIsUpdatingState(false);
    }
  };

  // Assignation
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

  // État Loading
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

        <ScrollView contentContainerStyle={styles.tabContent}>
          <Skeleton loading initialBones={MISSION_HEADER_BONES}>
            <View style={{ height: MISSION_HEADER_BONES.height }} />
          </Skeleton>
          <Skeleton loading initialBones={MISSION_DESC_BONES}>
            <View style={{ height: MISSION_DESC_BONES.height }} />
          </Skeleton>
          <View style={[styles.metaCard, { overflow: 'hidden' }]}>
            <Skeleton loading initialBones={MISSION_META_BONES}>
              <View style={{ height: MISSION_META_BONES.height }} />
            </Skeleton>
          </View>
          <View style={[styles.skeletonBtn, { backgroundColor: themeColors.primary + '44' }]} />
        </ScrollView>
      </SafeAreaView>
    );
  }

  // État Error
  if (error || !mission) {
    return (
      <SafeAreaView style={styles.safe}>
        <TouchableOpacity style={styles.backBtn} onPress={() => router.back()}>
          <MaterialIcons name="arrow-back" size={24} color={themeColors.primary} />
        </TouchableOpacity>
        <View style={styles.centerError}>
          <MaterialIcons name="error-outline" size={40} color="#c0392b" />
          <Text style={styles.errorText}>{error ?? 'Mission introuvable'}</Text>
        </View>
      </SafeAreaView>
    );
  }

  // État Loaded
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
        <Text style={styles.headerTitle} numberOfLines={1}>
          Détail
        </Text>
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

      {/* Titre */}
      <View style={styles.titleSection}>
        <Text style={styles.title}>{mission!.title}</Text>
      </View>

      {/* Onglets */}
      <TabsControl activeTab={activeTab} onTabChange={setActiveTab} />

      {/* Contenu Onglet Détails */}
      {activeTab === 'details' && (
        <ScrollView contentContainerStyle={styles.tabContent}>
          {/* Progression */}
          <ProgressionCard
            currentState={mission!.state}
            onStateChange={handleChangeState}
            isUpdating={isUpdatingState}
          />

          {/* Description + Tags */}
          <DescriptionCard
            description={mission!.description}
            category={mission!.category}
            priority={mission!.priority}
          />

          {/* Métadonnées */}
          <MetadataCard
            author={mission!.author ? pseudos[mission!.author] : undefined}
            assignedTo={mission!.in_charge ? pseudos[mission!.in_charge] : undefined}
            isAssignedToMe={isAssignedToMe}
            isAssignedToOther={isAssignedToOther}
            deadline={mission!.deadline ?? undefined}
            createdAt={mission!.created_at}
          />

          {/* Bouton Assignation */}
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
      )}

      {/* Contenu Onglet Commentaires */}
      {activeTab === 'comments' && (
        <View style={styles.commentsTabContainer}>
          <ScrollView contentContainerStyle={styles.commentsContent}>
            {commentError && (
              <View style={styles.errorBanner}>
                <MaterialIcons name="error-outline" size={16} color="#c0392b" />
                <Text style={styles.errorBannerText}>{commentError}</Text>
              </View>
            )}
            <CommentsList
              comments={comments}
              isLoading={commentsLoading}
              hasMore={commentsHasMore}
              onLoadMore={loadMoreComments}
              currentUserId={user?.id || ''}
              onCommentDeleted={deleteCommentOptimistic}
            />
          </ScrollView>

          {/* Input commentaire au bottom */}
          <CommentInput
            courseId={mission!.id}
            userId={user?.id || ''}
            onCommentAdded={(comment) => {
              addCommentOptimistic(comment);
              setCommentError(null);
            }}
            onError={setCommentError}
            disabled={isInitialLoading}
          />
        </View>
      )}

      {/* Modal Assignation */}
      <AssignModal
        visible={modalVisible}
        label={assignLabel}
        onConfirm={handleAssign}
        onClose={() => setModalVisible(false)}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────

function createStyles(themeColors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    safe: {
      flex: 1,
      backgroundColor: themeColors.background,
    },
    backBtn: {
      padding: spacing.md,
    },
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
      flex: 1,
      textAlign: 'center',
    },
    headerActions: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.md,
    },
    titleSection: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.sm,
    },
    title: {
      fontSize: font.size.xl,
      fontWeight: font.weight.bold,
      color: themeColors.text,
    },
    tabContent: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.lg,
      gap: spacing.lg,
      paddingBottom: spacing.xl,
    },
    commentsTabContainer: {
      flex: 1,
      flexDirection: 'column',
    },
    commentsContent: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
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
    },
    assignBtn: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      gap: spacing.sm,
      backgroundColor: themeColors.primary,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      paddingHorizontal: spacing.lg,
    },
    assignBtnUnassign: {
      backgroundColor: '#c0392b',
    },
    assignBtnDisabled: {
      backgroundColor: '#aaa',
    },
    assignBtnText: {
      color: '#fff',
      fontSize: font.size.md,
      fontWeight: font.weight.bold,
    },
    centerError: {
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
    metaCard: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: radius.lg,
    },
    skeletonBtn: {
      height: 44,
      borderRadius: radius.md,
    },
  });
}
