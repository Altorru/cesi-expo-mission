import { useState, useEffect, useCallback, useRef } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';

/**
 * useFormPersistence
 *
 * Persiste automatiquement les valeurs d'un formulaire dans AsyncStorage.
 * Le brouillon est restauré au montage et effacé après soumission.
 *
 * @param key   - Clé unique AsyncStorage (ex: 'draft_create_mission')
 * @param initialValues - Valeurs par défaut si aucun brouillon n'existe
 *
 * @example
 * const { values, setField, clearDraft, isRestored } = useFormPersistence(
 *   'draft_create_mission',
 *   { title: '', description: '' }
 * );
 */
export function useFormPersistence<T extends Record<string, unknown>>(
  key: string,
  initialValues: T,
) {
  const [values, setValues] = useState<T>(initialValues);
  const [isRestored, setIsRestored] = useState(false);

  // Évite de sauvegarder pendant la restauration initiale
  const isRestoringRef = useRef(true);

  // 4a — Lire le brouillon au montage
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem(key);
        if (raw) {
          const parsed = JSON.parse(raw) as T;
          setValues(parsed);
        }
      } catch {
        // Brouillon corrompu : on ignore et on repart des valeurs initiales
      } finally {
        isRestoringRef.current = false;
        setIsRestored(true);
      }
    })();
  }, [key]);

  // 4b — Sauvegarder à chaque changement dans values
  useEffect(() => {
    if (isRestoringRef.current) return;

    AsyncStorage.setItem(key, JSON.stringify(values)).catch(() => {
      // Échec silencieux (stockage plein, etc.)
    });
  }, [key, values]);

  /**
   * Met à jour un champ du formulaire.
   * Déclenche automatiquement la sauvegarde du brouillon (4b).
   */
  const setField = useCallback(<K extends keyof T>(field: K, value: T[K]) => {
    setValues((prev) => ({ ...prev, [field]: value }));
  }, []);

  /**
   * Réinitialise le formulaire et efface le brouillon (4c).
   * À appeler après une soumission réussie.
   */
  const clearDraft = useCallback(async () => {
    setValues(initialValues);
    await AsyncStorage.removeItem(key);
  }, [key, initialValues]);

  return { values, setValues, setField, clearDraft, isRestored };
}
