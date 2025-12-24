import { useAuth } from './contexts/AuthContext';
import { AuthForm } from './components/AuthForm';
import { TaskManager } from './components/TaskManager';

function App() {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center transition-colors duration-200">
        <div className="text-gray-600 dark:text-gray-400">Loading...</div>
      </div>
    );
  }

  return user ? <TaskManager /> : <AuthForm />;
}

export default App;