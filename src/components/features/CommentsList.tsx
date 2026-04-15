import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { MaterialIcons } from '@expo/vector-icons';
import type { Comment } from '@/types/mission';
import { useTheme } from '@/context/ThemeContext';
import { getColors, spacing, radius, font } from '@/styles/theme';

/** Utilitaire: génère initiales + couleur de fond basée sur l'utilisateur */
function getUserBadge(
  authorName: string,
  authorId: string
): { initials: string; backgroundColor: string } {
  const initials = authorName
    .split(' ')
    .map((n) => n[0])
    .join('')
    .toUpperCase()
    .slice(0, 2);

  const colors = ['#d4a5e8', '#b896d6', '#3498db', '#27ae60', '#e67e22'];
  const hash = authorId
    .split('')
    .reduce((acc, ch) => acc + ch.charCodeAt(0), 0);
  const backgroundColor = colors[hash % colors.length];

  return { initials, backgroundColor };
}

function formatDate(isoString: string): string {
  try {
    const date = new Date(isoString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'À l\'instant';
    if (diffMins < 60) return `${diffMins}m`;
    if (diffHours < 24) return `${diffHours}h`;
    if (diffDays < 7) return `${diffDays}j`;

    return date.toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
    });
  } catch {
    return 'Date inconn.';
  }
}

interface CommentsListProps {
  comments: Comment[];
  isLoading: boolean;
  hasMore: boolean;
  onLoadMore: () => Promise<void>;
  currentUserId: string;
  onCommentDeleted?: (commentId: string) => Promise<void>;
}

function CommentItem({
  comment,
  isAuthor,
  onDelete,
  colors,
}: {
  comment: Comment;
  isAuthor: boolean;
  onDelete: () => Promise<void>;
  colors: ReturnType<typeof getColors>;
}) {
  const styles = createCommentItemStyles(colors);
  const [isDeleting, setIsDeleting] = React.useState(false);
  const { initials, backgroundColor } = getUserBadge(
    comment.author_name || 'User',
    comment.author
  );

  const handleDelete = () => {
    Alert.alert(
      'Supprimer le commentaire',
      'Cette action est irréversible.',
      [
        { text: 'Annuler', onPress: () => {} },
        {
          text: 'Supprimer',
          onPress: async () => {
            setIsDeleting(true);
            try {
              await onDelete();
            } catch (err) {
              Alert.alert('Erreur', 'Impossible de supprimer le commentaire');
              console.error('Erreur suppression:', err);
            } finally {
              setIsDeleting(false);
            }
          },
          style: 'destructive',
        },
      ]
    );
  };

  return (
    <View style={styles.container}>
      {/* Header avec avatar + infos */}
      <View style={styles.header}>
        <View style={[styles.avatar, { backgroundColor }]}>
          <Text style={styles.avatarText}>{initials}</Text>
        </View>

        <View style={styles.headerInfo}>
          <View style={styles.authorRow}>
            <Text style={styles.author}>
              {comment.author_name || 'Utilisateur'}
            </Text>
            {isAuthor && (
              <View style={styles.youBadge}>
                <Text style={styles.youBadgeText}>Vous</Text>
              </View>
            )}
          </View>
          <Text style={styles.date}>{formatDate(comment.created_at)}</Text>
        </View>

        {isAuthor && (
          <TouchableOpacity
            style={styles.deleteBtn}
            onPress={handleDelete}
            disabled={isDeleting}
            hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
          >
            {isDeleting ? (
              <ActivityIndicator size="small" color="#c0392b" />
            ) : (
              <MaterialIcons name="delete-outline" size={16} color="#c0392b" />
            )}
          </TouchableOpacity>
        )}
      </View>

      {/* Texte du commentaire */}
      <Text style={styles.text}>{comment.comment}</Text>
    </View>
  );
}

