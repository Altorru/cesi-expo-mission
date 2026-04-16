import React from 'react';
import { useRouter } from 'expo-router';
import { useAuth } from '@/context/AuthContext';
import { createMission } from '@/services/missionService';
import { notifyMissionCreated } from '@/services/notificationService';
import { fetchUserById } from '@/services/userService';
import type { PriorityLevel } from '@/types/mission';
import MissionForm, { type MissionFormValues } from '@/components/features/MissionForm';

// ─── Écran de création ────────────────────────────────────────────────────────

export default function CreateMissionScreen() {
  const router = useRouter();
  const { user } = useAuth();

  const [saving, setSaving]     = React.useState(false);
  const [errorMsg, setErrorMsg] = React.useState('');

  const handleSubmit = async (values: MissionFormValues) => {
    setSaving(true);
    setErrorMsg('');
    try {
      const newMission = {
        title:       values.title.trim(),
        description: values.description.trim() || null,
        category:    values.category.trim() || null,
        deadline:    values.deadline || null,
        priority:    (values.priority as PriorityLevel) || null,
        author:      user?.id ?? null,
        in_charge:   null,
        state:       null,
      };

      await createMission(newMission);

      // Envoyer la notification avec le nom d'auteur enrichi
      if (user?.id) {
        const authorUser = await fetchUserById(user.id);
        const authorName = authorUser?.full_name || 'Un utilisateur';
        await notifyMissionCreated(values.title, authorName);
      }

      router.replace('/(tabs)/missions');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
    } finally {
      setSaving(false);
    }
  };

  return (
    <MissionForm
      headerTitle="Nouvelle mission"
      saving={saving}
      serverError={errorMsg}
      onSubmit={handleSubmit}
      onCancel={() => router.back()}
    />
  );
}
