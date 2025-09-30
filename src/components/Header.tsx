import { useState, useRef, useEffect } from 'react'
import { Menu, Bell, Search, User, LogOut, Settings, ChevronDown, X, Clock, FolderOpen, CheckSquare, Sun, Moon, Megaphone } from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useSearch } from '../contexts/SearchContext'
import { useNotifications } from '../contexts/NotificationContext'
import { useTheme } from '../contexts/ThemeContext'
import { useNavigate } from 'react-router-dom'
import { getRoleDisplayName } from '../utils/permissions'

interface HeaderProps {
  onMenuClick: () => void
}

export default function Header({ onMenuClick }: HeaderProps) {
  const [showUserMenu, setShowUserMenu] = useState(false)
  const [showSearchResults, setShowSearchResults] = useState(false)
  const [showNotifications, setShowNotifications] = useState(false)
  const [showUpdates, setShowUpdates] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const notificationRef = useRef<HTMLDivElement>(null)
  const updatesRef = useRef<HTMLDivElement>(null)
  
  const { currentUser, logout } = useAuth()
  const { searchQuery, setSearchQuery, searchResults, isSearching, performSearch, clearSearch } = useSearch()
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const { isDarkMode, toggleDarkMode } = useTheme()
  const navigate = useNavigate()

  // Comprehensive updates data covering all implemented features
  const updates = [
    {
      id: '1',
      title: '📅 New Calendar System',
      description: 'Introducing a comprehensive calendar view with month, week, and day perspectives. Track your time entries visually with color-coded projects and interactive filtering.',
      date: '2024-01-20',
      type: 'feature'
    },
    {
      id: '2',
      title: '🔧 Complete API Implementation',
      description: 'Full REST API now available with Express.js and Firebase Functions. Includes authentication, rate limiting, and comprehensive endpoints for all features.',
      date: '2024-01-20',
      type: 'feature'
    },
    {
      id: '3',
      title: '📚 Comprehensive User Documentation',
      description: 'New About page with complete user guide, feature explanations, and getting started instructions. Perfect for new users and team onboarding.',
      date: '2024-01-20',
      type: 'feature'
    },
    {
      id: '4',
      title: '🏢 Nexistry Digital Solutions Branding',
      description: 'Updated branding throughout the application with Nexistry Digital Solutions credits and Prince Christiane Tolentino as lead developer.',
      date: '2024-01-20',
      type: 'feature'
    },
    {
      id: '5',
      title: '📊 Enhanced Analytics & Reporting',
      description: 'Improved reporting system with better visualizations, PDF export capabilities, and detailed time summaries for better business insights.',
      date: '2024-01-19',
      type: 'improvement'
    },
    {
      id: '6',
      title: '👥 Advanced Team Management',
      description: 'Enhanced team collaboration with role-based permissions, real-time messaging, and comprehensive user management system.',
      date: '2024-01-19',
      type: 'feature'
    },
    {
      id: '7',
      title: '⏱️ Smart Time Tracking',
      description: 'Real-time timer with automatic persistence, project association, billable tracking, and tag system for better organization.',
      date: '2024-01-18',
      type: 'feature'
    },
    {
      id: '8',
      title: '📋 Kanban Task Management',
      description: 'Complete task management system with Kanban boards, task assignments, due dates, comments, and file attachments.',
      date: '2024-01-18',
      type: 'feature'
    },
    {
      id: '9',
      title: '💬 Real-time Messaging',
      description: 'Team chat system with file sharing, @mentions, notifications, and collaborative workspace features.',
      date: '2024-01-17',
      type: 'feature'
    },
    {
      id: '10',
      title: '🎨 Modern UI/UX Design',
      description: 'Completely redesigned interface with dark mode support, responsive design, and intuitive user experience.',
      date: '2024-01-17',
      type: 'improvement'
    },
    {
      id: '11',
      title: '🔐 Enterprise Security',
      description: 'Enhanced security with Firebase authentication, role-based access control, and comprehensive data protection.',
      date: '2024-01-16',
      type: 'security'
    },
    {
      id: '12',
      title: '📱 Mobile-First Design',
      description: 'Fully responsive design optimized for mobile devices with touch-friendly interfaces and adaptive layouts.',
      date: '2024-01-16',
      type: 'improvement'
    },
    {
      id: '13',
      title: '🚀 Performance Optimization',
      description: 'Significant performance improvements with Vite build system, optimized components, and efficient state management.',
      date: '2024-01-15',
      type: 'improvement'
    },
    {
      id: '14',
      title: '📈 Advanced Project Management',
      description: 'Complete project lifecycle management with client association, status tracking, priority levels, and color coding.',
      date: '2024-01-15',
      type: 'feature'
    },
    {
      id: '15',
      title: '💰 Billing & Invoicing System',
      description: 'Automated billing calculations, client invoicing, and financial tracking with PDF export capabilities.',
      date: '2024-01-14',
      type: 'feature'
    },
    {
      id: '16',
      title: '🔔 Smart Notifications',
      description: 'Comprehensive notification system with real-time updates, mention alerts, and customizable notification preferences.',
      date: '2024-01-14',
      type: 'feature'
    },
    {
      id: '17',
      title: '📊 Fixed Bar Chart Visualization',
      description: 'Resolved bar chart display issues - bars now show proper vertical height and accurate proportions',
      date: '2024-01-13',
      type: 'fix'
    },
    {
      id: '18',
      title: '🔗 Connected Time Entry Fields',
      description: 'Time entry editing now auto-syncs duration, start time, and end time fields for consistency',
      date: '2024-01-13',
      type: 'fix'
    },
    {
      id: '19',
      title: '🌙 Fixed Dark Mode Cards',
      description: 'Resolved white card backgrounds in dark mode - all Admin Dashboard cards now properly themed',
      date: '2024-01-13',
      type: 'fix'
    },
    {
      id: '20',
      title: '📏 Optimized Chart Spacing',
      description: 'Eliminated unnecessary empty space at bottom of charts for better visual presentation',
      date: '2024-01-12',
      type: 'improvement'
    }
  ]

  const handleLogout = async () => {
    try {
      await logout()
      navigate('/auth')
    } catch (error) {
      console.error('Failed to logout:', error)
    }
  }

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value
    setSearchQuery(query)
    setShowSearchResults(query.length > 0)
    
    if (query.length > 2) {
      await performSearch(query)
    } else {
      clearSearch()
    }
  }

  const handleSearchResultClick = (url: string) => {
    navigate(url)
    setShowSearchResults(false)
    clearSearch()
  }

  const handleNotificationClick = async (notificationId: string, actionUrl?: string) => {
    markAsRead(notificationId)
    
    // If it's a mention notification, also mark it as read in the database
    const notification = notifications.find(n => n.id === notificationId)
    if (notification?.type === 'mention') {
      try {
        const { mentionNotificationService } = await import('../services/mentionNotificationService')
        await mentionNotificationService.markAsRead(notificationId)
      } catch (error) {
        console.error('Error marking mention notification as read:', error)
      }
    }
    
    if (actionUrl) {
      navigate(actionUrl)
    }
    setShowNotifications(false)
  }

  // Close dropdowns when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchResults(false)
      }
      if (notificationRef.current && !notificationRef.current.contains(event.target as Node)) {
        setShowNotifications(false)
      }
      if (updatesRef.current && !updatesRef.current.contains(event.target as Node)) {
        setShowUpdates(false)
      }
    }

    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const getUserInitials = (name: string) => {
    return name
      .split(' ')
      .map(word => word[0])
      .join('')
      .toUpperCase()
      .slice(0, 2)
  }

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case 'root':
        return 'bg-black text-white border-gray-800'
      case 'super_admin':
        return 'bg-red-100 text-red-800 border-red-200'
      case 'admin':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'hr':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'employee':
      default:
        return 'bg-blue-100 text-blue-800 border-blue-200'
    }
  }

  const getUpdateTypeColor = (type: string) => {
    switch (type) {
      case 'feature':
        return 'bg-green-100 text-green-800 border-green-200'
      case 'fix':
        return 'bg-blue-100 text-blue-800 border-blue-200'
      case 'improvement':
        return 'bg-purple-100 text-purple-800 border-purple-200'
      case 'security':
        return 'bg-red-100 text-red-800 border-red-200'
      default:
        return 'bg-gray-100 text-gray-800 border-gray-200'
    }
  }

  return (
    <header className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
      <div className="flex items-center justify-between">
        {/* Left side - Menu button and search */}
        <div className="flex items-center space-x-4">
          <button
            onClick={onMenuClick}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
          >
            <Menu className="h-5 w-5 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div ref={searchRef} className="hidden md:flex items-center space-x-2 bg-gray-100 dark:bg-gray-700 rounded-lg px-3 py-2 flex-1 max-w-md relative">
            <Search className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search projects, tasks, or time entries..."
              value={searchQuery}
              onChange={handleSearchChange}
              className="bg-transparent border-none outline-none text-sm text-gray-700 dark:text-gray-300 placeholder-gray-500 dark:placeholder-gray-400 flex-1"
            />
            {searchQuery && (
              <button
                onClick={clearSearch}
                className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded"
              >
                <X className="h-3 w-3 text-gray-400 dark:text-gray-500" />
              </button>
            )}

            {/* Search Results Dropdown */}
            {showSearchResults && (
              <div className="absolute top-full left-0 right-0 mt-1 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 max-h-96 overflow-y-auto z-50">
                {isSearching ? (
                  <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary-600 mx-auto mb-2"></div>
                    Searching...
                  </div>
                ) : searchResults.length > 0 ? (
                  <div className="py-2">
                    {searchResults.map((result) => (
                      <button
                        key={result.id}
                        onClick={() => handleSearchResultClick(result.url)}
                        className="w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start space-x-3"
                      >
                        <div className="flex-shrink-0 mt-1">
                          {result.type === 'project' && <FolderOpen className="h-4 w-4 text-blue-500" />}
                          {result.type === 'task' && <CheckSquare className="h-4 w-4 text-green-500" />}
                          {result.type === 'timeEntry' && <Clock className="h-4 w-4 text-purple-500" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100 truncate">{result.title}</p>
                          <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{result.description}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                ) : searchQuery.length > 2 ? (
                  <div className="p-4 text-center text-gray-500">
                    No results found for "{searchQuery}"
                  </div>
                ) : null}
              </div>
            )}
          </div>
        </div>

        {/* Right side - Theme toggle, Notifications and user menu */}
        <div className="flex items-center space-x-3">
          {/* Theme Toggle */}
          <button
            onClick={toggleDarkMode}
            className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
            title={isDarkMode ? 'Switch to light mode' : 'Switch to dark mode'}
          >
            {isDarkMode ? (
              <Sun className="h-5 w-5 text-yellow-500" />
            ) : (
              <Moon className="h-5 w-5 text-gray-600 dark:text-gray-300" />
            )}
          </button>

          {/* Updates/Announcements */}
          <div ref={updatesRef} className="relative">
            <button
              onClick={() => setShowUpdates(!showUpdates)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors"
              title="Updates & Announcements"
            >
              <Megaphone className="h-5 w-5 text-orange-500 dark:text-orange-400" />
            </button>

            {/* Updates Dropdown */}
            {showUpdates && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100 flex items-center space-x-2">
                    <Megaphone className="h-4 w-4 text-orange-500" />
                    <span>Updates & Announcements</span>
                  </h3>
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {updates.length > 0 ? (
                    <div className="py-2">
                      {updates.map((update) => (
                        <div
                          key={update.id}
                          className="px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 border-b border-gray-100 dark:border-gray-700 last:border-b-0"
                        >
                          <div className="flex items-start justify-between mb-2">
                            <h4 className="text-sm font-medium text-gray-900 dark:text-gray-100">
                              {update.title}
                            </h4>
                            <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getUpdateTypeColor(update.type)}`}>
                              {update.type}
                            </span>
                          </div>
                          <p className="text-xs text-gray-600 dark:text-gray-400 mb-2">
                            {update.description}
                          </p>
                          <p className="text-xs text-gray-400 dark:text-gray-500">
                            {update.date}
                          </p>
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No updates available
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>

          <div ref={notificationRef} className="relative">
            <button 
              onClick={() => setShowNotifications(!showNotifications)}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors relative"
            >
              <Bell className="h-5 w-5 text-gray-600 dark:text-gray-300" />
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 h-2 w-2 bg-red-500 rounded-full"></span>
              )}
            </button>

            {/* Notifications Dropdown */}
            {showNotifications && (
              <div className="absolute right-0 mt-2 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 z-50">
                <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-700 flex items-center justify-between">
                  <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">Notifications</h3>
                  {unreadCount > 0 && (
                    <button
                      onClick={markAllAsRead}
                      className="text-xs text-primary-600 dark:text-primary-400 hover:text-primary-800 dark:hover:text-primary-300"
                    >
                      Mark all as read
                    </button>
                  )}
                </div>
                
                <div className="max-h-96 overflow-y-auto">
                  {notifications.length > 0 ? (
                    <div className="py-2">
                      {notifications.slice(0, 10).map((notification) => (
                        <button
                          key={notification.id}
                          onClick={() => handleNotificationClick(notification.id, notification.actionUrl)}
                          className={`w-full text-left px-4 py-3 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-start space-x-3 ${
                            !notification.isRead ? 'bg-blue-50 dark:bg-blue-900' : ''
                          }`}
                        >
                          <div className={`flex-shrink-0 mt-1 h-2 w-2 rounded-full ${
                            notification.type === 'error' ? 'bg-red-500' :
                            notification.type === 'warning' ? 'bg-yellow-500' :
                            notification.type === 'success' ? 'bg-green-500' :
                            notification.type === 'mention' ? 'bg-purple-500' :
                            'bg-blue-500'
                          }`}></div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center space-x-2">
                              <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{notification.title}</p>
                              {notification.type === 'mention' && (
                                <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200">
                                  @mention
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{notification.message}</p>
                            {notification.type === 'mention' && notification.contextTitle && (
                              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                                In: {notification.contextTitle}
                              </p>
                            )}
                            <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                              {notification.timestamp.toLocaleTimeString()}
                            </p>
                          </div>
                        </button>
                      ))}
                    </div>
                  ) : (
                    <div className="p-4 text-center text-gray-500 dark:text-gray-400">
                      No notifications
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* User Menu */}
          <div className="relative">
            <button
              onClick={() => setShowUserMenu(!showUserMenu)}
              className="flex items-center space-x-2 p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
            >
              <div className="h-8 w-8 bg-primary-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                {currentUser ? getUserInitials(currentUser.name) : <User className="h-4 w-4" />}
              </div>
              <div className="hidden md:block text-left">
                <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser?.name}</p>
                <div className="flex items-center space-x-2">
                  <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium border ${getRoleBadgeColor(currentUser?.role || 'employee')}`}>
                    {getRoleDisplayName(currentUser?.role || 'employee')}
                  </span>
                </div>
              </div>
              <ChevronDown className="h-4 w-4 text-gray-400 dark:text-gray-500" />
            </button>

            {/* Dropdown Menu */}
            {showUserMenu && (
              <>
                <div 
                  className="fixed inset-0 z-10" 
                  onClick={() => setShowUserMenu(false)}
                />
                <div className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-lg border border-gray-200 dark:border-gray-700 py-2 z-20">
                  <div className="px-4 py-2 border-b border-gray-100 dark:border-gray-700">
                    <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{currentUser?.name}</p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{currentUser?.email}</p>
                  </div>
                  
                  <button
                    onClick={() => {
                      setShowUserMenu(false)
                      navigate('/settings')
                    }}
                    className="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center space-x-2"
                  >
                    <Settings className="h-4 w-4" />
                    <span>Settings</span>
                  </button>
                  
                  <button
                    onClick={handleLogout}
                    className="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900 flex items-center space-x-2"
                  >
                    <LogOut className="h-4 w-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
