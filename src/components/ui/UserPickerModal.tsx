import React from 'react';
import {
  View,
  Text,
  Modal,
  FlatList,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { fetchAllUsers, type UserRecord } from '@/services/userService';
import { colors, spacing, radius, font } from '@/styles/theme';

// ─── Avatar ───────────────────────────────────────────────────────────────────

const PALETTE = ['#6c5ce7', '#00b894', '#e17055', '#0984e3', '#fd79a8', '#a29bfe', '#fdcb6e'];

function hashColor(id: string): string {
  let h = 0;
  for (let i = 0; i < id.length; i++) h = (h * 31 + id.charCodeAt(i)) >>> 0;
  return PALETTE[h % PALETTE.length];
}

function getInitials(name: string | null, email: string | null): string {
  const src = name?.trim() || email || '?';
  const parts = src.split(/\s+/);
  if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
  return src.slice(0, 2).toUpperCase();
}

export function UserAvatar({ user, size = 40 }: { user: UserRecord; size?: number }) {
  return (
    <View
      style={[
        av.circle,
        { width: size, height: size, borderRadius: size / 2, backgroundColor: hashColor(user.id) },
      ]}
    >
      <Text style={[av.initials, { fontSize: size * 0.36 }]}>
        {getInitials(user.full_name, user.email)}
      </Text>
    </View>
  );
}

const av = StyleSheet.create({
  circle: { alignItems: 'center', justifyContent: 'center' },
  initials: { color: '#fff', fontWeight: '600' },
});

// ─── UserPickerModal ──────────────────────────────────────────────────────────

interface Props {
  visible: boolean;
  selectedId: string | null;
  onSelect: (user: UserRecord | null) => void;
  onClose: () => void;
}

export default function UserPickerModal({ visible, selectedId, onSelect, onClose }: Props) {
  const [users, setUsers] = React.useState<UserRecord[]>([]);
  const [loading, setLoading] = React.useState(false);
  const [query, setQuery] = React.useState('');

  React.useEffect(() => {
    if (!visible) { setQuery(''); return; }
    setLoading(true);
    fetchAllUsers().then((data) => {
      setUsers(data);
      setLoading(false);
    });
  }, [visible]);

  const filtered = React.useMemo(() => {
    const q = query.trim().toLowerCase();
    if (!q) return users;
    return users.filter(
      (u) =>
        u.full_name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q),
    );
  }, [query, users]);

  const pick = (user: UserRecord | null) => {
    onSelect(user);
    onClose();
  };

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={s.safe} edges={['top', 'bottom']}>
        {/* Drag indicator */}
        <View style={s.drag} />

        {/* Header */}
        <View style={s.header}>
          <Text style={s.title}>Assigner à</Text>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}>
            <MaterialIcons name="close" size={22} color={colors.text + 'aa'} />
          </TouchableOpacity>
        </View>

        {/* Search */}
        <View style={s.searchWrap}>
          <View style={s.searchBox}>
            <MaterialIcons name="search" size={17} color={colors.text + '66'} />
            <TextInput
              style={s.searchInput}
              placeholder="Nom, e-mail…"
              placeholderTextColor={colors.text + '55'}
              value={query}
              onChangeText={setQuery}
              autoCorrect={false}
              clearButtonMode="while-editing"
              returnKeyType="search"
            />
          </View>
        </View>

        {loading ? (
          <ActivityIndicator color={colors.primary} style={{ marginTop: spacing.xl }} />
        ) : (
          <FlatList
            data={filtered}
            keyExtractor={(u) => u.id}
            keyboardShouldPersistTaps="handled"
            contentContainerStyle={s.list}
            ItemSeparatorComponent={() => <View style={s.sep} />}
            ListHeaderComponent={
              <>
                <TouchableOpacity
                  style={[s.row, !selectedId && s.rowActive]}
                  onPress={() => pick(null)}
                  activeOpacity={0.65}
                >
                  <View style={s.noneAvatar}>
                    <MaterialIcons name="person-off" size={18} color={colors.secondary} />
                  </View>
                  <View style={s.info}>
                    <Text style={[s.name, { color: colors.secondary }]}>Non assignée</Text>
                  </View>
                  {!selectedId && (
                    <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
                <View style={s.sep} />
              </>
            }
            renderItem={({ item }) => {
              const selected = item.id === selectedId;
              return (
                <TouchableOpacity
                  style={[s.row, selected && s.rowActive]}
                  onPress={() => pick(item)}
                  activeOpacity={0.65}
                >
                  <UserAvatar user={item} />
                  <View style={s.info}>
                    <Text style={s.name} numberOfLines={1}>
                      {item.full_name || item.email?.split('@')[0] || '—'}
                    </Text>
                    {item.email ? (
                      <Text style={s.email} numberOfLines={1}>{item.email}</Text>
                    ) : null}
                  </View>
                  {selected && (
                    <MaterialIcons name="check-circle" size={20} color={colors.primary} />
                  )}
                </TouchableOpacity>
              );
            }}
            ListEmptyComponent={
              <View style={s.empty}>
                <MaterialIcons name="manage-search" size={36} color={colors.secondary + '66'} />
                <Text style={s.emptyText}>Aucun résultat</Text>
              </View>
            }
          />
        )}
      </SafeAreaView>
    </Modal>
  );
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: '#fff',
  },
  drag: {
    width: 36,
    height: 4,
    borderRadius: 2,
    backgroundColor: '#d1d1d6',
    alignSelf: 'center',
    marginTop: spacing.sm,
    marginBottom: spacing.xs,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.sm,
    paddingBottom: spacing.md,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.secondary + '33',
  },
  title: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.primary,
  },
  searchWrap: {
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  searchBox: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.xs,
    backgroundColor: '#f2f2f7',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.sm,
  },
  searchInput: {
    flex: 1,
    paddingVertical: 10,
    fontSize: font.size.md,
    color: colors.text,
  },
  list: {
    paddingHorizontal: spacing.md,
    paddingBottom: spacing.xl * 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
    paddingVertical: 12,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
  },
  rowActive: {
    backgroundColor: colors.primary + '0d',
  },
  noneAvatar: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.secondary + '22',
    alignItems: 'center',
    justifyContent: 'center',
  },
  info: {
    flex: 1,
    gap: 2,
  },
  name: {
    fontSize: font.size.md,
    fontWeight: font.weight.medium,
    color: colors.text,
  },
  email: {
    fontSize: font.size.xs,
    color: colors.secondary,
  },
  sep: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.secondary + '20',
    marginLeft: 40 + spacing.md + spacing.sm,
  },
  empty: {
    alignItems: 'center',
    gap: spacing.sm,
    paddingTop: spacing.xl * 2,
  },
  emptyText: {
    fontSize: font.size.sm,
    color: colors.secondary,
  },
});
