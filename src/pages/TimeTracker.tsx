import React, { useState, useEffect } from 'react'
import { 
  Clock, 
  Calendar, 
  DollarSign,
  BarChart3,
  Target,
  Zap
} from 'lucide-react'
import TimeTracker from '../components/TimeTracker'
import { TimeSummary, TimeEntry } from '../types'
import { timeEntryService } from '../services/timeEntryService'
import { useAuth } from '../contexts/AuthContext'
import { formatTimeFromSeconds, formatDate } from '../utils'

export default function TimeTrackerPage() {
  const { currentUser } = useAuth()
  const [timeSummary, setTimeSummary] = useState<TimeSummary | null>(null)
  const [recentEntries, setRecentEntries] = useState<TimeEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState<'today' | 'week' | 'month'>('today')

  useEffect(() => {
    loadTimeData()
  }, [])

  const loadTimeData = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
      const [summary, entries] = await Promise.all([
        timeEntryService.getTimeSummary(currentUser.uid),
        timeEntryService.getTimeEntries(currentUser.uid)
      ])
      setTimeSummary(summary)
      setRecentEntries(entries.slice(0, 10)) // Show last 10 entries
    } catch (error) {
      console.error('Error loading time data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTimeUpdate = (summary: TimeSummary) => {
    setTimeSummary(summary)
    loadTimeData() // Refresh recent entries
  }

  const getTimeStats = () => {
    if (!timeSummary) return { total: 0, billable: 0, entries: 0 }
    
    switch (activeTab) {
      case 'today':
        return timeSummary.today
      case 'week':
        return timeSummary.thisWeek
      case 'month':
        return timeSummary.thisMonth
      default:
        return timeSummary.today
    }
  }

  const getTabLabel = (tab: 'today' | 'week' | 'month') => {
    switch (tab) {
      case 'today':
        return 'Today'
      case 'week':
        return 'This Week'
      case 'month':
        return 'This Month'
    }
  }

  const getTabIcon = (tab: 'today' | 'week' | 'month') => {
    switch (tab) {
      case 'today':
        return Clock
      case 'week':
        return Calendar
      case 'month':
        return BarChart3
    }
  }

  const calculateEarnings = (seconds: number, hourlyRate: number = 25) => {
    const hours = seconds / 3600
    return hours * hourlyRate
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading time tracker...</p>
        </div>
      </div>
    )
  }

  const stats = getTimeStats()

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Time Tracker</h1>
          <p className="text-gray-600">Track your time and monitor productivity</p>
        </div>
      </div>

      {/* Time Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Daily Time */}
        <div 
          className={`card cursor-pointer transition-all duration-200 ${
            activeTab === 'today' ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveTab('today')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">Today</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTimeFromSeconds(timeSummary?.today.total || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {timeSummary?.today.entries || 0} entries
              </p>
            </div>
            <div className="p-3 bg-blue-100 rounded-lg">
              <Clock className="h-6 w-6 text-blue-600" />
            </div>
          </div>
        </div>

        {/* Weekly Time */}
        <div 
          className={`card cursor-pointer transition-all duration-200 ${
            activeTab === 'week' ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveTab('week')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Week</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTimeFromSeconds(timeSummary?.thisWeek.total || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {timeSummary?.thisWeek.entries || 0} entries
              </p>
            </div>
            <div className="p-3 bg-green-100 rounded-lg">
              <Calendar className="h-6 w-6 text-green-600" />
            </div>
          </div>
        </div>

        {/* Monthly Time */}
        <div 
          className={`card cursor-pointer transition-all duration-200 ${
            activeTab === 'month' ? 'ring-2 ring-primary-500 bg-primary-50' : 'hover:shadow-md'
          }`}
          onClick={() => setActiveTab('month')}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-gray-600">This Month</p>
              <p className="text-2xl font-bold text-gray-900">
                {formatTimeFromSeconds(timeSummary?.thisMonth.total || 0)}
              </p>
              <p className="text-sm text-gray-500">
                {timeSummary?.thisMonth.entries || 0} entries
              </p>
            </div>
            <div className="p-3 bg-purple-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-purple-600" />
            </div>
          </div>
        </div>
      </div>

      {/* Active Tab Stats */}
      <div className="card">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-lg font-semibold text-gray-900">
            {getTabLabel(activeTab)} Overview
          </h2>
          <div className="flex items-center space-x-2">
            {React.createElement(getTabIcon(activeTab), {
              className: "h-5 w-5 text-primary-600"
            })}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Total Time */}
          <div className="text-center">
            <div className="p-4 bg-primary-100 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Clock className="h-8 w-8 text-primary-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatTimeFromSeconds(stats.total)}
            </p>
            <p className="text-sm text-gray-600">Total Time</p>
          </div>

          {/* Billable Time */}
          <div className="text-center">
            <div className="p-4 bg-green-100 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <DollarSign className="h-8 w-8 text-green-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">
              {formatTimeFromSeconds(stats.billable)}
            </p>
            <p className="text-sm text-gray-600">Billable Time</p>
            <p className="text-xs text-green-600 font-medium">
              ${calculateEarnings(stats.billable).toFixed(2)} earned
            </p>
          </div>

          {/* Entries Count */}
          <div className="text-center">
            <div className="p-4 bg-purple-100 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
              <Target className="h-8 w-8 text-purple-600" />
            </div>
            <p className="text-2xl font-bold text-gray-900">{stats.entries}</p>
            <p className="text-sm text-gray-600">Time Entries</p>
          </div>
        </div>
      </div>

      {/* Time Tracker Component */}
      <TimeTracker onTimeUpdate={handleTimeUpdate} />

      {/* Recent Entries */}
      {recentEntries.length > 0 && (
        <div className="card">
          <h2 className="text-lg font-semibold text-gray-900 mb-4">Recent Entries</h2>
          <div className="space-y-3">
            {recentEntries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center justify-between p-3 bg-gray-50 rounded-lg"
              >
                <div className="flex items-center space-x-3">
                  <div className="flex items-center space-x-2">
                    {entry.isRunning ? (
                      <div className="w-3 h-3 bg-green-500 rounded-full animate-pulse"></div>
                    ) : (
                      <div className="w-3 h-3 bg-gray-400 rounded-full"></div>
                    )}
                    <span className="text-sm font-medium text-gray-900">
                      {entry.projectName || 'No project'}
                    </span>
                  </div>
                  {entry.description && (
                    <span className="text-sm text-gray-600 truncate max-w-xs">
                      {entry.description}
                    </span>
                  )}
                </div>
                <div className="flex items-center space-x-4">
                  <span className="text-sm font-mono text-gray-900">
                    {formatTimeFromSeconds(entry.duration)}
                  </span>
                  <span className="text-xs text-gray-500">
                    {formatDate(entry.startTime)}
                  </span>
                  {entry.isBillable && (
                    <DollarSign className="h-4 w-4 text-green-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Quick Tips */}
      <div className="card bg-gradient-to-r from-primary-50 to-blue-50 border-primary-200">
        <div className="flex items-start space-x-3">
          <div className="p-2 bg-primary-100 rounded-lg">
            <Zap className="h-5 w-5 text-primary-600" />
          </div>
          <div>
            <h3 className="font-semibold text-gray-900 mb-2">Quick Tips</h3>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Start a timer before beginning any task</li>
              <li>• Add descriptions to remember what you worked on</li>
              <li>• Use tags to categorize your work</li>
              <li>• Mark billable time to track earnings</li>
              <li>• Review your time patterns weekly for better productivity</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
