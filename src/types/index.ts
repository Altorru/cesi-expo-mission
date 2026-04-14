/**
 * Types - Définitions TypeScript globales
 * 
 * Ce fichier centralise les types partagés dans l'application.
 * Chaque domaine métier aura son propre fichier de types.
 */

/**
 * Type utilitaire pour rendre certaines propriétés optionnelles
 */
export type PartialBy<T, K extends keyof T> = Omit<T, K> & Partial<Pick<T, K>>;

/**
 * Type pour les réponses API génériques
 */
export interface ApiResponse<T> {
  data: T;
  success: boolean;
  message?: string;
}

/**
 * Type pour les erreurs API
 */
export interface ApiError {
  code: string;
  message: string;
  details?: Record<string, unknown>;
}
