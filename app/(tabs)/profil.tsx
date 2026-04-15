import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { useTheme, type ThemeMode } from '@/context/ThemeContext';
import { colors, spacing, radius, font, getColors } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { EditPseudoModal } from '@/components/features/EditPseudoModal';

export default function ProfilScreen() {
  const { user, signOut, isLoading, updatePseudo } = useAuth();
  const { mode, isDark, setMode } = useTheme();
  const themeColors = getColors(isDark);
  const [editModalVisible, setEditModalVisible] = useState(false);
  const pseudo: string = (user?.user_metadata?.full_name as string | undefined) ?? '';

  if (isLoading) {
    return (
      <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
        <ActivityIndicator size="large" color={themeColors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={[styles.safe, { backgroundColor: themeColors.background }]}>
      <ScrollView
        contentContainerStyle={[styles.container, { backgroundColor: themeColors.background }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={[styles.title, { color: themeColors.primary }]}>Mon Profil</Text>

        {/* Avatar placeholder */}
        <View style={[styles.avatarCircle, { backgroundColor: isDark ? '#3a2a4a' : '#e6d9ee' }]}>
          {pseudo ? (
            <Text style={[styles.avatarInitials, { color: themeColors.primary }]}>
              {pseudo.slice(0, 2).toUpperCase()}
            </Text>
          ) : (
            <MaterialIcons name="person" size={56} color={themeColors.primary} />
          )}
        </View>

        {/* Pseudo avec bouton d'édition */}
        {pseudo ? (
          <View style={styles.pseudoContainer}>
            <Text style={[styles.pseudoLabel, { color: themeColors.primary }]}>{pseudo}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="edit" size={18} color={themeColors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Sélecteur de thème - Apple Style */}
        <ThemeSelectorCard mode={mode} setMode={setMode} isDark={isDark} />

        {/* Infos */}
        <View style={[styles.card, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }]}>
          {pseudo ? <InfoRow icon="alternate-email" label="Pseudo" value={pseudo} isDark={isDark} /> : null}
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} isDark={isDark} />
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={[styles.signOutButton, { backgroundColor: themeColors.primary }]} onPress={signOut}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </ScrollView>

      {/* Modal d'édition du pseudo */}
      <EditPseudoModal
        visible={editModalVisible}
        currentPseudo={pseudo}
        onClose={() => setEditModalVisible(false)}
        onConfirm={updatePseudo}
      />
    </SafeAreaView>
  );
}

/**
 * Composant de sélecteur de thème - Apple-like Segmented Control
 * Design minimaliste et épuré
 */
function ThemeSelectorCard({
  mode,
  setMode,
  isDark,
}: {
  mode: ThemeMode;
  setMode: (mode: ThemeMode) => Promise<void>;
  isDark: boolean;
}) {
  const themeColors = getColors(isDark);
  const options: { id: ThemeMode; label: string; icon: React.ComponentProps<typeof MaterialIcons>['name'] }[] = [
    { id: 'auto', label: 'Auto', icon: 'brightness-auto' },
    { id: 'light', label: 'Clair', icon: 'wb-sunny' },
    { id: 'dark', label: 'Sombre', icon: 'dark-mode' },
  ];

  return (
    <View style={[styles.card, { backgroundColor: themeColors.cardBackground, borderColor: themeColors.border }]}>
      <View style={styles.themeHeader}>
        <MaterialIcons name="palette" size={18} color={themeColors.primary} />
        <Text style={[styles.themeLabel, { color: themeColors.text }]}>Thème</Text>
      </View>

      <View style={styles.segmentedControl}>
        {options.map((option) => (
          <TouchableOpacity
            key={option.id}
            style={[
              styles.segmentButton,
              mode === option.id && styles.segmentButtonActive,
              mode === option.id && {
                backgroundColor: isDark ? '#3a2a4a' : '#e6d9ee',
              },
            ]}
            onPress={() => setMode(option.id)}
          >
            <MaterialIcons
              name={option.icon}
              size={16}
              color={mode === option.id ? (isDark ? '#d4a5e8' : '#391d48') : (isDark ? '#b0b0b0' : '#999999')}
            />
            <Text
              style={[
                styles.segmentButtonText,
                mode === option.id && {
                  color: isDark ? '#d4a5e8' : '#391d48',
                  fontWeight: '600',
                },
                mode !== option.id && {
                  color: isDark ? '#b0b0b0' : '#999999',
                },
              ]}
            >
              {option.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
    </View>
  );
}

function InfoRow({
  icon,
  label,
  value,
  isDark,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  isDark: boolean;
}) {
  const themeColors = getColors(isDark);
  return (
    <View style={[styles.row, { borderBottomColor: themeColors.border }]}>
      <MaterialIcons name={icon} size={20} color={themeColors.secondary} style={styles.rowIcon} />
      <View>
        <Text style={[styles.rowLabel, { color: themeColors.textSecondary }]}>{label}</Text>
        <Text style={[styles.rowValue, { color: themeColors.text }]}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
  },
  container: {
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.xl,
    gap: spacing.md,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: font.weight.bold,
    letterSpacing: 1,
  },
  pseudoContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
  },
  pseudoLabel: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
  },
  editButton: {
    padding: spacing.sm,
  },
  card: {
    width: '100%',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    borderWidth: 1,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  themeHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    marginBottom: spacing.md,
  },
  themeLabel: {
    fontSize: font.size.sm,
    fontWeight: font.weight.bold,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  segmentedControl: {
    flexDirection: 'row',
    backgroundColor: 'transparent',
    borderRadius: radius.md,
    gap: spacing.sm,
  },
  segmentButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: spacing.xs,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.sm,
    borderRadius: radius.md,
    borderWidth: 1,
    borderColor: 'transparent',
  },
  segmentButtonActive: {
    borderWidth: 0,
  },
  segmentButtonText: {
    fontSize: font.size.sm,
    fontWeight: font.weight.medium,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
  },
  rowIcon: {
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: font.size.xs,
    fontWeight: font.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: font.size.md,
    fontWeight: font.weight.regular,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    paddingVertical: spacing.md,
    paddingHorizontal: spacing.xl,
    borderRadius: radius.md,
    marginTop: spacing.md,
  },
  signOutText: {
    color: '#fff',
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
  },
});
