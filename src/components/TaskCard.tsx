import { Calendar, Edit2, Trash2, User, Check } from 'lucide-react';
import { Task } from '../types';
import { useAuth } from '../contexts/AuthContext';

interface TaskCardProps {
  task: Task;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onToggleComplete: (id: string, completed: boolean) => void;
  onStatusChange: (id: string, status: 'todo' | 'in-progress' | 'done') => void;
  userEmail?: string;
  isSelected?: boolean;
  onSelect?: (id: string) => void;
}

export function TaskCard({ task, onEdit, onDelete, onToggleComplete, onStatusChange, userEmail, isSelected, onSelect }: TaskCardProps) {
  const { user } = useAuth();
  const isOwner = user?.id === task.user_id;

  const priorityColors = {
    low: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
    medium: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
    high: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
  };

  const statusColors = {
    todo: 'bg-slate-100 text-slate-800 dark:bg-slate-900/30 dark:text-slate-400',
    'in-progress': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
    done: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400',
  };

  const statusLabels = {
    todo: 'To Do',
    'in-progress': 'In Progress',
    done: 'Done',
  };

  const formatDate = (dateString: string | null) => {
    if (!dateString) return null;
    const date = new Date(dateString);
    const today = new Date();
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    if (date.toDateString() === today.toDateString()) return 'Today';
    if (date.toDateString() === tomorrow.toDateString()) return 'Tomorrow';
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  };

  const isOverdue = task.due_date && new Date(task.due_date) < new Date() && !task.completed;

  return (
    <div className={`bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 hover:shadow-md transition-all duration-200 ${isSelected ? 'ring-2 ring-blue-500' : ''}`}>
      <div className="flex items-start gap-3">
        {/* Selection checkbox */}
        {onSelect && (
          <input
            type="checkbox"
            checked={isSelected || false}
            onChange={() => onSelect(task.id)}
            className="mt-1 w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
          />
        )}
        
        <div className="flex-1 min-w-0">
          <h3 className={`font-medium text-gray-900 dark:text-white mb-1 ${task.completed ? 'line-through opacity-60' : ''}`}>
            {task.title}
          </h3>

          {task.description && (
            <p className="text-sm text-gray-600 dark:text-gray-400 mb-2 line-clamp-2">
              {task.description}
            </p>
          )}

          <div className="flex flex-wrap gap-2 items-center">
            <span className="text-xs px-2 py-1 rounded-full bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              {task.category}
            </span>

            <span className={`text-xs px-2 py-1 rounded-full ${priorityColors[task.priority]}`}>
              {task.priority}
            </span>

            {isOwner ? (
              <button
                onClick={() => {
                  const statuses: ('todo' | 'in-progress' | 'done')[] = ['todo', 'in-progress', 'done'];
                  const currentIndex = statuses.indexOf(task.status);
                  const nextStatus = statuses[(currentIndex + 1) % statuses.length];
                  onStatusChange(task.id, nextStatus);
                }}
                className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]} hover:opacity-80 transition-opacity cursor-pointer`}
                title="Click to change status"
              >
                {statusLabels[task.status]}
              </button>
            ) : (
              <span className={`text-xs px-2 py-1 rounded-full ${statusColors[task.status]}`}>
                {statusLabels[task.status]}
              </span>
            )}

            {task.due_date && (
              <span className={`text-xs px-2 py-1 rounded-full flex items-center gap-1 ${
                isOverdue
                  ? 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                  : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
              }`}>
                <Calendar className="w-3 h-3" />
                {formatDate(task.due_date)}
              </span>
            )}

            {userEmail && (
              <span className="text-xs px-2 py-1 rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400 flex items-center gap-1">
                <User className="w-3 h-3" />
                {userEmail}
              </span>
            )}
          </div>
        </div>

        {isOwner && (
          <div className="flex gap-1">
            <button
              onClick={() => onEdit(task)}
              className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title="Edit task"
            >
              <Edit2 className="w-4 h-4 text-gray-600 dark:text-gray-400" />
            </button>
            {!task.completed && (
              <button
                onClick={() => onToggleComplete(task.id, true)}
                className="p-2 hover:bg-green-50 dark:hover:bg-green-900/20 rounded-lg transition-colors"
                title="Mark as completed"
              >
                <Check className="w-4 h-4 text-green-600 dark:text-green-400" />
              </button>
            )}
            <button
              onClick={() => onDelete(task.id)}
              className="p-2 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
              title="Delete task"
            >
              <Trash2 className="w-4 h-4 text-red-600 dark:text-red-400" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}