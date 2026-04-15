import React from 'react';
import {
  View,
  Text,
  StyleSheet,
} from 'react-native';
import { useTheme } from '@/context/ThemeContext';
import { getColors, spacing, radius, font } from '@/styles/theme';

interface DescriptionCardProps {
  description: string | null;
  category?: string | null;
  priority?: string | null;
}

export function DescriptionCard({
  description,
  category,
  priority,
}: DescriptionCardProps) {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const styles = createStyles(themeColors);

  if (!description && !category && !priority) {
    return null;
  }

  return (
    <View style={styles.card}>
      {/* Tags */}
      {(category || priority) && (
        <View style={styles.tagsRow}>
          {category && (
            <View style={styles.tag}>
              <Text style={styles.tagText}>{category}</Text>
            </View>
          )}
          {priority && (
            <View
              style={[
                styles.tag,
                {
                  backgroundColor:
                    priority === 'Critique' ? '#c0392b' + '22' :
                    priority === 'Urgent' ? '#e67e22' + '22' :
                    '#27ae60' + '22',
                },
              ]}
            >
              <Text
                style={[
                  styles.tagText,
                  {
                    color:
                      priority === 'Critique' ? '#c0392b' :
                      priority === 'Urgent' ? '#e67e22' :
                      '#27ae60',
                  },
                ]}
              >
                {priority}
              </Text>
            </View>
          )}
        </View>
      )}

      {/* Description */}
      {description && (
        <View style={styles.descriptionSection}>
          <Text style={styles.sectionLabel}>Description</Text>
          <Text style={styles.descriptionText}>{description}</Text>
        </View>
      )}
    </View>
  );
}

function createStyles(themeColors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    card: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: radius.lg,
      padding: spacing.lg,
      gap: spacing.md,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    tagsRow: {
      flexDirection: 'row',
      gap: spacing.sm,
      flexWrap: 'wrap',
    },
    tag: {
      backgroundColor: '#8e44ad' + '15',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.xs,
      borderRadius: radius.full,
    },
    tagText: {
      fontSize: font.size.xs,
      fontWeight: font.weight.medium,
      color: '#8e44ad',
    },
    descriptionSection: {
      gap: spacing.sm,
    },
    sectionLabel: {
      fontSize: font.size.xs,
      fontWeight: font.weight.bold,
      textTransform: 'uppercase',
      letterSpacing: 0.5,
      color: themeColors.text + '88',
    },
    descriptionText: {
      fontSize: font.size.md,
      color: themeColors.text,
      lineHeight: 22,
    },
  });
}
