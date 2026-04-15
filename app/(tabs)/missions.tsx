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
import { Skeleton } from 'boneyard-js/native';
import { MISSION_CARD_BONES, FILTER_CHIPS_BONES, SORT_BUTTON_BONES } from '@/components/ui/SkeletonBones';
import { useMissions } from '@/hooks/useMissions';
import { useFormPersistence } from '@/hooks/useFormPersistence';
import { useAuth } from '@/context/AuthContext';
import { supabase } from '@/lib/supabase';
import { fetchUserPseudos, fetchUserById, type UserRecord } from '@/services/userService';
import type { Mission, PriorityLevel } from '@/types/mission';
import { colors, spacing, radius, font } from '@/styles/theme';
import UserPickerModal, { UserAvatar } from '@/components/ui/UserPickerModal';

// ─── Constantes de filtre ─────────────────────────────────────────────────────

const PRIORITY_FILTERS = [
  { value: 'Critique', label: 'Critique', color: '#c0392b', icon: 'priority-high' as const },
  { value: 'Urgent', label: 'Urgent', color: '#e67e22', icon: 'warning-amber' as const },
  { value: 'Normal', label: 'Normal', color: '#27ae60', icon: 'check-circle-outline' as const },
];

const SORT_OPTIONS = [
  { value: 'date-desc', label: "Récent d'abord", icon: 'arrow-downward' as const },
  { value: 'date-asc', label: "Ancien d'abord", icon: 'arrow-upward' as const },
  { value: 'alphabetic-asc', label: 'A → Z', icon: 'sort-by-alpha' as const },
  { value: 'alphabetic-desc', label: 'Z → A', icon: 'sort-by-alpha' as const },
];

/** Nombre de missions chargées par page (infinite scroll) */
const PAGE_SIZE = 8;

// ─── Badge Badge priorité ───────────────────────────────────────────────────────────

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

