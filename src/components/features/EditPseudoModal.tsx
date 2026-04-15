import { useState, useEffect } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { colors, spacing, radius, font } from '@/styles/theme';

interface EditPseudoModalProps {
  visible: boolean;
  currentPseudo: string;
  onClose: () => void;
  onConfirm: (newPseudo: string) => Promise<void>;
}

export function EditPseudoModal({
  visible,
  currentPseudo,
  onClose,
  onConfirm,
}: EditPseudoModalProps) {
  const [pseudo, setPseudo] = useState(currentPseudo);
  const [isLoading, setIsLoading] = useState(false);

  // Reset form when modal opens
  useEffect(() => {
    if (visible) {
      setPseudo(currentPseudo);
    }
  }, [visible, currentPseudo]);

  const handleConfirm = async () => {
    const trimmedPseudo = pseudo.trim();

    if (!trimmedPseudo) {
      Alert.alert('Erreur', 'Le pseudo ne peut pas être vide');
      return;
    }

    if (trimmedPseudo === currentPseudo.trim()) {
      onClose();
      return;
    }

    try {
      setIsLoading(true);
      await onConfirm(trimmedPseudo);
      onClose();
    } catch (error) {
      Alert.alert(
        'Erreur',
        error instanceof Error ? error.message : 'Impossible de modifier le pseudo',
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <Modal visible={visible} transparent animationType="fade">
      <View style={styles.backdrop}>
        <KeyboardAvoidingView
          behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
          style={styles.keyboardView}
        >
          <View style={styles.centeredView}>
            <View style={styles.modalView}>
              {/* Header */}
              <Text style={styles.modalTitle}>Modifier votre pseudo</Text>

              {/* Input */}
              <TextInput
                style={styles.input}
                placeholder="Entrez votre nouveau pseudo"
                placeholderTextColor={colors.text + '66'}
                value={pseudo}
                onChangeText={setPseudo}
                maxLength={50}
                editable={!isLoading}
                autoFocus
              />
              <Text style={styles.charCount}>{pseudo.length}/50</Text>

              {/* Actions */}
              <View style={styles.actionContainer}>
                <TouchableOpacity
                  style={[styles.button, styles.cancelButton]}
                  onPress={onClose}
                  disabled={isLoading}
                >
                  <Text style={styles.cancelText}>Annuler</Text>
                </TouchableOpacity>

                <TouchableOpacity
                  style={[styles.button, styles.confirmButton]}
                  onPress={handleConfirm}
                  disabled={isLoading || !pseudo.trim()}
                >
                  {isLoading ? (
                    <ActivityIndicator size="small" color="#fff" />
                  ) : (
                    <Text style={styles.confirmText}>Confirmer</Text>
                  )}
                </TouchableOpacity>
              </View>
            </View>
          </View>
        </KeyboardAvoidingView>
      </View>
    </Modal>
  );
}

const styles = StyleSheet.create({
  backdrop: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.4)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  keyboardView: {
    flex: 1,
    justifyContent: 'center',
  },
  centeredView: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
  },
  modalView: {
    width: '100%',
    maxWidth: 320,
    backgroundColor: '#fff',
    borderRadius: radius.lg,
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.lg,
    paddingBottom: spacing.md,
    shadowColor: '#000',
    shadowOpacity: 0.15,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 4 },
    elevation: 8,
  },
  modalTitle: {
    fontSize: font.size.lg,
    fontWeight: font.weight.bold,
    color: colors.text,
    marginBottom: spacing.md,
    textAlign: 'center',
  },
  input: {
    borderWidth: 1,
    borderColor: '#d0d0d0',
    borderRadius: radius.md,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    fontSize: font.size.md,
    color: colors.text,
    marginBottom: spacing.xs,
  },
  charCount: {
    fontSize: font.size.xs,
    color: colors.text + '88',
    textAlign: 'right',
    marginBottom: spacing.md,
  },
  actionContainer: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginTop: spacing.md,
  },
  button: {
    flex: 1,
    paddingVertical: spacing.md,
    borderRadius: radius.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#f0f0f0',
  },
  cancelText: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: colors.secondary,
  },
  confirmButton: {
    backgroundColor: colors.primary,
  },
  confirmText: {
    fontSize: font.size.md,
    fontWeight: font.weight.bold,
    color: '#fff',
  },
});
