import { useState, useEffect } from 'react';
import { X } from 'lucide-react';
import { Task } from '../types';

interface TaskFormProps {
  task?: Task | null;
  onSubmit: (data: Partial<Task>) => Promise<void>;
  onClose: () => void;
  categories?: string[];
  submitError?: string;
}

export function TaskForm({ task, onSubmit, onClose, categories = [], submitError: externalSubmitError }: TaskFormProps) {
  const defaultCategories = ['Work', 'Personal', 'Urgent'];
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('Work');
  const [priority, setPriority] = useState<'low' | 'medium' | 'high'>('medium');
  const [status, setStatus] = useState<'todo' | 'in-progress' | 'done'>('todo');
  const [dueDate, setDueDate] = useState('');
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [internalSubmitError, setInternalSubmitError] = useState(''); // Rename state variable

  useEffect(() => {
    if (task) {
      setTitle(task.title);
      setDescription(task.description);
      setCategory(task.category);
      setPriority(task.priority);
      setStatus(task.status);
      setDueDate(task.due_date || '');
    } else if (categories.length > 0) {
      setCategory(categories[0]);
    }
  }, [task, categories]);

  const validateForm = () => {
    const newErrors: Record<string, string> = {};

    // Title validation - must not be empty and must contain at least one letter or number
    if (!title.trim()) {
      newErrors.title = 'Title is required';
    } else if (!/[a-zA-Z0-9]/.test(title)) {
      newErrors.title = 'Title must contain at least one letter or number';
    } else if (title.length > 100) {
      newErrors.title = 'Title must be 100 characters or less';
    }

    // Description validation - max 1000 characters
    if (description.length > 1000) {
      newErrors.description = 'Description must be 1000 characters or less';
    }

    // Priority validation - must be selected
    if (!priority) {
      newErrors.priority = 'Priority is required';
    }

    // Due date validation - must not be empty and must not be a past date
    if (!dueDate) {
      newErrors.dueDate = 'Due date is required';
    } else {
      const selectedDate = new Date(dueDate);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      selectedDate.setHours(0, 0, 0, 0);
      
      if (selectedDate < today) {
        newErrors.dueDate = 'Due date cannot be in the past';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Clear any previous submit errors
    setInternalSubmitError('');
    
    if (validateForm()) {
      try {
        await onSubmit({
          title,
          description,
          category,
          priority,
          status,
          due_date: dueDate || null,
        });
      } catch (error: any) {
        setInternalSubmitError(error.message || 'An error occurred while saving the task.');
      }
    }
  };

  // Get today's date in YYYY-MM-DD format for min attribute
  const today = new Date().toISOString().split('T')[0];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto transition-colors duration-200">
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <h3 className="text-xl font-semibold text-gray-900 dark:text-white">
            {task ? 'Edit Task' : 'Create New Task'}
          </h3>
          <button
            onClick={onClose}
            className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5 text-gray-500 dark:text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Display submit error if present */}
          {(internalSubmitError || externalSubmitError) && (
            <div className="mb-4 p-3 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg">
              <p className="text-sm text-red-700 dark:text-red-400">
                {internalSubmitError || externalSubmitError}
              </p>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Title *
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => {
                // Limit to 100 characters
                if (e.target.value.length <= 100) {
                  setTitle(e.target.value);
                  // Clear error when user starts typing
                  if (errors.title) {
                    setErrors(prev => {
                      const newErrors = {...prev};
                      delete newErrors.title;
                      return newErrors;
                    });
                  }
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.title 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
              placeholder="Enter task title"
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                {errors.title && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.title}</p>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {title.length}/100
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Description
            </label>
            <textarea
              value={description}
              onChange={(e) => {
                // Limit to 1000 characters
                if (e.target.value.length <= 1000) {
                  setDescription(e.target.value);
                }
              }}
              rows={3}
              className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white resize-none"
              placeholder="Enter task description"
            />
            <div className="flex justify-between items-center mt-1">
              <div>
                {errors.description && (
                  <p className="text-sm text-red-600 dark:text-red-400">{errors.description}</p>
                )}
              </div>
              <div className="text-sm text-gray-500 dark:text-gray-400">
                {description.length}/1000
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Category *
            </label>
            <div>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                {defaultCategories.map((cat) => (
                  <option key={cat} value={cat}>
                    {cat}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Priority *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['low', 'medium', 'high'] as const).map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => {
                    setPriority(p);
                    // Clear error when user selects a priority
                    if (errors.priority) {
                      setErrors(prev => {
                        const newErrors = {...prev};
                        delete newErrors.priority;
                        return newErrors;
                      });
                    }
                  }}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                    priority === p
                      ? p === 'low'
                        ? 'bg-green-500 text-white'
                        : p === 'medium'
                        ? 'bg-yellow-500 text-white'
                        : 'bg-red-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {p.charAt(0).toUpperCase() + p.slice(1)}
                </button>
              ))}
            </div>
            {errors.priority && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.priority}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status *
            </label>
            <div className="grid grid-cols-3 gap-2">
              {(['todo', 'in-progress', 'done'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setStatus(s)}
                  className={`py-2 px-4 rounded-lg font-medium transition-colors ${
                    status === s
                      ? s === 'todo'
                        ? 'bg-slate-500 text-white'
                        : s === 'in-progress'
                        ? 'bg-blue-500 text-white'
                        : 'bg-emerald-500 text-white'
                      : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                  }`}
                >
                  {s === 'todo' ? 'To Do' : s === 'in-progress' ? 'In Progress' : 'Done'}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Due Date *
            </label>
            <input
              type="date"
              value={dueDate}
              min={today} // Prevent selecting past dates
              onChange={(e) => {
                setDueDate(e.target.value);
                // Clear error when user selects a date
                if (errors.dueDate) {
                  setErrors(prev => {
                    const newErrors = {...prev};
                    delete newErrors.dueDate;
                    return newErrors;
                  });
                }
              }}
              className={`w-full px-4 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white ${
                errors.dueDate 
                  ? 'border-red-500 dark:border-red-500' 
                  : 'border-gray-300 dark:border-gray-600'
              }`}
            />
            {errors.dueDate && (
              <p className="mt-1 text-sm text-red-600 dark:text-red-400">{errors.dueDate}</p>
            )}
          </div>

          <div className="flex gap-3 pt-4">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg transition-colors"
            >
              {task ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}