export interface MissionProfile {
  id: string;
  email: string;
  full_name: string | null;
}

export type MissionStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  status: MissionStatus;
  author_id: string;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  // Relations jointes
  author: MissionProfile | null;
  assignee: MissionProfile | null;
}
