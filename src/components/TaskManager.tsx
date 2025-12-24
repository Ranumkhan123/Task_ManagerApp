import { useState, useEffect, useMemo } from 'react';
import { Plus, LogOut, Moon, Sun, Trash2 } from 'lucide-react';
import { supabase } from '../lib/supabase';
import { useAuth } from '../contexts/AuthContext';
import { useTheme } from '../contexts/ThemeContext';
import { Task, SortOption, FilterOptions } from '../types';
import { TaskCard } from './TaskCard';
import { TaskForm } from './TaskForm';
import { FilterSort } from './FilterSort';

export function TaskManager() {
  const { user, signOut } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingTask, setEditingTask] = useState<Task | null>(null);
  const [formSubmitError, setFormSubmitError] = useState(''); // Add state for form submit errors
  const [selectedTasks, setSelectedTasks] = useState<Set<string>>(new Set()); // Add state for multi-select
  const [sortBy, setSortBy] = useState<SortOption>('newest');
  const [filters, setFilters] = useState<FilterOptions>({
    category: 'all',
    priority: 'all',
    status: 'all',
    dueDateRange: 'all',
  });
  const [userEmails, setUserEmails] = useState<Record<string, string>>({});

  useEffect(() => {
    if (user) {
      loadTasks();
      const unsubscribe = subscribeToTasks();
      return () => {
        if (unsubscribe) unsubscribe();
      };
    }
  }, [user]); // Add user as dependency

  // Add a check for user existence
  if (!user) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-600 dark:text-gray-400">Authentication required...</div>
      </div>
    );
  }

  const loadTasks = async () => {
    if (!user) return;

    try {
      // Only load tasks for the current user
      const { data, error } = await supabase
        .from('tasks')
        .select('*')
        .eq('user_id', user.id) // Filter by current user
        .order('created_at', { ascending: false });

      if (error) throw error;
      if (data) {
        setTasks(data as Task[]);
        // Load user emails for display purposes
        const uniqueUserIds = [...new Set((data as Task[]).map((t: Task) => t.user_id))];
        await loadUserEmails(uniqueUserIds);
      }
    } catch (error) {
      console.error('Error loading tasks:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadUserEmails = async (userIds: string[]) => {
    if (!user) return;

    try {
      const emailMap: Record<string, string> = {};
      // For the current user, we already have the email
      if (userIds.includes(user.id) && user.email) {
        emailMap[user.id] = user.email;
      }
      
      // For other users (if any), we would need to fetch from the database
      // But in our case, we only show tasks for the current user, so this is fine
      
      setUserEmails((prev) => ({ ...prev, ...emailMap }));
    } catch (error) {
      console.error('Error loading user emails:', error);
    }
  };

  const subscribeToTasks = () => {
    if (!user) return () => {};

    const channel = supabase
      .channel('tasks_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'tasks' }, (payload: any) => {
        // Only process events for the current user
        if (payload.new && payload.new.user_id !== user.id) return;
        if (payload.old && payload.old.user_id !== user.id) return;

        if (payload.eventType === 'INSERT') {
          setTasks((current) => {
            const hasTask = current.some((t) => t.id === payload.new.id);
            if (hasTask) return current;
            return [payload.new as Task, ...current];
          });
          if (payload.new.user_id) {
            loadUserEmails([payload.new.user_id]);
          }
        } else if (payload.eventType === 'UPDATE') {
          setTasks((current) =>
            current.map((task) => (task.id === payload.new.id ? payload.new as Task : task))
          );
        } else if (payload.eventType === 'DELETE') {
          setTasks((current) => current.filter((task) => task.id !== payload.old.id));
        }
      })
      .subscribe();

    return () => {
      channel.unsubscribe();
    };
  };

  const handleCreateTask = async (data: Partial<Task>) => {
    try {
      // Check if a task with the same title already exists for this user
      const { data: existingTasks, error: fetchError } = await supabase
        .from('tasks')
        .select('id')
        .eq('user_id', user!.id)
        .eq('title', data.title)
        .limit(1);

      if (fetchError) {
        throw fetchError;
      }

      if (existingTasks && existingTasks.length > 0) {
        // Task with the same title already exists
        setFormSubmitError('A task with this title already exists. Please use a different title.');
        throw new Error('A task with this title already exists. Please use a different title.');
      }

      setShowForm(false);

      const { data: insertedData, error } = await supabase
        .from('tasks')
        .insert([
          {
            ...data,
            user_id: user!.id,
            status: data.status || 'todo',
          },
        ])
        .select();

      if (error) throw error;

      if (insertedData && insertedData.length > 0) {
        const newTask = insertedData[0] as Task;
        setTasks((current) => [newTask, ...current]);
        if (newTask.user_id) {
          loadUserEmails([newTask.user_id]);
        }
        setFormSubmitError(''); // Clear error on success
      }
    } catch (error: any) {
      console.error('Error creating task:', error);
      if (!formSubmitError) { // Only set if not already set
        setFormSubmitError(error.message || 'Error creating task. Please try again.');
      }
      throw error; // Re-throw to be caught by the form
    }
  };

  const handleUpdateTask = async (data: Partial<Task>) => {
    if (!editingTask) return;

    // If the title is being changed, check if another task with the same title exists
    if (data.title && data.title !== editingTask.title) {
      try {
        const { data: existingTasks, error: fetchError } = await supabase
          .from('tasks')
          .select('id')
          .eq('user_id', user!.id)
          .eq('title', data.title)
          .limit(1);

        if (fetchError) {
          throw fetchError;
        }

        if (existingTasks && existingTasks.length > 0) {
          // Task with the same title already exists
          setFormSubmitError('A task with this title already exists. Please use a different title.');
          throw new Error('A task with this title already exists. Please use a different title.');
        }
      } catch (error: any) {
        console.error('Error checking for duplicate title:', error);
        if (!formSubmitError) { // Only set if not already set
          setFormSubmitError(error.message || 'Error checking for duplicate title. Please try again.');
        }
        throw error; // Re-throw to be caught by the form
      }
    }

    const originalTask = editingTask;
    const optimisticUpdate = { ...editingTask, ...data };

    try {
      setTasks((current) =>
        current.map((task) => (task.id === editingTask.id ? optimisticUpdate : task))
      );
      setEditingTask(null);
      setShowForm(false);

      const { error } = await supabase
        .from('tasks')
        .update(data)
        .eq('id', editingTask.id);

      if (error) {
        setTasks((current) =>
          current.map((task) => (task.id === originalTask.id ? originalTask : task))
        );
        throw error;
      }
      
      setFormSubmitError(''); // Clear error on success
    } catch (error: any) {
      console.error('Error updating task:', error);
      setTasks((current) =>
        current.map((task) => (task.id === originalTask.id ? originalTask : task))
      );
      if (!formSubmitError) { // Only set if not already set
        setFormSubmitError(error.message || 'Error updating task. Please try again.');
      }
    }
  };

  const handleDeleteTask = async (id: string) => {
    if (!confirm('Are you sure you want to delete this task?')) return;

    const taskToDelete = tasks.find((t) => t.id === id);

    try {
      setTasks((current) => current.filter((task) => task.id !== id));

      const { error } = await supabase.from('tasks').delete().eq('id', id);

      if (error) {
        if (taskToDelete) {
          setTasks((current) => [...current, taskToDelete]);
        }
        throw error;
      }
      
      // Remove from selected tasks if it was selected
      if (selectedTasks.has(id)) {
        const newSelectedTasks = new Set(selectedTasks);
        newSelectedTasks.delete(id);
        setSelectedTasks(newSelectedTasks);
      }
    } catch (error) {
      console.error('Error deleting task:', error);
    }
  };

  // Add bulk delete function
  const handleBulkDelete = async () => {
    if (selectedTasks.size === 0) return;
    
    if (!confirm(`Are you sure you want to delete ${selectedTasks.size} task(s)?`)) return;

    const selectedTasksArray = Array.from(selectedTasks);
    const tasksToDelete = tasks.filter(task => selectedTasks.has(task.id));
    
    try {
      // Update UI immediately
      setTasks(current => current.filter(task => !selectedTasks.has(task.id)));
      
      // Delete from database
      const { error } = await supabase
        .from('tasks')
        .delete()
        .in('id', selectedTasksArray);
      
      if (error) {
        // Rollback UI if there was an error
        setTasks(current => [...current, ...tasksToDelete]);
        throw error;
      }
      
      // Clear selection
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Error deleting tasks:', error);
    }
  };

  // Add bulk mark as completed function
  const handleBulkMarkAsCompleted = async () => {
    if (selectedTasks.size === 0) return;
    
    const selectedTasksArray = Array.from(selectedTasks);
    const tasksToUpdate = tasks.filter(task => selectedTasks.has(task.id));
    
    try {
      // Update UI immediately
      setTasks(current => 
        current.map(task => 
          selectedTasks.has(task.id) 
            ? { ...task, completed: true, status: 'done' } 
            : task
        )
      );
      
      // Update in database
      const { error } = await supabase
        .from('tasks')
        .update({ completed: true, status: 'done' })
        .in('id', selectedTasksArray);
      
      if (error) {
        // Rollback UI if there was an error
        setTasks(current => 
          current.map(task => {
            const originalTask = tasksToUpdate.find(t => t.id === task.id);
            return originalTask ? originalTask : task;
          })
        );
        throw error;
      }
      
      // Clear selection
      setSelectedTasks(new Set());
    } catch (error) {
      console.error('Error marking tasks as completed:', error);
    }
  };

  // Add function to toggle task selection
  const toggleTaskSelection = (taskId: string) => {
    const newSelectedTasks = new Set(selectedTasks);
    if (newSelectedTasks.has(taskId)) {
      newSelectedTasks.delete(taskId);
    } else {
      newSelectedTasks.add(taskId);
    }
    setSelectedTasks(newSelectedTasks);
  };

  // Add function to select all tasks
  const selectAllTasks = () => {
    if (selectedTasks.size === filteredAndSortedTasks.length) {
      // If all are selected, deselect all
      setSelectedTasks(new Set());
    } else {
      // Select all currently filtered tasks
      setSelectedTasks(new Set(filteredAndSortedTasks.map(task => task.id)));
    }
  };

  const handleToggleComplete = async (id: string, completed: boolean) => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      setTasks((current) =>
        current.map((t) => (t.id === id ? { ...t, completed } : t))
      );

      const { error } = await supabase
        .from('tasks')
        .update({ completed })
        .eq('id', id);

      if (error) {
        setTasks((current) =>
          current.map((t) => (t.id === id ? { ...t, completed: task.completed } : t))
        );
        throw error;
      }
    } catch (error) {
      console.error('Error toggling task:', error);
    }
  };

  const handleStatusChange = async (id: string, status: 'todo' | 'in-progress' | 'done') => {
    const task = tasks.find((t) => t.id === id);
    if (!task) return;

    try {
      setTasks((current) =>
        current.map((t) => (t.id === id ? { ...t, status } : t))
      );

      const { error } = await supabase
        .from('tasks')
        .update({ status })
        .eq('id', id);

      if (error) {
        setTasks((current) =>
          current.map((t) => (t.id === id ? { ...t, status: task.status } : t))
        );
        throw error;
      }
    } catch (error) {
      console.error('Error updating task status:', error);
    }
  };

  const defaultCategories = ['Work', 'Personal', 'Urgent'];
  const categories = useMemo(() => {
    const cats = new Set(tasks.map((t) => t.category));
    const allCategories = new Set([...defaultCategories, ...cats]);
    return Array.from(allCategories).sort();
  }, [tasks]);

  const filteredAndSortedTasks = useMemo(() => {
    let filtered = [...tasks];

    if (filters.category !== 'all') {
      filtered = filtered.filter((t) => t.category === filters.category);
    }

    if (filters.priority !== 'all') {
      filtered = filtered.filter((t) => t.priority === filters.priority);
    }

    if (filters.status !== 'all') {
      filtered = filtered.filter((t) => t.status === filters.status);
    }

    if (filters.dueDateRange !== 'all') {
      const today = new Date();
      today.setHours(0, 0, 0, 0);

      filtered = filtered.filter((t) => {
        if (!t.due_date) return false;
        const dueDate = new Date(t.due_date);
        dueDate.setHours(0, 0, 0, 0);

        switch (filters.dueDateRange) {
          case 'overdue':
            return dueDate < today && !t.completed;
          case 'today':
            return dueDate.getTime() === today.getTime();
          case 'week': {
            const weekFromNow = new Date(today);
            weekFromNow.setDate(weekFromNow.getDate() + 7);
            return dueDate >= today && dueDate <= weekFromNow;
          }
          case 'month': {
            const monthFromNow = new Date(today);
            monthFromNow.setMonth(monthFromNow.getMonth() + 1);
            return dueDate >= today && dueDate <= monthFromNow;
          }
          default:
            return true;
        }
      });
    }

    filtered.sort((a, b) => {
      // Put completed tasks last
      if (a.completed && !b.completed) return 1;
      if (!a.completed && b.completed) return -1;
      
      switch (sortBy) {
        case 'newest':
          return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
        case 'oldest':
          return new Date(a.created_at).getTime() - new Date(b.created_at).getTime();
        case 'due_date': {
          if (!a.due_date && !b.due_date) return 0;
          if (!a.due_date) return 1;
          if (!b.due_date) return -1;
          return new Date(a.due_date).getTime() - new Date(b.due_date).getTime();
        }
        case 'priority': {
          const priorityOrder = { high: 0, medium: 1, low: 2 };
          return priorityOrder[a.priority] - priorityOrder[b.priority];
        }
        default:
          return 0;
      }
    });

    return filtered;
  }, [tasks, sortBy, filters]);

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900 transition-colors duration-200">
      <div className="max-w-7xl mx-auto px-4 py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">Task Manager</h1>
            <p className="text-gray-600 dark:text-gray-400 mt-1">
              Signed in as {user?.email}
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={toggleTheme}
              className="p-2 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
              title={`Switch to ${theme === 'light' ? 'dark' : 'light'} mode`}
            >
              {theme === 'light' ? (
                <Moon className="w-5 h-5 text-gray-700" />
              ) : (
                <Sun className="w-5 h-5 text-gray-300" />
              )}
            </button>

            <button
              onClick={() => signOut()}
              className="flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-lg transition-colors"
            >
              <LogOut className="w-5 h-5" />
              Sign Out
            </button>
          </div>
        </div>

        <div className="mb-6">
          <button
            onClick={() => {
              setEditingTask(null);
              setShowForm(true);
            }}
            className="flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 dark:bg-blue-500 dark:hover:bg-blue-600 text-white rounded-lg font-medium transition-colors shadow-sm"
          >
            <Plus className="w-5 h-5" />
            Add New Task
          </button>
        </div>

        <div className="mb-6">
          <FilterSort
            sortBy={sortBy}
            onSortChange={setSortBy}
            filters={filters}
            onFilterChange={setFilters}
            categories={categories}
          />
        </div>

        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Select All Checkbox */}
            {filteredAndSortedTasks.length > 0 && (
              <input
                type="checkbox"
                checked={selectedTasks.size > 0 && selectedTasks.size === filteredAndSortedTasks.length}
                onChange={selectAllTasks}
                className="w-5 h-5 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                title={selectedTasks.size === filteredAndSortedTasks.length ? "Deselect all" : "Select all"}
              />
            )}
            <p className="text-sm text-gray-600 dark:text-gray-400">
              Showing {filteredAndSortedTasks.length} of {tasks.length} tasks
            </p>
          </div>
          {/* Bulk action buttons */}
          {selectedTasks.size > 0 && (
            <div className="flex gap-2">
              <button
                onClick={handleBulkMarkAsCompleted}
                className="flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 dark:bg-green-500 dark:hover:bg-green-600 text-white rounded-lg font-medium transition-colors"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
                Mark as Completed
              </button>
              <button
                onClick={handleBulkDelete}
                className="flex items-center gap-2 px-4 py-2 bg-red-600 hover:bg-red-700 dark:bg-red-500 dark:hover:bg-red-600 text-white rounded-lg font-medium transition-colors"
              >
                <Trash2 className="w-4 h-4" />
                Delete
              </button>
            </div>
          )}
        </div>

        {filteredAndSortedTasks.length === 0 ? (
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-12 text-center">
            <p className="text-gray-600 dark:text-gray-400">
              {tasks.length === 0 ? 'No tasks yet. Create your first task!' : 'No tasks match your filters.'}
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {filteredAndSortedTasks.map((task) => (
              <TaskCard
                key={task.id}
                task={task}
                onEdit={(task) => {
                  setEditingTask(task);
                  setShowForm(true);
                }}
                onDelete={handleDeleteTask}
                onToggleComplete={handleToggleComplete}
                onStatusChange={handleStatusChange}
                userEmail={userEmails[task.user_id]}
                isSelected={selectedTasks.has(task.id)} // Pass isSelected prop
                onSelect={toggleTaskSelection} // Pass onSelect prop
              />
            ))}
          </div>
        )}
      </div>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSubmit={editingTask ? handleUpdateTask : handleCreateTask}
          onClose={() => {
            setShowForm(false);
            setEditingTask(null);
            setFormSubmitError(''); // Clear error when closing form
          }}
          categories={categories}
          submitError={formSubmitError} // Pass submit error to form
        />
      )}
    </div>
  );
}
