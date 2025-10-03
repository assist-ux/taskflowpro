import { Link, useLocation } from 'react-router-dom'
import { 
  Clock, 
  BarChart3, 
  FolderOpen, 
  Settings, 
  X,
  Users,
  Kanban,
  UserCheck,
  DollarSign,
  Building2,
  MessageSquare,
  Calendar
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { canAccessFeature } from '../utils/permissions'

interface SidebarProps {
  open: boolean
  setOpen: (open: boolean) => void
}

export default function Sidebar({ open, setOpen }: SidebarProps) {
  const location = useLocation()
  const { currentUser } = useAuth()

  const allNavigation = [
    { name: 'Dashboard', href: '/', icon: Clock, requiredFeature: null },
    { name: 'Time Tracker', href: '/tracker', icon: Clock, requiredFeature: null },
    { name: 'Calendar', href: '/calendar', icon: Calendar, requiredFeature: null },
    { name: 'Projects', href: '/projects', icon: FolderOpen, requiredFeature: 'projects' },
    { name: 'Clients', href: '/clients', icon: Building2, requiredFeature: 'clients' },
    { name: 'Task Management', href: '/management', icon: Kanban, requiredFeature: null },
    { name: 'Teams', href: '/teams', icon: UserCheck, requiredFeature: 'teams' },
    { name: 'Reports', href: '/reports', icon: BarChart3, requiredFeature: null },
    { name: 'Billing', href: '/billing', icon: DollarSign, requiredFeature: 'billing' },
    { name: 'Feedbacks', href: '/feedbacks', icon: MessageSquare, requiredFeature: null },
    { name: 'Admin Dashboard', href: '/admin', icon: Users, requiredFeature: 'admin-dashboard' },
    { name: 'System Settings', href: '/system', icon: Settings, requiredFeature: 'system-settings' },
    { name: 'Settings', href: '/settings', icon: Settings, requiredFeature: null },
  ]

  // If root, restrict to Admin Dashboard and System Settings (Companies)
  const navigation = currentUser?.role === 'root'
    ? allNavigation.filter(item => ['Admin Dashboard', 'System Settings', 'Feedbacks'].includes(item.name))
    : allNavigation.filter(item => !item.requiredFeature || (currentUser?.role && canAccessFeature(currentUser.role, item.requiredFeature)))

  const isActive = (href: string) => {
    if (href === '/') {
      return location.pathname === '/'
    }
    return location.pathname.startsWith(href)
  }

  return (
    <>
      {/* Mobile backdrop */}
      {open && (
        <div 
          className="fixed inset-0 bg-gray-600 bg-opacity-75 dark:bg-gray-900 dark:bg-opacity-75 z-40 lg:hidden"
          onClick={() => setOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out lg:translate-x-0 lg:static lg:inset-0
        ${open ? 'translate-x-0' : '-translate-x-full'}
      `}>
        <div className="flex flex-col h-full">
          {/* Header */}
          <div className="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div className="flex items-center">
              <img 
                src="https://storage.googleapis.com/msgsndr/nb61f4OQ7o9Wsxx0zOsY/media/68df3ae78db305b0e463f363.svg" 
                alt="Logo" 
                className="h-10 w-auto"
              />
              <div className="ml-3">
                <span className="text-xl font-bold text-primary-600 dark:text-primary-400">Task Flow Pro</span>
                <p className="text-xs text-gray-600 dark:text-gray-400">Powered by Nexistry</p>
              </div>
            </div>
            <button
              onClick={() => setOpen(false)}
              className="lg:hidden p-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
            >
              <X className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 px-4 py-6 space-y-2">
            {navigation.map((item) => {
              const Icon = item.icon
              return (
                <Link
                  key={item.name}
                  to={item.href}
                  onClick={() => setOpen(false)}
                  className={`
                    flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium transition-colors
                    ${isActive(item.href)
                      ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300'
                      : 'text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 hover:text-gray-900 dark:hover:text-gray-100'
                    }
                  `}
                >
                  <Icon className="h-5 w-5" />
                  <span>{item.name}</span>
                </Link>
              )
            })}
          </nav>

          {/* Footer */}
          <div className="px-4 pb-6">
            <div className="text-xs text-gray-500 dark:text-gray-400 text-center">
              <p>Task Flow Pro v1.0</p>
              <p>Rebuilt & Ready</p>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}