import { Clock, TrendingUp, Play, Plus, Users } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { useAuth } from '../contexts/AuthContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useEffect } from 'react'

export default function Dashboard() {
  const navigate = useNavigate()
  const { currentUser } = useAuth()
  const { addNotification } = useNotifications()

  // Add sample notifications on first visit
  useEffect(() => {
    const hasSeenWelcome = localStorage.getItem('hasSeenWelcome')
    if (!hasSeenWelcome) {
      addNotification({
        title: 'Welcome to Task Flow Pro!',
        message: 'Start tracking your time by creating a new time entry.',
        type: 'info',
        actionUrl: '/tracker'
      })
      addNotification({
        title: 'System Ready',
        message: 'Your time tracking application is now fully functional.',
        type: 'success',
        actionUrl: '/tracker'
      })
      localStorage.setItem('hasSeenWelcome', 'true')
    }
  }, [addNotification])

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Dashboard</h1>
          <p className="text-gray-600 dark:text-gray-400">Welcome back, {currentUser?.name}</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => navigate('/tracker')}
            className="btn-primary flex items-center space-x-2"
          >
            <Play className="h-4 w-4" />
            <span>Start Timer</span>
          </button>
          
          <button 
            onClick={() => window.location.reload()}
            className="btn-secondary flex items-center space-x-2"
          >
            <Clock className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Welcome Message */}
      <div className="card">
        <div className="text-center py-12">
          <div className="p-4 bg-primary-100 dark:bg-primary-900 rounded-full w-20 h-20 mx-auto mb-6 flex items-center justify-center">
            <Clock className="h-10 w-10 text-primary-600 dark:text-primary-400" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">
            Welcome to Task Flow Pro
          </h2>
          <p className="text-gray-600 dark:text-gray-400 mb-6 max-w-md mx-auto">
            Your time tracking application is ready. The system has been rebuilt with a clean foundation.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <button
              onClick={() => navigate('/tracker')}
              className="btn-primary flex items-center justify-center space-x-2"
            >
              <Play className="h-4 w-4" />
              <span>Start Tracking</span>
            </button>
            <button
              onClick={() => navigate('/projects')}
              className="btn-secondary flex items-center justify-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Manage Projects</span>
            </button>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className={`grid gap-6 ${currentUser?.role === 'admin' ? 'grid-cols-1 md:grid-cols-4' : 'grid-cols-1 md:grid-cols-3'}`}>
        <div 
          onClick={() => navigate('/tracker')}
          className="card text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="p-4 bg-primary-100 dark:bg-primary-900 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Clock className="h-8 w-8 text-primary-600 dark:text-primary-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Start Timer</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Begin tracking time for a new task</p>
        </div>

        <div 
          onClick={() => navigate('/projects')}
          className="card text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-green-600 dark:text-green-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">New Project</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Create a new project to organize work</p>
        </div>

        <div 
          onClick={() => navigate('/reports')}
          className="card text-center hover:shadow-md transition-shadow cursor-pointer"
        >
          <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
          </div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">View Reports</h3>
          <p className="text-gray-600 dark:text-gray-400 text-sm">Analyze your time and productivity</p>
        </div>

        {/* Admin or Root quick action */}
        {(currentUser?.role === 'admin' || currentUser?.role === 'root') && (
          <div 
            onClick={() => navigate('/admin')}
            className="card text-center hover:shadow-md transition-shadow cursor-pointer"
          >
            <div className="p-4 bg-red-100 dark:bg-red-900 rounded-lg w-16 h-16 mx-auto mb-4 flex items-center justify-center">
              <Users className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-2">Admin Dashboard</h3>
            <p className="text-gray-600 dark:text-gray-400 text-sm">Monitor team activity and performance</p>
          </div>
        )}
      </div>
    </div>
  )
}