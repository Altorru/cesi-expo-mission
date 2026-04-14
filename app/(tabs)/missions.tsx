import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  StyleSheet,
  useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { MaterialIcons } from '@expo/vector-icons';
import { useMissions } from '@/hooks/useMissions';
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
          {item.author_id ?? '—'}
        </Text>
      </View>
    </View>
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
      <Text style={styles.title}>Missions</Text>
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
    </SafeAreaView>
  );
}

// On importe React explicitement pour useState
import React from 'react';

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
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
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
