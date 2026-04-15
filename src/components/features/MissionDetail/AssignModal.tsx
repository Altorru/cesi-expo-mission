import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  Modal,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { useTheme } from '@/context/ThemeContext';
import { getColors, spacing, radius, font } from '@/styles/theme';

type AssignModalState = 'confirm' | 'loading' | 'success' | 'error';

interface AssignModalProps {
  visible: boolean;
  label: string;
  onConfirm: () => Promise<void>;
  onClose: () => void;
}

export function AssignModal({
  visible,
  label,
  onConfirm,
  onClose,
}: AssignModalProps) {
  const { isDark } = useTheme();
  const themeColors = getColors(isDark);
  const styles = createStyles(themeColors);

  const [state, setState] = React.useState<AssignModalState>('confirm');
  const [errorMsg, setErrorMsg] = React.useState('');

  React.useEffect(() => {
    if (visible) {
      setState('confirm');
      setErrorMsg('');
    }
  }, [visible]);

  const handleConfirm = async () => {
    setState('loading');
    try {
      await onConfirm();
      setState('success');
    } catch (e: unknown) {
      setErrorMsg(e instanceof Error ? e.message : 'Erreur inconnue');
      setState('error');
    }
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={onClose}
    >
      <View style={styles.overlay}>
        <View style={styles.dialog}>
          {state === 'confirm' && (
            <>
              <MaterialIcons
                name="assignment-ind"
                size={40}
                color={themeColors.primary}
              />
              <Text style={styles.title}>{label}</Text>
              <Text style={styles.subtitle}>Confirmer cette action ?</Text>
              <View style={styles.buttonRow}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                >
                  <Text style={styles.cancelButtonText}>Annuler</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                >
                  <Text style={styles.confirmButtonText}>Confirmer</Text>
                </TouchableOpacity>
              </View>
            </>
          )}

          {state === 'loading' && (
            <>
              <ActivityIndicator
                size="large"
                color={themeColors.primary}
              />
              <Text style={styles.subtitle}>En cours…</Text>
            </>
          )}

          {state === 'success' && (
            <>
              <MaterialIcons
                name="check-circle"
                size={44}
                color="#27ae60"
              />
              <Text style={styles.title}>Succès !</Text>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onClose}
              >
                <Text style={styles.confirmButtonText}>Fermer</Text>
              </TouchableOpacity>
            </>
          )}

          {state === 'error' && (
            <>
              <MaterialIcons
                name="error-outline"
                size={44}
                color="#c0392b"
              />
              <Text style={styles.title}>Erreur</Text>
              <Text style={styles.errorText}>{errorMsg}</Text>
              <TouchableOpacity
                style={[styles.button, styles.confirmButton]}
                onPress={onClose}
              >
                <Text style={styles.confirmButtonText}>Fermer</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

function createStyles(themeColors: ReturnType<typeof getColors>) {
  return StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: '#00000055',
      alignItems: 'center',
      justifyContent: 'center',
    },
    dialog: {
      backgroundColor: themeColors.cardBackground,
      borderRadius: radius.lg,
      padding: spacing.xl,
      width: '80%',
      alignItems: 'center',
      gap: spacing.md,
    },
    title: {
      fontSize: font.size.lg,
      fontWeight: font.weight.bold,
      color: themeColors.text,
      textAlign: 'center',
    },
    subtitle: {
      fontSize: font.size.sm,
      color: themeColors.text + '99',
      textAlign: 'center',
    },
    errorText: {
      fontSize: font.size.sm,
      color: '#c0392b',
      textAlign: 'center',
    },
    buttonRow: {
      flexDirection: 'row',
      gap: spacing.md,
      marginTop: spacing.sm,
      width: '100%',
    },
    button: {
      flex: 1,
      borderRadius: radius.md,
      paddingVertical: spacing.md,
      alignItems: 'center',
    },
    cancelButton: {
      backgroundColor: themeColors.background,
      borderWidth: 1,
      borderColor: themeColors.secondary,
    },
    cancelButtonText: {
      color: themeColors.secondary,
      fontWeight: font.weight.medium,
      fontSize: font.size.sm,
    },
    confirmButton: {
      backgroundColor: themeColors.primary,
    },
    confirmButtonText: {
      color: '#fff',
      fontWeight: font.weight.bold,
      fontSize: font.size.sm,
    },
  });
}
