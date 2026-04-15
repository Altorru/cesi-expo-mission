import React from 'react';
import {
  View,
  Text,
  TextInput,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Modal,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import DateTimePicker, { DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { MaterialIcons } from '@expo/vector-icons';
import type { PriorityLevel } from '@/types/mission';
import { colors, spacing, radius, font } from '@/styles/theme';
import { fetchUserById, type UserRecord } from '@/services/userService';
import UserPickerModal, { UserAvatar } from '@/components/ui/UserPickerModal';

// ─── Types ────────────────────────────────────────────────────────────────────

export interface MissionFormValues {
  title: string;
  description: string;
  category: string;
  deadline: string;
  priority: PriorityLevel | '';
  in_charge: string | null;
}

interface MissionFormProps {
  headerTitle: string;
  initialValues?: Partial<MissionFormValues>;
  saving: boolean;
  serverError?: string;
  onSubmit: (values: MissionFormValues) => void;
  onCancel: () => void;
}

const PRIORITY_OPTIONS: { value: PriorityLevel; label: string; color: string }[] = [
  { value: 'Normal',   label: 'Normal',   color: '#27ae60' },
  { value: 'Urgent',   label: 'Urgent',   color: '#e67e22' },
  { value: 'Critique', label: 'Critique', color: '#c0392b' },
];

// ─── Composant formulaire partagé ─────────────────────────────────────────────

export default function MissionForm({
  headerTitle,
  initialValues = {},
  saving,
  serverError = '',
  onSubmit,
  onCancel,
}: MissionFormProps) {
  const [title, setTitle]             = React.useState(initialValues.title ?? '');
  const [description, setDescription] = React.useState(initialValues.description ?? '');
  const [category, setCategory]       = React.useState(initialValues.category ?? '');
  const [deadline, setDeadline]       = React.useState(initialValues.deadline ?? '');
  const [priority, setPriority]       = React.useState<PriorityLevel | ''>(initialValues.priority ?? '');
  const [localError, setLocalError]   = React.useState('');
  const [showDatePicker, setShowDatePicker] = React.useState(false);
  const [inCharge, setInCharge]         = React.useState<string | null>(initialValues.in_charge ?? null);
  const [inChargeUser, setInChargeUser] = React.useState<UserRecord | null>(null);
  const [showUserPicker, setShowUserPicker] = React.useState(false);

  // Sync quand le parent charge les données en async (cas modify)
  React.useEffect(() => {
    if (initialValues.title !== undefined)       setTitle(initialValues.title);
    if (initialValues.description !== undefined) setDescription(initialValues.description);
    if (initialValues.category !== undefined)    setCategory(initialValues.category);
    if (initialValues.deadline !== undefined)    setDeadline(initialValues.deadline);
    if (initialValues.priority !== undefined)    setPriority(initialValues.priority);
    if (initialValues.in_charge !== undefined) {
      const id = initialValues.in_charge ?? null;
      setInCharge(id);
      if (id) fetchUserById(id).then((u) => setInChargeUser(u ?? null));
      else setInChargeUser(null);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [
    initialValues.title,
    initialValues.description,
    initialValues.category,
    initialValues.deadline,
    initialValues.priority,
    initialValues.in_charge,
  ]);

  const deadlineDate = deadline ? new Date(deadline) : new Date();
  const errorMsg = localError || serverError;

  const onDateChange = (_: DateTimePickerEvent, date?: Date) => {
    if (Platform.OS === 'android') setShowDatePicker(false);
    if (date) setDeadline(date.toISOString().split('T')[0]);
  };

  const handleChangeTitle = (v: string) => {
    setTitle(v);
    if (localError) setLocalError('');
  };

  const handleSubmit = () => {
    if (!title.trim()) { setLocalError('Le titre est obligatoire.'); return; }
    setLocalError('');
    onSubmit({ title, description, category, deadline, priority, in_charge: inCharge });
  };

  return (
    <SafeAreaView style={styles.safe}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={saving}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialIcons name="close" size={24} color={colors.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>{headerTitle}</Text>
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={saving}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          {saving
            ? <ActivityIndicator size="small" color={colors.primary} />
            : <MaterialIcons name="check" size={24} color={colors.primary} />
          }
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <ScrollView
          contentContainerStyle={styles.content}
          keyboardShouldPersistTaps="handled"
        >
          {/* Erreur */}
          {errorMsg ? (
            <View style={styles.errorBanner}>
              <MaterialIcons name="error-outline" size={16} color="#c0392b" />
              <Text style={styles.errorText}>{errorMsg}</Text>
            </View>
          ) : null}

          {/* Titre */}
          <Text style={styles.label}>Titre *</Text>
          <TextInput
            style={styles.input}
            placeholder="Titre de la mission"
            placeholderTextColor={colors.text + '66'}
            value={title}
            onChangeText={handleChangeTitle}
          />

          {/* Catégorie */}
          <Text style={styles.label}>Catégorie</Text>
          <TextInput
            style={styles.input}
            placeholder="Ex : Urgence, Terrain, Admin…"
            placeholderTextColor={colors.text + '66'}
            value={category}
            onChangeText={setCategory}
          />

          {/* Priorité */}
          <Text style={styles.label}>Priorité</Text>
          <View style={styles.priorityRow}>
            {PRIORITY_OPTIONS.map((opt) => {
              const selected = priority === opt.value;
              return (
                <TouchableOpacity
                  key={opt.value}
                  style={[
                    styles.priorityBtn,
                    { borderColor: opt.color },
                    selected && { backgroundColor: opt.color },
                  ]}
                  onPress={() => setPriority(selected ? '' : opt.value)}
                >
                  <Text style={[styles.priorityBtnText, { color: selected ? '#fff' : opt.color }]}>
                    {opt.label}
                  </Text>
                </TouchableOpacity>
              );
            })}
          </View>

          {/* Description */}
          <Text style={styles.label}>Description</Text>
          <TextInput
            style={[styles.input, styles.inputMulti]}
            placeholder="Décrivez la mission..."
            placeholderTextColor={colors.text + '66'}
            value={description}
            onChangeText={setDescription}
            multiline
            numberOfLines={4}
            textAlignVertical="top"
          />

          {/* Deadline */}
          <Text style={styles.label}>Deadline</Text>
          <TouchableOpacity
            style={styles.dateBtn}
            onPress={() => setShowDatePicker((v) => !v)}
          >
            <MaterialIcons name="event" size={16} color={colors.primary} />
            <Text style={[styles.dateBtnText, !deadline && { color: colors.text + '66' }]}>
              {deadline
                ? new Date(deadline).toLocaleDateString('fr-FR')
                : 'Choisir une date'}
            </Text>
            {deadline ? (
              <TouchableOpacity
                onPress={(e) => { e.stopPropagation(); setDeadline(''); setShowDatePicker(false); }}
                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              >
                <MaterialIcons name="close" size={16} color={colors.secondary} />
              </TouchableOpacity>
            ) : (
              <MaterialIcons name="expand-more" size={16} color={colors.secondary} />
            )}
          </TouchableOpacity>

          {/* iOS : picker dans un overlay */}
          {Platform.OS === 'ios' ? (
            <Modal
              visible={showDatePicker}
              transparent
              animationType="fade"
              onRequestClose={() => setShowDatePicker(false)}
            >
              <TouchableOpacity
                style={styles.datePickerBackdrop}
                activeOpacity={1}
                onPress={() => setShowDatePicker(false)}
              >
                <TouchableOpacity activeOpacity={1} style={styles.datePickerCard}>
                  <DateTimePicker
                    value={deadlineDate}
                    mode="date"
                    display="spinner"
                    minimumDate={new Date()}
                    onChange={onDateChange}
                    locale="fr-FR"
                    style={{ width: '100%' }}
                  />
                  <TouchableOpacity
                    style={styles.dateConfirmBtn}
                    onPress={() => setShowDatePicker(false)}
                  >
                    <Text style={styles.dateConfirmText}>Confirmer</Text>
                  </TouchableOpacity>
                </TouchableOpacity>
              </TouchableOpacity>
            </Modal>
          ) : (
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

          {/* Assigné à */}
          <Text style={styles.label}>Assigné à</Text>
          <TouchableOpacity
            style={styles.selectBtn}
            onPress={() => setShowUserPicker(true)}
            activeOpacity={0.7}
          >
            {inChargeUser ? (
              <>
                <UserAvatar user={inChargeUser} size={32} />
                <View style={{ flex: 1 }}>
                  <Text style={styles.selectBtnName} numberOfLines={1}>
                    {inChargeUser.full_name || inChargeUser.email?.split('@')[0] || '—'}
                  </Text>
                  {inChargeUser.email ? (
                    <Text style={styles.selectBtnEmail} numberOfLines={1}>{inChargeUser.email}</Text>
                  ) : null}
                </View>
                <TouchableOpacity
                  onPress={() => { setInCharge(null); setInChargeUser(null); }}
                  hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                >
                  <MaterialIcons name="close" size={16} color={colors.secondary} />
                </TouchableOpacity>
              </>
            ) : (
              <>
                <MaterialIcons name="person-add-alt" size={20} color={colors.secondary} />
                <Text style={styles.selectBtnPlaceholder}>Assigner à un utilisateur</Text>
                <MaterialIcons name="chevron-right" size={18} color={colors.secondary + '88'} />
              </>
            )}
          </TouchableOpacity>

          <UserPickerModal
            visible={showUserPicker}
            selectedId={inCharge}
            onSelect={(user) => {
              setInCharge(user?.id ?? null);
              setInChargeUser(user);
            }}
            onClose={() => setShowUserPicker(false)}
          />
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  safe: { flex: 1, backgroundColor: '#fff' },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.secondary + '22',
  },
  headerTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.primary,
  },
  content: {
    padding: spacing.lg,
    gap: spacing.md,
    paddingBottom: spacing.xl * 2,
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
  inputMulti: { height: 110 },
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

