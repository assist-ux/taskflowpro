import React, { useState, useEffect } from 'react'
import { X, Clock, Calendar, TrendingUp, BarChart3, User, Mail, Shield, Users, Activity } from 'lucide-react'
import { User as UserType, TimeEntry, Project } from '../../types'
import { timeEntryService } from '../../services/timeEntryService'
import { format, parseISO, startOfWeek, endOfWeek, startOfMonth, endOfMonth, subWeeks, subMonths, isValid } from 'date-fns'
import { formatDurationToHHMMSS } from '../../utils'

interface UserDetailsModalProps {
  isOpen: boolean
  onClose: () => void
  user: UserType | null
  allTimeEntries: TimeEntry[]
  allProjects: Project[]
}

export default function UserDetailsModal({ isOpen, onClose, user, allTimeEntries, allProjects }: UserDetailsModalProps) {
  const [userTimeEntries, setUserTimeEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<'overview' | 'time-entries' | 'stats'>('overview')

  useEffect(() => {
    if (isOpen && user) {
      loadUserData()
    }
  }, [isOpen, user])

  const loadUserData = async () => {
    if (!user) return
    
    setLoading(true)
    try {
      // Get user's time entries
      const entries = allTimeEntries.filter(entry => entry.userId === user.id)
      setUserTimeEntries(entries)
    } catch (error) {
      console.error('Error loading user data:', error)
    } finally {
      setLoading(false)
    }
  }

  const getTimeStats = () => {
    const now = new Date()
    const thisWeekStart = startOfWeek(now)
    const thisWeekEnd = endOfWeek(now)
    const thisMonthStart = startOfMonth(now)
    const thisMonthEnd = endOfMonth(now)
    const lastWeekStart = startOfWeek(subWeeks(now, 1))
    const lastWeekEnd = endOfWeek(subWeeks(now, 1))
    const lastMonthStart = startOfMonth(subMonths(now, 1))
    const lastMonthEnd = endOfMonth(subMonths(now, 1))

    const thisWeekEntries = userTimeEntries.filter(entry => {
      const dateField = entry.date || entry.createdAt
      if (!dateField) return false
      const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
      return isValid(entryDate) && entryDate >= thisWeekStart && entryDate <= thisWeekEnd
    })

    const thisMonthEntries = userTimeEntries.filter(entry => {
      const dateField = entry.date || entry.createdAt
      if (!dateField) return false
      const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
      return isValid(entryDate) && entryDate >= thisMonthStart && entryDate <= thisMonthEnd
    })

    const lastWeekEntries = userTimeEntries.filter(entry => {
      const dateField = entry.date || entry.createdAt
      if (!dateField) return false
      const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
      return isValid(entryDate) && entryDate >= lastWeekStart && entryDate <= lastWeekEnd
    })

    const lastMonthEntries = userTimeEntries.filter(entry => {
      const dateField = entry.date || entry.createdAt
      if (!dateField) return false
      const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
      return isValid(entryDate) && entryDate >= lastMonthStart && entryDate <= lastMonthEnd
    })

    return {
      totalHours: userTimeEntries.reduce((sum, entry) => sum + entry.duration, 0),
      thisWeekHours: thisWeekEntries.reduce((sum, entry) => sum + entry.duration, 0),
      thisMonthHours: thisMonthEntries.reduce((sum, entry) => sum + entry.duration, 0),
      lastWeekHours: lastWeekEntries.reduce((sum, entry) => sum + entry.duration, 0),
      lastMonthHours: lastMonthEntries.reduce((sum, entry) => sum + entry.duration, 0),
      totalEntries: userTimeEntries.length,
      thisWeekEntries: thisWeekEntries.length,
      thisMonthEntries: thisMonthEntries.length,
      lastWeekEntries: lastWeekEntries.length,
      lastMonthEntries: lastMonthEntries.length
    }
  }

  const getProjectBreakdown = () => {
    const projectStats = allProjects.map(project => {
      const projectEntries = userTimeEntries.filter(entry => entry.projectId === project.id)
      const totalHours = projectEntries.reduce((sum, entry) => sum + entry.duration, 0)
      return {
        ...project,
        totalHours,
        entryCount: projectEntries.length
      }
    }).filter(project => project.totalHours > 0).sort((a, b) => b.totalHours - a.totalHours)

    return projectStats
  }

  const getRecentActivity = () => {
    return userTimeEntries
      .sort((a, b) => {
        const dateA = typeof (a.date || a.createdAt) === 'string' ? 
          parseISO(a.date || a.createdAt) : new Date(a.date || a.createdAt)
        const dateB = typeof (b.date || b.createdAt) === 'string' ? 
          parseISO(b.date || b.createdAt) : new Date(b.date || b.createdAt)
        return dateB.getTime() - dateA.getTime()
      })
      .slice(0, 10)
  }

  if (!isOpen || !user) return null

  const stats = getTimeStats()
  const projectBreakdown = getProjectBreakdown()
  const recentActivity = getRecentActivity()

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-4">
            <div className="h-12 w-12 bg-gray-200 rounded-full flex items-center justify-center">
              <span className="text-lg font-medium text-gray-600">
                {user.name.charAt(0).toUpperCase()}
              </span>
            </div>
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{user.name}</h2>
              <p className="text-gray-600">{user.email}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            <X className="h-6 w-6" />
          </button>
        </div>

        {/* Tabs */}
        <div className="border-b border-gray-200">
          <nav className="flex space-x-8 px-6">
            {[
              { id: 'overview', name: 'Overview', icon: BarChart3 },
              { id: 'time-entries', name: 'Time Entries', icon: Clock },
              { id: 'stats', name: 'Statistics', icon: TrendingUp }
            ].map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 py-4 border-b-2 font-medium text-sm ${
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

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-200px)]">
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
            </div>
          ) : (
            <>
              {/* Overview Tab */}
              {activeTab === 'overview' && (
                <div className="space-y-6">
                  {/* User Info */}
                  <div className="bg-gray-50 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">User Information</h3>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div className="flex items-center space-x-3">
                        <User className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Role</p>
                          <p className="font-medium text-gray-900 capitalize">{user.role}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Mail className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Email</p>
                          <p className="font-medium text-gray-900">{user.email}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Shield className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Status</p>
                          <p className={`font-medium ${user.isActive ? 'text-green-600' : 'text-red-600'}`}>
                            {user.isActive ? 'Active' : 'Inactive'}
                          </p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Users className="h-5 w-5 text-gray-400" />
                        <div>
                          <p className="text-sm text-gray-500">Team</p>
                          <p className="font-medium text-gray-900">
                            {user.teamId ? 'Team Member' : 'No Team'}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Time Statistics */}
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Clock className="h-8 w-8 text-blue-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">Total Hours</p>
                          <p className="text-2xl font-bold text-gray-900">{formatDurationToHHMMSS(stats.totalHours)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Calendar className="h-8 w-8 text-green-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">This Week</p>
                          <p className="text-2xl font-bold text-gray-900">{formatDurationToHHMMSS(stats.thisWeekHours)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <TrendingUp className="h-8 w-8 text-purple-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">This Month</p>
                          <p className="text-2xl font-bold text-gray-900">{formatDurationToHHMMSS(stats.thisMonthHours)}</p>
                        </div>
                      </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded-lg p-4">
                      <div className="flex items-center">
                        <Activity className="h-8 w-8 text-orange-600" />
                        <div className="ml-3">
                          <p className="text-sm font-medium text-gray-500">Total Entries</p>
                          <p className="text-2xl font-bold text-gray-900">{stats.totalEntries}</p>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Project Breakdown */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Project Breakdown</h3>
                    {projectBreakdown.length > 0 ? (
                      <div className="space-y-3">
                        {projectBreakdown.map((project) => (
                          <div key={project.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                            <div>
                              <p className="font-medium text-gray-900">{project.name}</p>
                              <p className="text-sm text-gray-500">{project.clientName}</p>
                            </div>
                            <div className="text-right">
                              <p className="font-medium text-gray-900">{formatDurationToHHMMSS(project.totalHours)}</p>
                              <p className="text-sm text-gray-500">{project.entryCount} entries</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <p className="text-gray-500 text-center py-4">No project activity yet</p>
                    )}
                  </div>
                </div>
              )}

              {/* Time Entries Tab */}
              {activeTab === 'time-entries' && (
                <div className="space-y-6">
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-medium text-gray-900">Recent Time Entries</h3>
                    <span className="text-sm text-gray-500">{userTimeEntries.length} total entries</span>
                  </div>
                  
                  {recentActivity.length > 0 ? (
                    <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
                      <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                          <thead className="bg-gray-50">
                            <tr>
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
                            {recentActivity.map((entry) => {
                              const project = allProjects.find(p => p.id === entry.projectId)
                              const dateField = entry.date || entry.createdAt
                              const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
                              
                              return (
                                <tr key={entry.id} className="hover:bg-gray-50">
                                  <td className="px-6 py-4 whitespace-nowrap">
                                    <div className="text-sm font-medium text-gray-900">
                                      {project?.name || 'Unknown Project'}
                                    </div>
                                    <div className="text-sm text-gray-500">
                                      {project?.clientName || ''}
                                    </div>
                                  </td>
                                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                                    {isValid(entryDate) ? format(entryDate, 'MMM dd, yyyy') : 'Invalid Date'}
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
                  ) : (
                    <div className="text-center py-12">
                      <Clock className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                      <p className="text-gray-500">No time entries found</p>
                    </div>
                  )}
                </div>
              )}

              {/* Statistics Tab */}
              {activeTab === 'stats' && (
                <div className="space-y-6">
                  <h3 className="text-lg font-medium text-gray-900">Time Tracking Statistics</h3>
                  
                  {/* Weekly Comparison */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Weekly Comparison</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">This Week</p>
                        <p className="text-3xl font-bold text-gray-900">{formatDurationToHHMMSS(stats.thisWeekHours)}</p>
                        <p className="text-sm text-gray-500">{stats.thisWeekEntries} entries</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Last Week</p>
                        <p className="text-3xl font-bold text-gray-900">{formatDurationToHHMMSS(stats.lastWeekHours)}</p>
                        <p className="text-sm text-gray-500">{stats.lastWeekEntries} entries</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-blue-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (stats.thisWeekHours / Math.max(stats.lastWeekHours, 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="ml-3 text-sm text-gray-600">
                          {stats.lastWeekHours > 0 ? 
                            `${((stats.thisWeekHours / stats.lastWeekHours - 1) * 100).toFixed(1)}%` : 
                            'N/A'
                          } vs last week
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* Monthly Comparison */}
                  <div className="bg-white border border-gray-200 rounded-lg p-6">
                    <h4 className="text-md font-medium text-gray-900 mb-4">Monthly Comparison</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                      <div>
                        <p className="text-sm text-gray-500 mb-2">This Month</p>
                        <p className="text-3xl font-bold text-gray-900">{formatDurationToHHMMSS(stats.thisMonthHours)}</p>
                        <p className="text-sm text-gray-500">{stats.thisMonthEntries} entries</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-500 mb-2">Last Month</p>
                        <p className="text-3xl font-bold text-gray-900">{formatDurationToHHMMSS(stats.lastMonthHours)}</p>
                        <p className="text-sm text-gray-500">{stats.lastMonthEntries} entries</p>
                      </div>
                    </div>
                    <div className="mt-4">
                      <div className="flex items-center">
                        <div className="flex-1 bg-gray-200 rounded-full h-2">
                          <div 
                            className="bg-green-600 h-2 rounded-full" 
                            style={{ 
                              width: `${Math.min(100, (stats.thisMonthHours / Math.max(stats.lastMonthHours, 1)) * 100)}%` 
                            }}
                          ></div>
                        </div>
                        <span className="ml-3 text-sm text-gray-600">
                          {stats.lastMonthHours > 0 ? 
                            `${((stats.thisMonthHours / stats.lastMonthHours - 1) * 100).toFixed(1)}%` : 
                            'N/A'
                          } vs last month
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  )
}
