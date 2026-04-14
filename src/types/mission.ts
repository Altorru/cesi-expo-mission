export type PriorityLevel = 'Critique' | 'Urgent' | 'Normal';

export interface Mission {
  id: string;
  title: string;
  description: string | null;
  category: string | null;
  deadline: string | null;
  priority: PriorityLevel | string | null;
  author: string | null;
  in_charge: string | null;
  created_at: string;
  updated_at: string;
}