export function CommentsList({
  comments,
  isLoading,
  hasMore,
  onLoadMore,
  currentUserId,
  onCommentDeleted,
}: CommentsListProps) {
  const { isDark } = useTheme();
  const colors = getColors(isDark);
  const styles = createStyles(colors);

  const handleLoadMore = React.useCallback(() => {
    if (!isLoading && hasMore) {
      onLoadMore();
    }
  }, [isLoading, hasMore, onLoadMore]);

  const renderItem = ({ item }: { item: Comment }) => {
    const isAuthor = item.author === currentUserId;
    return (
      <CommentItem
        comment={item}
        isAuthor={isAuthor}
        onDelete={async () => {
          await onCommentDeleted?.(item.id);
        }}
        colors={colors}
      />
    );
  };

  const renderFooter = () => {
    if (!isLoading) return null;
    return (
      <View style={styles.loadingFooter}>
        <ActivityIndicator size="small" color={colors.primary} />
        <Text style={styles.loadingText}>Chargement…</Text>
      </View>
    );
  };

  const renderEmpty = () => (
    <View style={styles.emptyContainer}>
      <MaterialIcons name="chat-bubble-outline" size={40} color={colors.textSecondary} />
      <Text style={styles.emptyText}>Aucun commentaire pour le moment</Text>
      <Text style={styles.emptySubtext}>Soyez le premier à commenter !</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <FlatList
        data={comments}
        renderItem={renderItem}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        ListEmptyComponent={renderEmpty}
        ListFooterComponent={renderFooter}
        onEndReached={handleLoadMore}
        onEndReachedThreshold={0.3}
        contentContainerStyle={[
          styles.contentContainer,
          comments.length === 0 && styles.emptyContent,
        ]}
      />
    </View>
  );
}

const createStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      flex: 0,
      backgroundColor: colors.background,
    },
    contentContainer: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.md,
      gap: spacing.md,
    },
    emptyContent: {
      minHeight: 200,
      justifyContent: 'center',
      alignItems: 'center',
    },
    emptyContainer: {
      justifyContent: 'center',
      alignItems: 'center',
      paddingVertical: spacing.xl,
    },
    emptyText: {
      marginTop: spacing.md,
      fontSize: font.size.md,
      fontFamily: font.family.semibold,
      color: colors.text,
      textAlign: 'center',
    },
    emptySubtext: {
      marginTop: spacing.xs,
      fontSize: font.size.sm,
      fontFamily: font.family.regular,
      color: colors.textSecondary,
      textAlign: 'center',
    },
    loadingFooter: {
      paddingVertical: spacing.md,
      justifyContent: 'center',
      alignItems: 'center',
      flexDirection: 'row',
      gap: spacing.sm,
    },
    loadingText: {
      fontSize: font.size.sm,
      color: colors.textSecondary,
      fontFamily: font.family.regular,
    },
  });

const createCommentItemStyles = (colors: ReturnType<typeof getColors>) =>
  StyleSheet.create({
    container: {
      backgroundColor: colors.cardBackground,
      borderRadius: radius.md,
      padding: spacing.md,
      borderWidth: 1,
      borderColor: colors.border,
      gap: spacing.sm,
      shadowColor: '#000',
      shadowOpacity: 0.04,
      shadowRadius: 2,
      shadowOffset: { width: 0, height: 1 },
      elevation: 1,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'flex-start',
      gap: spacing.sm,
    },
    avatar: {
      width: 36,
      height: 36,
      borderRadius: radius.full,
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.xs,
    },
    avatarText: {
      fontSize: font.size.xs,
      fontWeight: font.weight.bold,
      color: '#fff',
    },
    headerInfo: {
      flex: 1,
      gap: spacing.xs,
    },
    authorRow: {
      flexDirection: 'row',
      alignItems: 'center',
      gap: spacing.sm,
    },
    author: {
      fontSize: font.size.sm,
      fontWeight: font.weight.semibold,
      color: colors.text,
    },
    youBadge: {
      backgroundColor: colors.primary + '22',
      paddingHorizontal: spacing.sm,
      paddingVertical: 2,
      borderRadius: radius.sm,
    },
    youBadgeText: {
      fontSize: 10,
      fontWeight: font.weight.bold,
      color: colors.primary,
    },
    date: {
      fontSize: font.size.xs,
      color: colors.textSecondary,
    },
    deleteBtn: {
      padding: spacing.xs,
    },
    text: {
      fontSize: font.size.sm,
      color: colors.text,
      lineHeight: 20,
      marginLeft: 36 + spacing.sm,
    },
  });
