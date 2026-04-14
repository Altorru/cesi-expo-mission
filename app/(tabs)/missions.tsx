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
  Pressable,
} from 'react-native';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useMissions } from '@/hooks/useMissions';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchUserPseudos } from '@/services/userService';
import type { Mission, PriorityLevel } from '@/types/mission';
import { colors, spacing, radius, font } from '@/styles/theme';

// ─── Badge priorité ───────────────────────────────────────────────────────────

const PRIORITY_META: Record<PriorityLevel, { label: string; color: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }> = {
  Critique: { label: 'Critique',   color: '#c0392b', icon: 'priority-high' },
  Urgent:   { label: 'Urgent',     color: '#e67e22', icon: 'warning-amber' },
  Normal:   { label: 'Normal',     color: '#27ae60', icon: 'check-circle-outline' },
};

function PriorityBadge({ priority }: { priority: PriorityLevel | string | null }) {
  if (!priority) return null;
  const meta = PRIORITY_META[priority as PriorityLevel] ?? { label: priority, color: '#888', icon: 'flag' as React.ComponentProps<typeof MaterialIcons>['name'] };
  return (
    <View style={[styles.badge, { backgroundColor: meta.color + '22' }]}>
      <MaterialIcons name={meta.icon} size={12} color={meta.color} />
      <Text style={[styles.badgeText, { color: meta.color }]}>{meta.label}</Text>
    </View>
  );
}

// ─── Carte mission ────────────────────────────────────────────────────────────

function MissionCard({ item, authorPseudo }: { item: Mission; authorPseudo?: string }) {
  const router = useRouter();
  return (
    <Pressable
      style={({ pressed }) => [styles.card, pressed && { opacity: 0.85 }]}
      onPress={() => router.push(`/mission/${item.id}`)}
    >
      {/* Titre */}
      <View style={styles.cardHeader}>
        <Text style={styles.cardTitle} numberOfLines={2}>{item.title}</Text>
      </View>

      {/* Ligne 2 : catégorie + priorité */}
      {(item.category || item.priority) ? (
        <View style={styles.cardTags}>
          {item.category ? (
            <View style={styles.categoryChip}>
              <MaterialIcons name="label-outline" size={11} color={colors.primary} />
              <Text style={styles.categoryText}>{item.category}</Text>
            </View>
          ) : null}
          <PriorityBadge priority={item.priority} />
        </View>
      ) : null}

      {/* Ligne 3 : description courte */}
      {item.description ? (
        <Text style={styles.cardDesc} numberOfLines={2}>{item.description}</Text>
      ) : null}

      {/* Footer : auteur + deadline */}
      <View style={styles.cardFooter}>
        <MaterialIcons name="person-outline" size={14} color={colors.secondary} />
        <Text style={styles.cardMeta}>{authorPseudo || item.author?.slice(0, 8) || '—'}</Text>

        {item.deadline ? (
          <>
            <MaterialIcons name="event" size={13} color={colors.secondary} style={{ marginLeft: 'auto' }} />
            <Text style={styles.cardMeta}>
              {new Date(item.deadline).toLocaleDateString('fr-FR')}
            </Text>
          </>
        ) : (
          <MaterialIcons name="chevron-right" size={16} color={colors.secondary} style={{ marginLeft: 'auto' }} />
        )}
      </View>
    </Pressable>
  );
}

// ─── Formulaire de création (modal) ──────────────────────────────────────────

const DRAFT_KEY = 'draft_create_mission';
const DRAFT_INITIAL = { title: '', description: '', category: '', deadline: '', priority: '' };

