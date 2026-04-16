import { createContext, useContext, useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { supabase } from '@/lib/supabase';
import { usePushNotifications } from '@/hooks/usePushNotifications';
import { useNotificationListener } from '@/hooks/useNotificationListener';
import { registerForPushNotificationsAsync } from '@/lib/notifications';
import { savePushToken } from '@/services/pushTokenService';
import type { AuthContextType, User, Session } from '@/types/auth';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // ─── Fonction privée : Enregistrer le token push après authentification ────────
  // Appelée directement après signIn/signUp pour éviter les race conditions
  const _registerPushTokenAfterAuth = async (userId: string): Promise<void> => {
    try {
      console.log('[AuthContext] 🔄 Enregistrement du token push après authentification pour:', userId);
      
      // 1. Demander les permissions et récupérer le token
      const token = await registerForPushNotificationsAsync();
      if (!token) {
        console.log('[AuthContext] ⚠️ Aucun token obtenu (simulateur ou permission refusée).');
        return;
      }

      console.log('[AuthContext] ✅ Token Expo obtenu:', token.substring(0, 30) + '...');

      // 2. Sauvegarder le token dans Supabase
      await savePushToken(userId, token);
      console.log('[AuthContext] ✅ Token push enregistré dans Supabase.');
    } catch (err) {
      console.warn('[AuthContext] ⚠️ Impossible d\'enregistrer le token push:', err);
      // On ne lance pas l'erreur car l'auth réussit même sans le token
    }
  };

  // ─────────────────────────────────────────────────────────────────────────────

  useEffect(() => {
    supabase.auth.getSession().then(({ data: { session } }) => {
      setSession(session);
      setUser(session?.user ?? null);
      setIsLoading(false);
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        setSession(session);
        setUser(session?.user ?? null);
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signIn = async (email: string, password: string) => {
    console.log('[AuthContext] 🔐 Connexion avec:', email);
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      console.error('[AuthContext] ❌ Erreur signIn:', error.message);
      throw error;
    }

    // Enregistrer le token push immédiatement après la connexion réussie
    const userId = data.user?.id;
    if (userId) {
      console.log('[AuthContext] ✅ Connexion réussie pour:', userId);
      // Ne pas await : laisser s'exécuter en arrière-plan
      _registerPushTokenAfterAuth(userId).catch((err) => 
        console.warn('[AuthContext] ⚠️ Erreur token après signIn:', err)
      );
    }
  };

  const signUp = async (email: string, password: string, pseudo?: string) => {
    console.log('[AuthContext] 📝 Inscription avec:', email, '- pseudo:', pseudo);
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: pseudo ? { data: { full_name: pseudo } } : undefined,
    });
    if (error) {
      console.error('[AuthContext] ❌ Erreur signUp:', error.message);
      throw error;
    }

    // Enregistrer le token push immédiatement après l'inscription réussie
    // Note: En dev/auto-confirm, l'utilisateur est connecté. En prod, il peut ne pas être connecté.
    const userId = data.user?.id;
    if (userId) {
      console.log('[AuthContext] ✅ Inscription réussie pour:', userId);
      // Ne pas await : laisser s'exécuter en arrière-plan
      _registerPushTokenAfterAuth(userId).catch((err) => 
        console.warn('[AuthContext] ⚠️ Erreur token après signUp:', err)
      );
    }
  };

  const signOut = async () => {
    try {
      // Supprimer le token push avant la déconnexion
      if (user?.id) {
        console.log('[AuthContext] 🧹 Suppression du token push pour l\'utilisateur:', user.id);
        const { deletePushToken } = await import('@/services/pushTokenService');
        try {
          await deletePushToken(user.id);
          console.log('[AuthContext] ✅ Token push supprimé avec succès.');
        } catch (tokenError) {
          console.warn('[AuthContext] ⚠️ Impossible de supprimer le token push:', tokenError);
          // On continue la déconnexion même si la suppression du token échoue
        }
      }

      // Déconnexion
      const { error } = await supabase.auth.signOut();
      if (error) throw error;

      console.log('[AuthContext] ✅ Utilisateur déconnecté avec succès.');
    } catch (error) {
      console.error('[AuthContext] ❌ Erreur lors de la déconnexion :', error);
      throw error;
    }
  };

  const updatePseudo = async (newPseudo: string) => {
    if (!user) throw new Error('User not authenticated');
    
    const { error } = await supabase.auth.updateUser({
      data: { full_name: newPseudo.trim() },
    });
    
    if (error) throw error;
    
    // Mettre à jour l'état local immédiatement
    setUser((prev) => {
      if (!prev) return prev;
      return {
        ...prev,
        user_metadata: { ...prev.user_metadata, full_name: newPseudo.trim() },
      };
    });
  };

  return (
    <AuthContext.Provider value={{ user, session, isLoading, signIn, signUp, signOut, updatePseudo }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};