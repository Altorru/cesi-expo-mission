import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getColors, spacing, radius, font } from '@/styles/theme';

interface MetadataCardProps {
  author?: string;
  assignedTo?: string;
  isAssignedToMe?: boolean;
  isAssignedToOther?: boolean;
  deadline?: string;
  createdAt: string;
}

interface MetaRowProps {
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  label: string;
  value: string;
  valueColor?: string;
  themeColors: ReturnType<typeof getColors>;
}

function MetaRow({ icon, label, value, valueColor, themeColors }: MetaRowProps) {
  const styles = createMetaRowStyles(themeColors);

  return (
    <View style={styles.row}>
      <MaterialIcons
        name={icon}
        size={16}
        color={themeColors.secondary}
        style={{ marginRight: spacing.sm }}
      />
      <Text style={styles.label}>{label}</Text>
      <Text style={[styles.value, valueColor && { color: valueColor }]}>{value}</Text>
    </View>
  );
}

export function MetadataCard({
  author,
  assignedTo,
  isAssignedToMe,
  isAssignedToOther,
  deadline,
  createdAt,
}: MetadataCardProps) {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const styles = createStyles(themeColors);

  return (
    <View style={styles.card}>
      {author && (
        <MetaRow
          icon="person-outline"
          label="Auteur"
          value={author}
          themeColors={themeColors}
        />
      )}

      <MetaRow
        icon="assignment-ind"
        label="Assignée à"
        value={
          isAssignedToMe ? 'Vous' :
          assignedTo ? assignedTo :
          'Non assignée'
        }
        valueColor={
          isAssignedToMe ? '#27ae60' :
          isAssignedToOther ? '#e67e22' :
          undefined
        }
        themeColors={themeColors}
      />

      {deadline && (
        <MetaRow
          icon="event"
          label="Deadline"
          value={new Date(deadline).toLocaleDateString('fr-FR')}
          themeColors={themeColors}
        />
      )}

      <MetaRow
        icon="schedule"
        label="Créée le"
        value={new Date(createdAt).toLocaleDateString('fr-FR')}
        themeColors={themeColors}
      />
    </View>
  );
}

function createStyles(themeColors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: radius.lg,
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      gap: spacing.sm,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
  });
}

function createMetaRowStyles(themeColors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    row: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      borderBottomWidth: 1,
      borderBottomColor: themeColors.border,
    },
    label: {
      flex: 1,
      fontSize: font.size.sm,
      color: themeColors.text + '88',
    },
    value: {
      fontSize: font.size.sm,
      fontWeight: font.weight.medium,
      color: themeColors.text,
      textAlign: 'right',
    },
  });
}
