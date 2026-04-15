import { supabase } from '@/lib/supabase';
import { fetchUserPseudos } from '@/services/userService';
import type { Comment, CommentInput, CommentsPaginationResponse } from '@/types/mission';

const COMMENTS_PER_PAGE = 5;

/**
 * Récupère les commentaires paginés d'une mission
 * @param courseId - ID de la mission
 * @param page - Numéro de page (commence à 1)
 * @returns Liste paginée des commentaires avec full_name des auteurs enrichis
 */
export async function getCommentsPaginated(
  courseId: string,
  page: number = 1,
): Promise<CommentsPaginationResponse> {
  const from = (page - 1) * COMMENTS_PER_PAGE;
  const to = from + COMMENTS_PER_PAGE - 1;

  // Récupérer le nombre total
  const { count: total } = await supabase
    .from('comments')
    .select('*', { count: 'exact', head: true })
    .eq('course_id', courseId);

  // Récupérer les commentaires triés par date (plus récents en premier)
  const { data, error } = await supabase
    .from('comments')
    .select('*')
    .eq('course_id', courseId)
    .order('created_at', { ascending: false })
    .range(from, to);

  if (error) throw new Error(`Erreur récupération commentaires: ${error.message}`);

  // Enrichir avec les full_name des auteurs (même système que pour missions)
  const comments = (data || []) as Comment[];
  const authorIds = comments.map((c) => c.author);
  const pseudoMap = await fetchUserPseudos(authorIds);

  const enriched = comments.map((c) => ({
    ...c,
    author_name: pseudoMap[c.author] || '',
  }));

  return {
    comments: enriched,
    total: total ?? 0,
    hasMore: from + COMMENTS_PER_PAGE < (total ?? 0),
  };
}

/**
 * Ajoute un commentaire à une mission
 * @param courseId - ID de la mission
 * @param authorId - ID de l'auteur
 * @param input - Contenu du commentaire
 * @returns Le commentaire créé
 */
export async function createComment(
  courseId: string,
  authorId: string,
  input: CommentInput,
): Promise<Comment> {
  const { data, error } = await supabase
    .from('comments')
    .insert({
      course_id: courseId,
      author: authorId,
      comment: input.comment,
      created_at: new Date().toISOString(),
    })
    .select()
    .single();

  if (error) throw new Error(`Erreur création commentaire: ${error.message}`);
  return data as Comment;
}

/**
 * Supprime un commentaire (vérifie que c'est l'auteur)
 * @param commentId - ID du commentaire
 * @param authorId - ID de l'utilisateur (vérification)
 */
export async function deleteComment(commentId: string, authorId: string): Promise<void> {
  const { error } = await supabase
    .from('comments')
    .delete()
    .eq('id', commentId)
    .eq('author', authorId);

  if (error) throw new Error(`Erreur suppression commentaire: ${error.message}`);
}
