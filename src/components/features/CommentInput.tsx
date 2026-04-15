import React, { useState } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  StyleSheet,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import { createComment } from '@/services/commentService';
import { useTheme } from '@/context/ThemeContext';
import { getColors, spacing, radius, font } from '@/styles/theme';
import type { Comment } from '@/types/mission';

interface CommentInputProps {
  courseId: string;
  userId: string;
  onCommentAdded: (comment: Comment) => void;
  onError?: (error: string) => void;
  disabled?: boolean;
}

export function CommentInput({
  courseId,
  userId,
  onCommentAdded,
  onError,
  disabled = false,
}: CommentInputProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  const [text, setText] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async () => {
    // Validation
    if (!text.trim()) {
      onError?.('Le commentaire ne peut pas être vide');
      return;
    }

    if (text.length > 500) {
      onError?.('Le commentaire ne doit pas dépasser 500 caractères');
      return;
    }

    setIsSubmitting(true);
    try {
      const comment = await createComment(courseId, userId, { comment: text });
      
      // Callback avec le commentaire créé enrichi avec author_name par défaut
      onCommentAdded({
        ...comment,
        author_name: 'Vous',
      });
      
      setText('');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Erreur lors de l\'ajout';
      onError?.(message);
      console.error('Erreur ajout commentaire:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  const charCount = text.length;
  const isOverLimit = charCount > 500;

  return (
    <KeyboardAvoidingView
      behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      style={{ flex: 0 }}
    >
      <View style={styles.container}>
        {/* Barre de saisie */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.input}
            placeholder="Ajouter un commentaire…"
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            numberOfLines={3}
            editable={!disabled && !isSubmitting}
            value={text}
            onChangeText={setText}
          />

          {/* Bouton d'envoi */}
          <TouchableOpacity
            style={[
              styles.submitBtn,
              {
                opacity:
                  isSubmitting || !text.trim() || isOverLimit || disabled ? 0.5 : 1,
              },
            ]}
            onPress={handleSubmit}
            disabled={isSubmitting || !text.trim() || isOverLimit || disabled}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isSubmitting ? (
              <ActivityIndicator size="small" color={colors.primary} />
            ) : (
              <MaterialIcons
                name="send"
                size={20}
                color={colors.primary}
              />
            )}
          </TouchableOpacity>
        </View>

        {/* Indicateur de caractères */}
        <View style={styles.footerRow}>
          <Text
            style={[
              styles.charCount,
              {
                color: isOverLimit ? '#c0392b' : colors.textSecondary,
              },
            ]}
          >
            {charCount}/500
          </Text>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      backgroundColor: colors.cardBackground,
      borderTopWidth: 1,
      borderTopColor: colors.border,
    },
    inputContainer: {
      flexDirection: 'row',
      alignItems: 'flex-end',
      gap: spacing.sm,
    },
    input: {
      flex: 1,
      backgroundColor: colors.inputBackground,
      borderRadius: radius.md,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      color: colors.text,
      fontFamily: font.family.regular,
      fontSize: font.size.sm,
      maxHeight: 100,
      minHeight: 40,
      borderWidth: 1,
      borderColor: colors.border,
    },
    submitBtn: {
      padding: spacing.sm,
      justifyContent: 'center',
      alignItems: 'center',
    },
    footerRow: {
      marginTop: spacing.xs,
      alignItems: 'flex-end',
    },
    charCount: {
      fontSize: font.size.xs,
      fontFamily: font.family.regular,
    },
  });