function MissionCard({ item, authorName }: { item: Mission; authorName?: string }) {
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
        <Text style={styles.cardMeta}>{authorName || '—'}</Text>

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
  const [inCharge, setInCharge] = React.useState<UserRecord | null>(null);
  const [showUserPicker, setShowUserPicker] = React.useState(false);

  // Pré-remplir avec l'utilisateur courant à l'ouverture
  React.useEffect(() => {
    if (!visible || !user?.id) return;
    fetchUserById(user.id).then((u) => setInCharge(u));
  }, [visible, user?.id]);

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
      in_charge: inCharge?.id ?? null,
      author: user?.id ?? null,
    });
    setSubmitting(false);
    if (sbError) {
      setError(sbError.message);
      return;
    }
    await clearDraft();
    if (user?.id) fetchUserById(user.id).then((u) => setInCharge(u));
    else setInCharge(null);
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

            {/* Assigné à */}
            <Text style={modal.label}>Assigné à</Text>
            <TouchableOpacity
              style={modal.selectBtn}
              onPress={() => setShowUserPicker(true)}
              activeOpacity={0.7}
            >
              {inCharge ? (
                <>
                  <UserAvatar user={inCharge} size={32} />
                  <View style={{ flex: 1 }}>
                    <Text style={modal.selectBtnName} numberOfLines={1}>
                      {inCharge.full_name || inCharge.email?.split('@')[0] || '—'}
                    </Text>
                    {inCharge.email ? (
                      <Text style={modal.selectBtnEmail} numberOfLines={1}>{inCharge.email}</Text>
                    ) : null}
                  </View>
                  <TouchableOpacity
                    onPress={() => setInCharge(null)}
                    hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                  >
                    <MaterialIcons name="close" size={16} color={colors.secondary} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <MaterialIcons name="person-add-alt" size={20} color={colors.secondary} />
                  <Text style={modal.selectBtnPlaceholder}>Assigner à un utilisateur</Text>
                  <MaterialIcons name="chevron-right" size={18} color={colors.secondary + '88'} />
                </>
              )}
            </TouchableOpacity>

            <UserPickerModal
              visible={showUserPicker}
              selectedId={inCharge?.id ?? null}
              onSelect={setInCharge}
              onClose={() => setShowUserPicker(false)}
            />

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

  // Filtres et tri
  const [selectedPriorities, setSelectedPriorities] = React.useState<Set<string>>(
    new Set(['Critique', 'Urgent', 'Normal'])
  );
  const [filterCategory, setFilterCategory] = React.useState<string | null>(null);
  const [filterInCharge, setFilterInCharge] = React.useState<string | null>(null);
  const [sortBy, setSortBy] = React.useState('date-desc');
  const [showSortModal, setShowSortModal] = React.useState(false);

  // Pagination (infinite scroll)
  const [displayCount, setDisplayCount] = React.useState(PAGE_SIZE);

  // Calcul des missions filtrées et triées
  const filteredMissions = React.useMemo(() => {
    let result = missions;

    // Appliquer les filtres
    if (selectedPriorities.size < 3) {
      // Si tous les filtres sont sélectionnés (size === 3), ne pas filtrer
      result = result.filter((m) => m.priority && selectedPriorities.has(m.priority));
    }
    if (filterCategory) {
      result = result.filter((m) => m.category?.toLowerCase().includes(filterCategory.toLowerCase()));
    }
    if (filterInCharge) {
      result = result.filter((m) => m.in_charge === filterInCharge);
    }

    // Appliquer le tri
    const sorted = [...result];
    if (sortBy === 'date-desc') {
      sorted.sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime());
    } else if (sortBy === 'date-asc') {
      sorted.sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime());
    } else if (sortBy === 'alphabetic-asc') {
      sorted.sort((a, b) => a.title.localeCompare(b.title));
    } else if (sortBy === 'alphabetic-desc') {
      sorted.sort((a, b) => b.title.localeCompare(a.title));
    }

    return sorted;
  }, [missions, selectedPriorities, filterCategory, filterInCharge, sortBy]);

  // Pagination : missions affichées (tranche courante)
  const visibleMissions = React.useMemo(
    () => filteredMissions.slice(0, displayCount),
    [filteredMissions, displayCount],
  );
  const hasMore = displayCount < filteredMissions.length;

  const loadMore = React.useCallback(() => {
    if (hasMore) {
      setDisplayCount((prev) => prev + PAGE_SIZE);
    }
  }, [hasMore]);

  // Reset pagination quand les filtres/tri changent
  React.useEffect(() => {
    setDisplayCount(PAGE_SIZE);
  }, [selectedPriorities, filterCategory, filterInCharge, sortBy]);

  React.useEffect(() => {
    if (missions.length === 0) return;
    fetchUserPseudos(missions.map((m) => m.author)).then(setAuthorPseudos);
  }, [missions]);

  const onRefresh = async () => {
    setRefreshing(true);
    await refetch();
    setDisplayCount(PAGE_SIZE);
    setRefreshing(false);
  };

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <View style={styles.header}>
          <Text style={styles.screenTitle}>Missions</Text>
        </View>

        {/* Squelette filtres */}
        <View style={styles.filtersWrap}>
          <View style={{ overflow: 'hidden', borderRadius: 12 }}>
            <Skeleton loading initialBones={FILTER_CHIPS_BONES}>
              <View style={{ height: FILTER_CHIPS_BONES.height }} />
            </Skeleton>
          </View>
        </View>

        {/* Squelette tri */}
        <View style={{ marginHorizontal: spacing.md, marginBottom: spacing.sm, overflow: 'hidden', borderRadius: 8 }}>
          <Skeleton loading initialBones={SORT_BUTTON_BONES}>
            <View style={{ height: SORT_BUTTON_BONES.height }} />
          </Skeleton>
        </View>

        {/* Squelettes cartes */}
        <ScrollView contentContainerStyle={styles.list}>
          {[1, 2, 3, 4, 5].map((i) => (
            <View key={i} style={styles.cardWrapper}>
              <View style={[styles.card, { overflow: 'hidden' }]}>
                <Skeleton loading initialBones={MISSION_CARD_BONES}>
                  <View style={{ height: MISSION_CARD_BONES.height }} />
                </Skeleton>
              </View>
            </View>
          ))}
        </ScrollView>
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

      {/* Filtres */}
      <View style={styles.filtersWrap}>
        {/* Priorité */}
        <FlatList
          horizontal
          data={PRIORITY_FILTERS}
          keyExtractor={(item) => String(item.value ?? 'all')}
          contentContainerStyle={styles.filterScroll}
          scrollEnabled={false}
          renderItem={({ item }) => {
            const isSelected = item.value === null ? selectedPriorities.size === 3 : selectedPriorities.has(item.value);
            const bgColor = item.color || colors.secondary;
            return (
              <TouchableOpacity
                style={[
                  styles.chip,
                  isSelected && {
                    backgroundColor: bgColor,
                    borderColor: bgColor,
                  },
                  !isSelected && {
                    backgroundColor: bgColor + '15',
                    borderColor: bgColor + '55',
                  },
                ]}
                onPress={() => {
                  if (item.value === null) {
                    // "Toutes" : sélectionner toutes les priorités
                    setSelectedPriorities(new Set(['Critique', 'Urgent', 'Normal']));
                  } else {
                    // Toggle la priorité
                    const newSet = new Set(selectedPriorities);
                    if (newSet.has(item.value)) {
                      newSet.delete(item.value);
                    } else {
                      newSet.add(item.value);
                    }
                    setSelectedPriorities(newSet);
                  }
                }}
                activeOpacity={0.7}
              >
                {item.icon && (
                  <MaterialIcons
                    name={item.icon}
                    size={14}
                    color={isSelected ? '#fff' : bgColor}
                    style={{ marginRight: 4 }}
                  />
                )}
                <Text
                  style={[
                    styles.chipText,
                    { color: isSelected ? '#fff' : bgColor },
                    isSelected && { fontWeight: font.weight.bold },
                  ]}
                >
                  {item.label}
                </Text>
              </TouchableOpacity>
            );
          }}
        />
      </View>

      {/* Tri modal picker */}
      <TouchableOpacity
        style={styles.sortBtn}
        onPress={() => setShowSortModal(true)}
        activeOpacity={0.7}
      >
        <MaterialIcons name="sort" size={16} color={colors.primary} />
        <Text style={styles.sortBtnText}>
          {SORT_OPTIONS.find((o) => o.value === sortBy)?.label || 'Tri'}
        </Text>
        <MaterialIcons name="expand-more" size={16} color={colors.primary} />
      </TouchableOpacity>

      {/* Modal de tri */}
      <Modal
        visible={showSortModal}
        transparent
        animationType="fade"
        onRequestClose={() => setShowSortModal(false)}
      >
        <TouchableOpacity
          style={styles.sortModalBackdrop}
          activeOpacity={1}
          onPress={() => setShowSortModal(false)}
        >
          <TouchableOpacity
            activeOpacity={1}
            style={styles.sortModalCard}
            onPress={(e) => e.stopPropagation()}
          >
            <Text style={styles.sortModalTitle}>Trier les missions</Text>
            {SORT_OPTIONS.map((option) => {
              const selected = sortBy === option.value;
              return (
                <TouchableOpacity
                  key={option.value}
                  style={[styles.sortModalRow, selected && styles.sortModalRowActive]}
                  onPress={() => {
                    setSortBy(option.value);
                    setShowSortModal(false);
                  }}
                  activeOpacity={0.65}
                >
                  <View style={{ flex: 1 }}>
                    <Text style={[styles.sortModalRowText, selected && styles.sortModalRowTextActive]}>
                      {option.label}
                    </Text>
                  </View>
                  {selected && (
                    <MaterialIcons name="check" size={18} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            })}
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>

      <FlatList
        // 6c — changer la key force le re-mount quand numColumns change
        key={`missions-cols-${numColumns}`}
        data={visibleMissions}
        keyExtractor={(item) => item.id}
        numColumns={numColumns}
        contentContainerStyle={styles.list}
        columnWrapperStyle={numColumns > 1 ? styles.row : undefined}
        renderItem={({ item }) => (
          <View style={[styles.cardWrapper, numColumns > 1 && styles.cardWrapperMulti]}>
            <MissionCard item={item} authorName={item.author ? authorPseudos[item.author] : undefined} />
          </View>
        )}
        ListEmptyComponent={
          <View style={styles.center}>
            <MaterialIcons name="inbox" size={40} color={colors.secondary} />
            <Text style={styles.emptyText}>Aucune mission</Text>
          </View>
        }
        // Infinite scroll
        onEndReached={loadMore}
        onEndReachedThreshold={0.4}
        ListFooterComponent={
          hasMore ? (
            <ActivityIndicator
              size="small"
              color={colors.primary}
              style={{ paddingVertical: spacing.lg }}
            />
          ) : null
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
  filtersWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  filterScroll: {
    gap: spacing.xs,
  },
  chip: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: 8,
    borderRadius: radius.full,
    borderWidth: 1.5,
  },
  chipActive: {},
  chipText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
  chipTextActive: {},
  sortBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    marginHorizontal: spacing.md,
    marginBottom: spacing.sm,
    paddingHorizontal: spacing.md,
    paddingVertical: 10,
    backgroundColor: colors.background,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: colors.primary + '33',
  },
  sortBtnText: {
    flex: 1,
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
    color: colors.primary,
  },
  sortModalBackdrop: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.4)',
    justifyContent: 'flex-end',
  },
  sortModalCard: {
    backgroundColor: '#fff',
    borderTopLeftRadius: radius.lg,
    borderTopRightRadius: radius.lg,
    paddingTop: spacing.lg,
    paddingHorizontal: spacing.lg,
    paddingBottom: spacing.xl,
    gap: spacing.xs,
  },
  sortModalTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.primary,
    marginBottom: spacing.sm,
  },
  sortModalRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
  },
  sortModalRowActive: {
    backgroundColor: colors.primary + '12',
  },
  sortModalRowText: {
    fontSize: font.size.md,
    color: colors.text + 'cc',
  },
  sortModalRowTextActive: {
    color: colors.primary,
    fontWeight: font.weight.bold,
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
  selectBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    borderWidth: 1,
    borderColor: colors.secondary + '55',
    borderRadius: radius.md,
    padding: spacing.md,
    backgroundColor: colors.background,
    minHeight: 52,
  },
  selectBtnName: {
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
    color: colors.text,
  },
  selectBtnEmail: {
    fontSize: font.size.xs,
    color: colors.secondary,
    marginTop: 1,
  },
  selectBtnPlaceholder: {
    flex: 1,
    fontSize: font.size.md,
    color: colors.text + '66',
  },
});