const PRIORITY_OPTIONS: { value: string; label: string; color: string }[] = [
  { value: 'Normal',   label: 'Normal',   color: '#27ae60' },
  { value: 'Urgent',   label: 'Urgent',   color: '#e67e22' },
  { value: 'Critique', label: 'Critique', color: '#c0392b' },
];

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
  const [showDatePicker, setShowDatePicker] = React.useState(false);

  const deadlineDate = values.deadline ? new Date(values.deadline) : new Date();

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setField('deadline', date.toISOString().split('T')[0]);
  };

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
      category: values.category.trim() || null,
      deadline: values.deadline || null,   // déjà au format AAAA-MM-JJ
      priority: values.priority || null,
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

            <Text style={modal.label}>Titre *</Text>
            <TextInput
              style={modal.input}
              placeholder="Titre de la mission"
              placeholderTextColor={colors.text + '66'}
              value={values.title}
              onChangeText={(v) => setField('title', v)}
            />

            <Text style={modal.label}>Catégorie</Text>
            <TextInput
              style={modal.input}
              placeholder="Ex : Urgence, Terrain, Admin…"
              placeholderTextColor={colors.text + '66'}
              value={values.category}
              onChangeText={(v) => setField('category', v)}
            />

            <Text style={modal.label}>Priorité</Text>
            <View style={modal.priorityRow}>
              {PRIORITY_OPTIONS.map((opt) => {
                const selected = values.priority === opt.value;
                return (
                  <TouchableOpacity
                    key={opt.value}
                    style={[
                      modal.priorityBtn,
                      { borderColor: opt.color },
                      selected && { backgroundColor: opt.color },
                    ]}
                    onPress={() => setField('priority', selected ? '' : opt.value)}
                  >
                    <Text style={[modal.priorityBtnText, { color: selected ? '#fff' : opt.color }]}>
                      {opt.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>

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

            <Text style={modal.label}>Deadline</Text>
            {/* Bouton d'ouverture du picker */}
            <TouchableOpacity
              style={modal.dateBtn}
              onPress={() => setShowDatePicker((v) => !v)}
            >
              <MaterialIcons name="event" size={16} color={colors.primary} />
              <Text style={[modal.dateBtnText, !values.deadline && { color: colors.text + '66' }]}>
                {values.deadline
                  ? new Date(values.deadline).toLocaleDateString('fr-FR')
                  : 'Choisir une date'}
              </Text>
              {values.deadline ? (
                <TouchableOpacity
                  onPress={(e) => { e.stopPropagation(); setField('deadline', ''); setShowDatePicker(false); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={16} color={colors.secondary} />
                </TouchableOpacity>
              ) : (
                <MaterialIcons name="expand-more" size={16} color={colors.secondary} />
              )}
            </TouchableOpacity>

            {/* iOS : picker dans un Modal overlay pour éviter le chevauchement */}
            {Platform.OS === 'ios' ? (
              <Modal
                visible={showDatePicker}
                transparent
                animationType="fade"
                onRequestClose={() => setShowDatePicker(false)}
              >
                <TouchableOpacity
                  style={modal.datePickerBackdrop}
                  activeOpacity={1}
                  onPress={() => setShowDatePicker(false)}
                >
                  <TouchableOpacity activeOpacity={1} style={modal.datePickerCard}>
                    <DateTimePicker
                      value={deadlineDate}
                      mode="date"
                      display="spinner"
                      minimumDate={new Date()}
                      onChange={onDateChange}
                      locale="fr-FR"
                      style={{ width: '100%' }}
                    />
                    <TouchableOpacity style={modal.dateConfirmBtn} onPress={() => setShowDatePicker(false)}>
                      <Text style={modal.dateConfirmText}>Confirmer</Text>
                    </TouchableOpacity>
                  </TouchableOpacity>
                </TouchableOpacity>
              </Modal>
            ) : (
              /* Android : picker natif inline */
              showDatePicker && (
                <DateTimePicker
                  value={deadlineDate}
                  mode="date"
                  display="default"
                  minimumDate={new Date()}
                  onChange={onDateChange}
                  locale="fr-FR"
                />
              )
            )}

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
  const [authorPseudos, setAuthorPseudos] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    if (missions.length === 0) return;
    fetchUserPseudos(missions.map((m) => m.author)).then(setAuthorPseudos);
  }, [missions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setRefreshing(false);
  };

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
        <Text style={styles.screenTitle}>Missions</Text>
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
            <MissionCard item={item} authorPseudo={item.author ? authorPseudos[item.author] : undefined} />
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
  screenTitle: {
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
  cardTags: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.xs,
  },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 3,
    backgroundColor: colors.primary + '18',
    paddingHorizontal: spacing.sm,
    paddingVertical: 3,
    borderRadius: radius.full,
  },
  categoryText: {
    fontSize: font.size.xs,
    color: colors.primary,
    fontWeight: font.weight.medium,
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
  dateBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondary + '55',
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
  },
  dateBtnText: {
    flex: 1,
    fontSize: font.size.md,
    color: colors.text,
  },
  datePickerBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'flex-end',
  },
  datePickerCard: {
    backgroundColor: colors.background,
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingBottom: spacing.xl,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
  },
  dateConfirmBtn: {
    alignSelf: 'stretch',
    paddingVertical: spacing.md,
    backgroundColor: colors.primary,
    borderRadius: radius.md,
    marginTop: spacing.sm,
    alignItems: 'center',
  },
  dateConfirmText: {
    color: '#fff',
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
  },
  priorityRow: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  priorityBtn: {
    flex: 1,
    borderWidth: 1.5,
    borderRadius: radius.md,
    paddingVertical: spacing.sm,
    alignItems: 'center',
  },
  priorityBtnText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
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
