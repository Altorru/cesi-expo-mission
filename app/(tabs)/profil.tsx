import { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useAuth } from '@/context/AuthContext';
import { colors, spacing, radius, font } from '@/styles/theme';
import { MaterialIcons } from '@expo/vector-icons';
import { EditPseudoModal } from '@/components/features/EditPseudoModal';

export default function ProfilScreen() {
  const { user, signOut, isLoading, updatePseudo } = useAuth();
  const [editModalVisible, setEditModalVisible] = useState(false);
  const pseudo: string = (user?.user_metadata?.full_name as string | undefined) ?? '';

  if (isLoading) {
    return (
      <SafeAreaView style={styles.safe}>
        <ActivityIndicator size="large" color={colors.primary} style={{ flex: 1 }} />
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>Mon Profil</Text>

        {/* Avatar placeholder */}
        <View style={styles.avatarCircle}>
          {pseudo ? (
            <Text style={styles.avatarInitials}>
              {pseudo.slice(0, 2).toUpperCase()}
            </Text>
          ) : (
            <MaterialIcons name="person" size={56} color={colors.primary} />
          )}
        </View>

        {/* Pseudo avec bouton d'édition */}
        {pseudo ? (
          <View style={styles.pseudoContainer}>
            <Text style={styles.pseudoLabel}>{pseudo}</Text>
            <TouchableOpacity
              style={styles.editButton}
              onPress={() => setEditModalVisible(true)}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
            >
              <MaterialIcons name="edit" size={18} color={colors.primary} />
            </TouchableOpacity>
          </View>
        ) : null}

        {/* Infos */}
        <View style={styles.card}>
          {pseudo ? <InfoRow icon="alternate-email" label="Pseudo" value={pseudo} /> : null}
          <InfoRow icon="mail-outline" label="Email" value={user?.email ?? '—'} />
        </View>

        {/* Déconnexion */}
        <TouchableOpacity style={styles.signOutButton} onPress={signOut}>
          <MaterialIcons name="logout" size={20} color="#fff" />
          <Text style={styles.signOutText}>Se déconnecter</Text>
        </TouchableOpacity>
      </View>

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

function InfoRow({
  icon,
  label,
  value,
}: {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
}) {
  return (
    <View style={styles.row}>
      <MaterialIcons name={icon} size={20} color={colors.secondary} style={styles.rowIcon} />
      <View>
        <Text style={styles.rowLabel}>{label}</Text>
        <Text style={styles.rowValue}>{value}</Text>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: colors.background,
  },
  container: {
    flex: 1,
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    gap: spacing.lg,
  },
  title: {
    fontSize: font.size.xl,
    fontWeight: font.weight.bold,
    color: colors.primary,
  },
  avatarCircle: {
    width: 100,
    height: 100,
    borderRadius: radius.full,
    backgroundColor: '#e6d9ee',
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarInitials: {
    fontSize: 36,
    fontWeight: font.weight.bold,
    color: colors.primary,
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
    color: colors.primary,
  },
  editButton: {
    padding: spacing.sm,
  },
  card: {
    width: '100%',
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: '#f0e9f5',
  },
  rowIcon: {
    marginRight: spacing.md,
  },
  rowLabel: {
    fontSize: font.size.xs,
    color: colors.text + '88',
    fontWeight: font.weight.medium,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
  },
  rowValue: {
    fontSize: font.size.md,
    color: colors.text,
    fontWeight: font.weight.regular,
    marginTop: 2,
  },
  signOutButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.sm,
    backgroundColor: colors.primary,
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
