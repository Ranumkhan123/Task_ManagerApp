export interface Task {
  id: string;
  user_id: string;
  title: string;
  description: string;
  category: string;
  priority: 'low' | 'medium' | 'high';
  status: 'todo' | 'in-progress' | 'done';
  due_date: string | null;
  completed: boolean;
  created_at: string;
  updated_at: string;
}

export interface User {
  id: string;
  email: string;
}

export type SortOption = 'newest' | 'oldest' | 'due_date' | 'priority';

export type FilterOptions = {
  category: string;
  priority: string;
  status: string;
  dueDateRange: 'all' | 'overdue' | 'today' | 'week' | 'month';
};
