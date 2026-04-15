import { useState, useCallback, useEffect } from 'react';
import { getCommentsPaginated, deleteComment } from '@/services/commentService';
import type { Comment } from '@/types/mission';

interface UseCommentsOptions {
  courseId: string;
  enabled?: boolean;
}

interface UseCommentsState {
  comments: Comment[];
  isLoading: boolean;
  isInitialLoading: boolean;
  error: string | null;
  hasMore: boolean;
  currentPage: number;
  total: number;
}

export function useComments({ courseId, enabled = true }: UseCommentsOptions): UseCommentsState & {
  loadMore: () => Promise<void>;
  refresh: () => Promise<void>;
  addCommentOptimistic: (comment: Comment) => void;
  deleteCommentOptimistic: (commentId: string) => Promise<void>;
} {
  const [comments, setComments] = useState<Comment[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialLoading, setIsInitialLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [hasMore, setHasMore] = useState(true);
  const [currentPage, setCurrentPage] = useState(1);
  const [total, setTotal] = useState(0);

  const loadPageComments = useCallback(
    async (page: number) => {
      try {
        setError(null);
        setIsLoading(true);

        const response = await getCommentsPaginated(courseId, page);

        setComments((prev) => 
          page === 1 ? response.comments : [...prev, ...response.comments]
        );
        setHasMore(response.hasMore);
        setTotal(response.total);
        setCurrentPage(page);
      } catch (err) {
        const message = err instanceof Error ? err.message : 'Erreur lors du chargement';
        setError(message);
        console.error('Erreur chargement commentaires:', err);
      } finally {
        setIsLoading(false);
        setIsInitialLoading(false);
      }
    },
    [courseId]
  );

  // Charge la première page au montage
  useEffect(() => {
    if (!enabled || !courseId) {
      setIsInitialLoading(false);
      return;
    }
    loadPageComments(1);
  }, [courseId, enabled, loadPageComments]);

  const loadMore = useCallback(async () => {
    if (!hasMore || isLoading) return;
    await loadPageComments(currentPage + 1);
  }, [currentPage, hasMore, isLoading, loadPageComments]);

  const refresh = useCallback(async () => {
    await loadPageComments(1);
  }, [loadPageComments]);

  const addCommentOptimistic = useCallback((comment: Comment) => {
    setComments((prev) => [comment, ...prev]);
    setTotal((prev) => prev + 1);
  }, []);

  const deleteCommentOptimistic = useCallback(async (commentId: string) => {
    // Suppression optimiste locale
    setComments((prev) => prev.filter((c) => c.id !== commentId));
    setTotal((prev) => Math.max(prev - 1, 0));
  }, []);

  return {
    comments,
    isLoading,
    isInitialLoading,
    error,
    hasMore,
    currentPage,
    total,
    loadMore,
    refresh,
    addCommentOptimistic,
    deleteCommentOptimistic,
  };
}
