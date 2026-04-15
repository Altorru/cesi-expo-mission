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
