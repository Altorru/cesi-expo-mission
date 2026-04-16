import React from 'react';
import { ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { useMissionOnce } from '@/hooks/useMissions';
import { updateMission } from '@/services/missionService';
import { notifyMissionModified } from '@/services/notificationService';
import { fetchUserById } from '@/services/userService';
import { useAuth } from '@/context/AuthContext';
import type { PriorityLevel } from '@/types/mission';
import { colors } from '@/styles/theme';
import MissionForm, { type MissionFormValues } from '@/components/features/MissionForm';

// ─── Écran de modification ────────────────────────────────────────────────────

export default function ModifyMissionScreen() {
  const { id } = useLocalSearchParams<{ id: string }>();
  const router = useRouter();
  const { user } = useAuth();
  const { mission, isLoading } = useMissionOnce(id);

  const [saving, setSaving]   = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleSubmit = async (values: MissionFormValues) => {
    setSaving(true);
    setErrorMsg('');
    try {
      await updateMission(id, {
        title:       values.title.trim(),
        description: values.description.trim() || null,
        category:    values.category.trim() || null,
        deadline:    values.deadline || null,
        priority:    (values.priority as PriorityLevel) || null,
        in_charge:   values.in_charge,
      });

      // Envoyer la notification avec le nom du modifiant
      if (user?.id) {
        const modifierUser = await fetchUserById(user.id);
        const modifierName = modifierUser?.full_name || 'Un utilisateur';
        await notifyMissionModified(values.title, id, modifierName, 'updated');
      }

      router.back();
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  if (isLoading) {
    return (
      <SafeAreaView style={{ flex: 1, backgroundColor: colors.background, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator size="large" color={colors.primary} />
      </SafeAreaView>
    );
  }

  return (
    <MissionForm
      headerTitle="Modifier"
      initialValues={{
        title:       mission?.title ?? '',
        description: mission?.description ?? '',
        category:    mission?.category ?? '',
        deadline:    mission?.deadline ? mission.deadline.slice(0, 10) : '',
        priority:    (mission?.priority as PriorityLevel) ?? '',
        in_charge:   mission?.in_charge ?? null,
      }}
      saving={saving}
      serverError={errorMsg}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
