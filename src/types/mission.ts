export type PriorityLevel = 'Critique' | 'Urgent' | 'Normal';
export type MissionState = 'À faire' | 'En cours' | 'Terminé';

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  deadline: string | null;
  priority: PriorityLevel | string | null;
  state: MissionState | null;
  author: string | null;
  in_charge: string | null;
  created_at: string;
  updated_at: string;
}

// ─── Commentaires ─────────────────────────────────────────────────────────────

export interface Comment {
  id: string;
  author: string; // UUID utilisateur
  author_name?: string; // Full name enrichi (like missions)
  comment: string; // Contenu du commentaire
  course_id: string; // UUID mission
  created_at: string; // ISO format Supabase
}

export type CommentInput = Pick<Comment, 'comment'>;

export interface CommentsPaginationResponse {
  comments: Comment[];
  total: number;
  hasMore: boolean;
}
