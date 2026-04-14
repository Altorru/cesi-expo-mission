import React from 'react';
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
  Modal,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useMissions } from '@/hooks/useMissions';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import type { Mission, MissionStatus } from '@/types/mission';
import { colors, spacing, radius, font } from '@/styles/theme';

// ─── Badge de statut ──────────────────────────────────────────────────────────

const STATUS_META: Record<MissionStatus, { label: string; color: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }> = {
  open:        { label: 'Ouverte',      color: '#2980b9', icon: 'radio-button-unchecked' },
  in_progress: { label: 'En cours',     color: '#e67e22', icon: 'timelapse' },
  done:        { label: 'Terminée',     color: '#27ae60', icon: 'check-circle' },
  cancelled:   { label: 'Annulée',      color: '#c0392b', icon: 'cancel' },
};

const FALLBACK_META = {
  label: 'Inconnu',
  color: '#888888',
  icon: 'help-outline' as React.ComponentProps<typeof MaterialIcons>['name'],
};

function StatusBadge({ status }: { status: MissionStatus | string | null }) {
  const meta = STATUS_META[status as MissionStatus] ?? { ...FALLBACK_META, label: status || 'Inconnu' };
  return (
    <View style={[styles.badge, { backgroundColor: meta.color + '22' }]}>
      <MaterialIcons name={meta.icon} size={12} color={meta.color} />
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

// ─── Carte mission ────────────────────────────────────────────────────────────

function MissionCard({ item }: { item: Mission }) {
  return (
    <View style={styles.card}>
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
        <StatusBadge status={item.status} />
      </View>

      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={3}>{item.description}</Text>
      ) : null}

      <View style={styles.cardFooter}>
        <MaterialIcons name="person-outline" size={14} color={colors.secondary} />
        <Text style={styles.cardMeta}>
          {item.author ?? '—'}
        </Text>
      </View>
    </View>
  );
}

// ─── Formulaire de création (modal) ──────────────────────────────────────────

const DRAFT_KEY = 'draft_create_mission';
const DRAFT_INITIAL = { title: '', description: '' };

function CreateMissionModal({
  visible,
  onClose,
  onCreated,
}: {
  visible: boolean;
  onClose: () => void;
  onCreated: () => void;
}) {
  const { user } = useAuth();
  const { values, setField, clearDraft, isRestored } = useFormPersistence(
    DRAFT_KEY,
    DRAFT_INITIAL,
  );
  const [submitting, setSubmitting] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async () => {
    if (!values.title.trim()) {
      setError('Le titre est requis.');
      return;
    }
    setError(null);
    setSubmitting(true);
    const { error: sbError } = await supabase.from('courses').insert({
      title: values.title.trim(),
      description: values.description.trim() || null,
      author: user?.id ?? null,
    });
    setSubmitting(false);
    if (sbError) {
      setError(sbError.message);
      return;
    }
    await clearDraft(); // 4c — effacer après soumission
    onCreated();
    onClose();
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <SafeAreaView style={modal.safe}>
        <KeyboardAvoidingView
          style={{ flex: 1 }}
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        >
          <ScrollView contentContainerStyle={modal.container} keyboardShouldPersistTaps="handled">
            {/* En-tête */}
            <View style={modal.header}>
              <Text style={modal.title}>Nouvelle mission</Text>
              <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
                <MaterialIcons name="close" size={24} color={colors.text} />
              </TouchableOpacity>
            </View>

            {/* Indicateur brouillon */}
            {isRestored && (values.title || values.description) ? (
              <View style={modal.draftBanner}>
                <MaterialIcons name="history" size={14} color={colors.secondary} />
                <Text style={modal.draftText}>Brouillon restauré</Text>
              </View>
            ) : null}

            <Text style={modal.label}>Titre *</Text>
            <TextInput
              style={modal.input}
              placeholder="Titre de la mission"
              placeholderTextColor={colors.text + '66'}
              value={values.title}
              onChangeText={(v) => setField('title', v)}
            />

            <Text style={modal.label}>Description</Text>
            <TextInput
              style={[modal.input, modal.inputMulti]}
              placeholder="Décrivez la mission..."
              placeholderTextColor={colors.text + '66'}
              value={values.description}
              onChangeText={(v) => setField('description', v)}
              multiline
              numberOfLines={4}
              textAlignVertical="top"
            />

            {error ? <Text style={modal.error}>{error}</Text> : null}

            <TouchableOpacity
              style={[modal.submitBtn, submitting && modal.submitBtnDisabled]}
              onPress={handleSubmit}
              disabled={submitting}
            >
              {submitting ? (
                <ActivityIndicator color="#fff" />
              ) : (
                <Text style={modal.submitText}>Créer la mission</Text>
              )}
            </TouchableOpacity>
          </ScrollView>
        </KeyboardAvoidingView>
      </SafeAreaView>
    </Modal>
  );
}

