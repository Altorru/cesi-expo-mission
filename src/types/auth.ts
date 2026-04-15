import type { User, Session } from '@supabase/supabase-js';

export type { User, Session };

export interface AuthContextType {
  user: User | null;
  session: Session | null;
  isLoading: boolean;
  signIn: (email: string, password: string) => Promise<void>;
  signUp: (email: string, password: string, pseudo?: string) => Promise<void>;
  signOut: () => Promise<void>;
  updatePseudo: (newPseudo: string) => Promise<void>;
}
