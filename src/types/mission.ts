export type MissionStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  status: MissionStatus | string | null;
  author_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
}
