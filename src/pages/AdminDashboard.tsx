import { useState, useEffect } from 'react'
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  UserPlus,
  BarChart3,
  Activity,
  X
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import { timeEntryService } from '../services/timeEntryService'
import { projectService } from '../services/projectService'
import { User, TimeEntry, Project } from '../types'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, isValid } from 'date-fns'
import UserDetailsModal from '../components/admin/UserDetailsModal'
import UserEditModal from '../components/admin/UserEditModal'
import { formatDurationToHHMMSS } from '../utils'

export default function AdminDashboard() {
  const { currentUser } = useAuth()
  const [users, setUsers] = useState<User[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'all'>('week')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'time-entries'>('overview')
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null)
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentUser?.role === 'admin') {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading admin data...')
      
      const [usersData, timeEntriesData, projectsData] = await Promise.all([
        userService.getAllUsers(),
        timeEntryService.getAllTimeEntries(),
        projectService.getProjects()
      ])
      
      // Filter out time entries with invalid dates
      const validTimeEntries = timeEntriesData.filter(entry => {
        // Use startTime as the date field since that's what exists in the data
        const dateField = entry.startTime || entry.createdAt
        if (!dateField) return false
        try {
          // Handle both string and Date object formats
          const date = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
          return isValid(date)
        } catch (error) {
          return false
        }
      })
      
      console.log('Loaded data:', { 
        users: usersData.length, 
        timeEntries: timeEntriesData.length,
        validTimeEntries: validTimeEntries.length,
        projects: projectsData.length 
      })
      
      setUsers(usersData)
      setTimeEntries(validTimeEntries)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading admin data:', error)
      // Set empty arrays as fallback
      setUsers([])
      setTimeEntries([])
      setProjects([])
    } finally {
      setLoading(false)
    }
  }

  const getFilteredTimeEntries = () => {
    let filtered = timeEntries

    // Filter by user
    if (selectedUser) {
      filtered = filtered.filter((entry: TimeEntry) => entry.userId === selectedUser)
    }
    // Filter by date range
    const now = new Date()
    switch (dateFilter) {
      case 'week':
        const weekStart = startOfWeek(now)
        const weekEnd = endOfWeek(now)
        filtered = filtered.filter((entry: TimeEntry) => {
          const dateField = entry.startTime || entry.createdAt
          if (!dateField) return false
          const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
          return isValid(entryDate) && entryDate >= weekStart && entryDate <= weekEnd
        })
        break
      case 'month':
        const monthStart = startOfMonth(now)
        const monthEnd = endOfMonth(now)
        filtered = filtered.filter((entry: TimeEntry) => {
          const dateField = entry.startTime || entry.createdAt
          if (!dateField) return false
          const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
          return isValid(entryDate) && entryDate >= monthStart && entryDate <= monthEnd
        })
        break
      // 'all' shows all entries
    }

    return filtered
  }

  const getFilteredUsers = () => {
    if (!searchTerm) return users
    return users.filter(user => 
      user.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      user.email.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }

  const getTotalHours = () => {
    return getFilteredTimeEntries().reduce((total: number, entry: TimeEntry) => total + entry.duration, 0)
  }

  const getActiveUsers = () => {
    const activeUserIds = new Set(getFilteredTimeEntries().map((entry: TimeEntry) => entry.userId))
    return users.filter(user => activeUserIds.has(user.id))
  }

  const getProjectStats = () => {
    const projectStats = projects.map(project => {
      const projectEntries = getFilteredTimeEntries().filter((entry: TimeEntry) => entry.projectId === project.id)
      const totalHours = projectEntries.reduce((total: number, entry: TimeEntry) => total + entry.duration, 0)
      return {
        ...project,
        totalHours,
        entryCount: projectEntries.length
      }
    }).sort((a, b) => b.totalHours - a.totalHours)

    return projectStats
  }

  const getUserStats = () => {
    return users.map(user => {
      const userEntries = getFilteredTimeEntries().filter((entry: TimeEntry) => entry.userId === user.id)
      const totalHours = userEntries.reduce((total: number, entry: TimeEntry) => total + entry.duration, 0)
      return {
        ...user,
        totalHours,
        entryCount: userEntries.length,
        lastActivity: userEntries.length > 0 ? 
          Math.max(...userEntries.map((entry: TimeEntry) => new Date(entry.startTime).getTime())) : null
      }
    }).sort((a, b) => b.totalHours - a.totalHours)
  }

  const handleViewUser = (user: User) => {
    setSelectedUserForDetails(user)
    setIsUserDetailsModalOpen(true)
  }

  const handleEditUser = (user: User) => {
    setEditingUser(user)
    setIsEditModalOpen(true)
  }

  const handleDeleteUser = async (user: User) => {
    if (window.confirm(`Are you sure you want to delete "${user.name}"? This action cannot be undone.`)) {
      try {
        setError('')
        // Note: In a real application, you would need to implement user deletion
        // For now, we'll just show a message since user deletion is complex
        // (involves removing from auth, database, and all related data)
        alert('User deletion is not implemented yet. This would require removing the user from Firebase Auth and all related data.')
        console.log('Would delete user:', user.id)
      } catch (error) {
        setError('Failed to delete user')
        console.error('Error deleting user:', error)
      }
    }
  }

  const handleUserUpdate = async (updatedUser: User) => {
    try {
      setError('')
      // Update user in the database
      await userService.updateUser(updatedUser.id, {
        name: updatedUser.name,
        email: updatedUser.email,
        role: updatedUser.role,
        isActive: updatedUser.isActive
      })
      
      // Update local state
      setUsers(prevUsers => 
        prevUsers.map(user => 
          user.id === updatedUser.id ? updatedUser : user
        )
      )
      
      setIsEditModalOpen(false)
      setEditingUser(null)
    } catch (error) {
      setError('Failed to update user')
      console.error('Error updating user:', error)
    }
  }

  if (currentUser?.role !== 'admin') {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 mb-4">Access Denied</h1>
          <p className="text-gray-600">You need admin privileges to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const totalHours = getTotalHours()
  const activeUsers = getActiveUsers()
  const projectStats = getProjectStats()
  const userStats = getUserStats()

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
          <p className="text-gray-600">Manage users, monitor time entries, and view system analytics</p>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'users', name: 'Users', icon: Users },
              { id: 'time-entries', name: 'Time Entries', icon: Clock }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }`}
              >
                <tab.icon className="h-4 w-4" />
                <span>{tab.name}</span>
              </button>
            ))}
          </nav>
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-8">
            {/* Stats Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900">{activeUsers.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{formatDurationToHHMMSS(totalHours)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600">Projects</p>
                    <p className="text-2xl font-bold text-gray-900">{projects.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Users by Hours */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Users by Hours</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {userStats.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{user.name}</p>
                          <p className="text-sm text-gray-500">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDurationToHHMMSS(user.totalHours)}</p>
                        <p className="text-sm text-gray-500">{user.entryCount} entries</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Projects by Hours */}
            <div className="bg-white rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">Top Projects by Hours</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {projectStats.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900">{project.name}</p>
                        <p className="text-sm text-gray-500">{project.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{formatDurationToHHMMSS(project.totalHours)}</p>
                        <p className="text-sm text-gray-500">{project.entryCount} entries</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Users Tab */}
        {activeTab === 'users' && (
          <div className="space-y-6">
            {/* Search and Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                    />
                  </div>
                </div>
                <button className="btn-primary flex items-center space-x-2">
                  <UserPlus className="h-4 w-4" />
                  <span>Add User</span>
                </button>
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredUsers().map((user) => {
                      const userEntries = timeEntries.filter((entry: TimeEntry) => entry.userId === user.id)
        const lastActivity = userEntries.length > 0 ? 
          Math.max(...userEntries.map((entry: TimeEntry) => new Date(entry.startTime).getTime())) : null
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900">{user.name}</div>
                                <div className="text-sm text-gray-500">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 text-purple-800' 
                                : 'bg-blue-100 text-blue-800'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {user.teamId ? (
                              <span className="text-sm text-gray-600">Team Member</span>
                            ) : (
                              <span className="text-sm text-gray-400">No Team</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive 
                                ? 'bg-green-100 text-green-800' 
                                : 'bg-red-100 text-red-800'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                            {lastActivity ? (() => {
                              try {
                                const date = new Date(lastActivity)
                                return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date'
                              } catch (error) {
                                return 'Invalid Date'
                              }
                            })() : 'Never'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex space-x-2">
                              <button 
                                onClick={() => handleViewUser(user)}
                                className="text-primary-600 hover:text-primary-900"
                                title="View user details"
                              >
                                <Eye className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleEditUser(user)}
                                className="text-indigo-600 hover:text-indigo-900"
                                title="Edit user"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button 
                                onClick={() => handleDeleteUser(user)}
                                className="text-red-600 hover:text-red-900"
                                title="Delete user"
                              >
                                <Trash2 className="h-4 w-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Time Entries Tab */}
        {activeTab === 'time-entries' && (
          <div className="space-y-6">
            {/* Filters */}
            <div className="bg-white rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">User</label>
                  <select
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="">All Users</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                <div className="flex-1">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => setDateFilter(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Time Entries Table */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-medium text-gray-900">
                  Time Entries ({getFilteredTimeEntries().length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Description
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {getFilteredTimeEntries().map((entry: TimeEntry) => {
                      const user = users.find(u => u.id === entry.userId)
                      const project = projects.find(p => p.id === entry.projectId)
                      
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-gray-200 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600">
                                  {user?.name.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900">{user?.name || 'Unknown'}</div>
                                <div className="text-sm text-gray-500">{user?.email || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{project?.name || 'Unknown Project'}</div>
                            <div className="text-sm text-gray-500">{project?.clientName || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {(() => {
                              const dateField = entry.startTime || entry.createdAt
                              if (!dateField) return 'No Date'
                              try {
                                const date = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
                                return isValid(date) ? format(date, 'MMM dd, yyyy') : 'Invalid Date'
                              } catch (error) {
                                return 'Invalid Date'
                              }
                            })()}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                            {formatDurationToHHMMSS(entry.duration)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900">
                            {entry.description || '-'}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* User Details Modal */}
        <UserDetailsModal
          isOpen={isUserDetailsModalOpen}
          onClose={() => setIsUserDetailsModalOpen(false)}
          user={selectedUserForDetails}
          allTimeEntries={timeEntries}
          allProjects={projects}
        />

        {/* User Edit Modal */}
        <UserEditModal
          isOpen={isEditModalOpen}
          onClose={() => setIsEditModalOpen(false)}
          onSave={handleUserUpdate}
          user={editingUser}
        />

        {/* Error Message */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-red-500 hover:text-red-700"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
