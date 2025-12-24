import { Filter, ArrowUpDown } from 'lucide-react';
import { SortOption, FilterOptions } from '../types';

interface FilterSortProps {
  sortBy: SortOption;
  onSortChange: (sort: SortOption) => void;
  filters: FilterOptions;
  onFilterChange: (filters: FilterOptions) => void;
  categories: string[];
}

export function FilterSort({ sortBy, onSortChange, filters, onFilterChange, categories }: FilterSortProps) {
  return (
    <div className="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4 transition-colors duration-200">
      <div className="flex flex-wrap gap-4">
        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <ArrowUpDown className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <select
            value={sortBy}
            onChange={(e) => onSortChange(e.target.value as SortOption)}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="newest">Newest First</option>
            <option value="oldest">Oldest First</option>
            <option value="due_date">Due Date</option>
            <option value="priority">Priority</option>
          </select>
        </div>

        <div className="flex items-center gap-2 flex-1 min-w-[200px]">
          <Filter className="w-5 h-5 text-gray-600 dark:text-gray-400" />
          <select
            value={filters.category}
            onChange={(e) => onFilterChange({ ...filters, category: e.target.value })}
            className="flex-1 px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Categories</option>
            {categories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.priority}
            onChange={(e) => onFilterChange({ ...filters, priority: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Priorities</option>
            <option value="low">Low Priority</option>
            <option value="medium">Medium Priority</option>
            <option value="high">High Priority</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.status}
            onChange={(e) => onFilterChange({ ...filters, status: e.target.value })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Statuses</option>
            <option value="todo">To Do</option>
            <option value="in-progress">In Progress</option>
            <option value="done">Done</option>
          </select>
        </div>

        <div className="flex-1 min-w-[200px]">
          <select
            value={filters.dueDateRange}
            onChange={(e) => onFilterChange({ ...filters, dueDateRange: e.target.value as FilterOptions['dueDateRange'] })}
            className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm"
          >
            <option value="all">All Dates</option>
            <option value="overdue">Overdue</option>
            <option value="today">Due Today</option>
            <option value="week">Due This Week</option>
            <option value="month">Due This Month</option>
          </select>
        </div>
      </div>

      {(filters.category !== 'all' || filters.priority !== 'all' || filters.status !== 'all' || filters.dueDateRange !== 'all') && (
        <div className="mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <button
            onClick={() => onFilterChange({ category: 'all', priority: 'all', status: 'all', dueDateRange: 'all' })}
            className="text-sm text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 font-medium transition-colors"
          >
            Clear all filters
          </button>
        </div>
      )}
    </div>
  );
}