// ─── Écran principal ──────────────────────────────────────────────────────────

export default function MissionsScreen() {
  // 6a — dimensions de la fenêtre (réactif à la rotation)
  const { width } = useWindowDimensions();

  // 6b — 2 colonnes en paysage (> 600 px), 1 en portrait
  const numColumns = width > 600 ? 2 : 1;

  const { missions, isLoading, error, refetch } = useMissions();
  const [refreshing, setRefreshing] = React.useState(false);
  const [showCreate, setShowCreate] = React.useState(false);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

  // 6d — spinner pendant le premier chargement
  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.center}>
          <MaterialIcons name="error-outline" size={40} color="#c0392b" />
          <Text style={styles.errorText}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      {/* En-tête avec titre + bouton + */}
      <View style={styles.header}>
        <Text style={styles.title}>Missions</Text>
        <TouchableOpacity style={styles.addBtn} onPress={() => setShowCreate(true)}>
          <MaterialIcons name="add" size={24} color="#fff" />
        </TouchableOpacity>
      </View>

      <FlatList
        // 6c — changer la key force le re-mount quand numColumns change
        key={`missions-cols-${numColumns}`}
        data={missions}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.list}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, numColumns > 1 && styles.cardWrapperMulti]}>
            <MissionCard item={item} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialIcons name="inbox" size={40} color={colors.secondary} />
            <Text style={styles.emptyText}>Aucune mission</Text>
          </View>
        }
        // 6e — pull-to-refresh
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={onRefresh}
            colors={[colors.primary]}
            tintColor={colors.primary}
          />
        }
      />

      <CreateMissionModal
        visible={showCreate}
        onClose={() => setShowCreate(false)}
        onCreated={refetch}
      />
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.primary,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  addBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.full,
    width: 36,
    height: 36,
    alignItems: 'center',
    justifyContent: 'center',
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  row: {
    gap: spacing.md,
  },
  cardWrapper: {
    flex: 1,
  },
  cardWrapperMulti: {
    flex: 0.5,
  },
  card: {
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    padding: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.07,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  cardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    gap: spacing.sm,
  },
  cardTitle: {
    flex: 1,
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.text,
  },
  cardDesc: {
    fontSize: font.size.sm,
    color: colors.text + 'bb',
    lineHeight: 20,
  },
  cardFooter: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginTop: spacing.xs,
  },
  cardMeta: {
    fontSize: font.size.xs,
    color: colors.secondary,
  },
  badge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  badgeText: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
  },
  center: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.md,
    marginTop: 80,
  },
  emptyText: {
    fontSize: font.size.md,
    color: colors.secondary,
  },
  errorText: {
    fontSize: font.size.sm,
    color: '#c0392b',
    textAlign: 'center',
    paddingHorizontal: spacing.lg,
  },
});

// ─── Styles modal ─────────────────────────────────────────────────────────────

const modal = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  container: {
    padding: spacing.lg,
    gap: spacing.md,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.sm,
  },
  title: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.primary,
  },
  draftBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: colors.background,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    borderRadius: radius.md,
  },
  draftText: {
    fontSize: font.size.xs,
    color: colors.secondary,
    fontWeight: font.weight.medium,
  },
  label: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.text,
    marginBottom: -spacing.xs,
  },
  input: {
    borderWidth: 1,
    borderColor: colors.secondary + '55',
    borderRadius: radius.md,
    padding: spacing.md,
    fontSize: font.size.md,
    color: colors.text,
    backgroundColor: colors.background,
  },
  inputMulti: {
    height: 110,
  },
  error: {
    fontSize: font.size.sm,
    color: '#c0392b',
    textAlign: 'center',
  },
  submitBtn: {
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    padding: spacing.md,
    alignItems: 'center',
    marginTop: spacing.sm,
  },
  submitBtnDisabled: {
    opacity: 0.6,
  },
  submitText: {
    color: '#fff',
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
});
