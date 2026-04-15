import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getColors, spacing, radius, font } from '@/styles/theme';
import type { MissionState } from '@/types/mission';

interface ProgressionCardProps {
  currentState: MissionState | null;
  onStateChange: (newState: MissionState | null) => void;
  isUpdating: boolean;
}

const PROGRESSION_STEPS: Array<{
  key: MissionState | null;
  label: string;
  icon: React.ComponentProps<typeof MaterialIcons>['name'];
  color: string;
}> = [
  { key: null, label: 'À faire', icon: 'radio-button-unchecked', color: '#8e44ad' },
  { key: 'En cours', label: 'En cours', icon: 'schedule', color: '#3498db' },
  { key: 'Terminé', label: 'Terminé', icon: 'check-circle', color: '#27ae60' },
];

// Progression libre : pas de blocage séquentiel
// Tous les états sont cliquables directement

export function ProgressionCard({
  currentState,
  onStateChange,
  isUpdating,
}: ProgressionCardProps) {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const styles = createStyles(themeColors);

  return (
    <View style={styles.card}>
      <Text style={styles.label}>Progression</Text>

      <View style={styles.stepsContainer}>
        {PROGRESSION_STEPS.map((step, idx) => {
          const isCurrent = currentState === step.key;

          return (
            <View key={idx} style={styles.stepWrapper}>
              {/* Ligne de progression (sauf après la dernière étape) */}
              {idx < PROGRESSION_STEPS.length - 1 && (
                <View
                  style={[
                    styles.progressLine,
                    {
                      backgroundColor: isCurrent ? step.color : themeColors.border,
                    },
                  ]}
                />
              )}

              {/* Étape - Tous les états sont cliquables directement */}
              <TouchableOpacity
                style={[
                  styles.step,
                  isCurrent && [styles.stepActive, { backgroundColor: step.color }],
                ]}
                onPress={() => onStateChange(step.key)}
                disabled={isUpdating}
                activeOpacity={0.8}
              >
                {isUpdating && isCurrent ? (
                  <ActivityIndicator size={16} color="#fff" />
                ) : (
                  <MaterialIcons
                    name={step.icon}
                    size={18}
                    color={isCurrent ? '#fff' : step.color}
                  />
                )}
              </TouchableOpacity>

              {/* Label */}
              <Text
                style={[
                  styles.stepLabel,
                  {
                    color: isCurrent ? step.color : themeColors.text + '88',
                  },
                ]}
              >
                {step.label}
              </Text>
            </View>
          );
        })}
      </View>

      {/* Hint */}
      {currentState === 'Terminé' && (
        <Text style={styles.hint}>✓ Mission complétée</Text>
      )}
      {currentState !== 'Terminé' && (
        <Text style={styles.hint}>Tap pour changer l'état</Text>
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
      gap: spacing.lg,
      shadowColor: '#000',
      shadowOpacity: 0.05,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 2,
    },
    label: {
      fontSize: font.size.sm,
      fontWeight: font.weight.bold,
      textTransform: 'uppercase',
      letterSpacing: 0.8,
      color: themeColors.text + '88',
    },
    stepsContainer: {
      gap: spacing.md,
    },
    stepWrapper: {
      alignItems: 'center',
      gap: spacing.sm,
    },
    progressLine: {
      position: 'absolute',
      width: 2,
      height: spacing.md,
      left: '50%',
      marginLeft: -1,
      top: -spacing.md - spacing.xs,
    },
    step: {
      width: 44,
      height: 44,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      backgroundColor: themeColors.background,
      borderWidth: 2,
      borderColor: themeColors.border,
    },
    stepActive: {
      borderColor: 'transparent',
      shadowColor: '#000',
      shadowOpacity: 0.15,
      shadowRadius: 4,
      shadowOffset: { width: 0, height: 2 },
      elevation: 3,
    },
    stepLabel: {
      fontSize: font.size.sm,
      fontWeight: font.weight.medium,
    },
    hint: {
      fontSize: font.size.xs,
      textAlign: 'center',
      marginTop: spacing.xs,
      color: themeColors.text + '66',
      fontStyle: 'italic',
    },
  });
}
