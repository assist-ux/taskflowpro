import { useState, useEffect } from 'react'
import { 
  Clock, 
  DollarSign, 
  TrendingUp, 
  Calendar,
  Filter,
  Download,
  RefreshCw,
  Target,
  Award
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { reportsService } from '../services/reportsService'
import { projectService } from '../services/projectService'
import { timeEntryService } from '../services/timeEntryService'
import { 
  TimeAnalytics, 
  ProjectAnalytics, 
  DailyAnalytics, 
  ReportFilters,
  Project,
  Client // Add Client import
} from '../types'
import AnalyticsCard from '../components/charts/AnalyticsCard'
import SimpleChart from '../components/charts/SimpleChart'
import { formatTimeFromSeconds } from '../utils'

export default function Reports() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [timeAnalytics, setTimeAnalytics] = useState<TimeAnalytics | null>(null)
  const [projectAnalytics, setProjectAnalytics] = useState<ProjectAnalytics[]>([])
  const [dailyAnalytics, setDailyAnalytics] = useState<DailyAnalytics[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([]) // Add clients state
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    billableOnly: false,
    userId: currentUser?.uid
  })
  const [showFilters, setShowFilters] = useState(false)
  const [selectedProjectIds, setSelectedProjectIds] = useState<string[]>(filters.projectIds || [])
  const [selectedClientIds, setSelectedClientIds] = useState<string[]>(filters.clientIds || []) // Add selectedClientIds state
  const [selectedBillableFilter, setSelectedBillableFilter] = useState<'all' | 'billable' | 'non-billable'>('all')
  const [tempFilters, setTempFilters] = useState({
    projectIds: filters.projectIds || [],
    clientIds: filters.clientIds || [], // Add clientIds to tempFilters
    billableFilter: (filters.billableOnly ? 'billable' : filters.nonBillableOnly ? 'non-billable' : 'all') as 'all' | 'billable' | 'non-billable',
    startDate: filters.startDate,
    endDate: filters.endDate
  })
  const [applyingFilters, setApplyingFilters] = useState(false)

  useEffect(() => {
    if (filters.projectIds) {
      setSelectedProjectIds(filters.projectIds)
    }
  }, [filters.projectIds])

  // Add useEffect for clientIds
  useEffect(() => {
    if (filters.clientIds) {
      setSelectedClientIds(filters.clientIds)
    }
  }, [filters.clientIds])

  useEffect(() => {
    // Initialize tempFilters when filters change
    setTempFilters({
      projectIds: filters.projectIds || [],
      clientIds: filters.clientIds || [], // Add clientIds to tempFilters
      billableFilter: (filters.billableOnly ? 'billable' : filters.nonBillableOnly ? 'non-billable' : 'all') as 'all' | 'billable' | 'non-billable',
      startDate: filters.startDate,
      endDate: filters.endDate
    })
  }, [filters])

  useEffect(() => {
    if (currentUser) {
      setFilters(prev => ({
        ...prev,
        userId: currentUser.uid
      }))
    }
  }, [currentUser])

  useEffect(() => {
    loadData()
  }, [filters, selectedPeriod])

  useEffect(() => {
    if (!showFilters) {
      // Nothing to clear now since we removed projectSearch
    }
  }, [showFilters])

  const loadData = async () => {
    if (!currentUser) return
    
    // Only show loading spinner for initial load, not for filter updates
    if (!timeAnalytics) {
      setLoading(true)
    }
    
    try {
      // Load clients data
      const clientsData = await projectService.getClients()
      setClients(clientsData)
      
      // First get the time summary to match Time Tracker data
      const timeSummary = await timeEntryService.getTimeSummary(currentUser.uid)
      
      // Convert TimeSummary to TimeAnalytics format based on selected period
      let periodData
      switch (selectedPeriod) {
        case 'week':
          periodData = timeSummary.thisWeek
          break
        case 'month':
          periodData = timeSummary.thisMonth
          break
        case 'quarter':
        case 'year':
          periodData = timeSummary.thisMonth // For now, use monthly data
          break
        default:
          periodData = timeSummary.thisMonth
      }
      
      const analytics: TimeAnalytics = {
        totalTime: periodData.total || 0,
        billableTime: periodData.billable || 0,
        nonBillableTime: Math.max(0, (periodData.total || 0) - (periodData.billable || 0)),
        totalEntries: periodData.entries || 0,
        averageSessionLength: (periodData.entries || 0) > 0 ? (periodData.total || 0) / (periodData.entries || 1) : 0,
        mostProductiveDay: 'Monday', // Will be calculated properly later
        mostProductiveHour: 9, // Will be calculated properly later
        totalEarnings: ((periodData.billable || 0) / 3600) * 25
      }
      
      const [projectStats, dailyStats, projectsData] = await Promise.all([
        reportsService.getProjectAnalytics(filters),
        reportsService.getDailyAnalytics(filters),
        projectService.getProjects()
      ])
      
      setTimeAnalytics(analytics)
      setProjectAnalytics(projectStats)
      setDailyAnalytics(dailyStats)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading reports data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handlePeriodChange = (period: 'week' | 'month' | 'quarter' | 'year') => {
    setSelectedPeriod(period)
    const now = new Date()
    let startDate = new Date()
    
    switch (period) {
      case 'week':
        startDate.setDate(now.getDate() - 7)
        break
      case 'month':
        startDate.setDate(now.getDate() - 30)
        break
      case 'quarter':
        startDate.setDate(now.getDate() - 90)
        break
      case 'year':
        startDate.setDate(now.getDate() - 365)
        break
    }
    
    setFilters(prev => ({
      ...prev,
      startDate,
      endDate: now
    }))
  }

  const handleProjectFilter = (projectIds: string[]) => {
    setSelectedProjectIds(projectIds)
    setFilters(prev => ({
      ...prev,
      projectIds: projectIds.length > 0 ? projectIds : undefined
    }))
  }

  // Add handleClientFilter function
  const handleClientFilter = (clientIds: string[]) => {
    setSelectedClientIds(clientIds)
    setFilters(prev => ({
      ...prev,
      clientIds: clientIds.length > 0 ? clientIds : undefined
    }))
  }

  const handleBillableFilter = (filterType: 'all' | 'billable' | 'non-billable') => {
    setFilters(prev => {
      if (filterType === 'all') {
        return {
          ...prev,
          billableOnly: false,
          nonBillableOnly: false
        }
      } else if (filterType === 'billable') {
        return {
          ...prev,
          billableOnly: true,
          nonBillableOnly: false
        }
      } else { // non-billable
        return {
          ...prev,
          billableOnly: false,
          nonBillableOnly: true
        }
      }
    })
  }

  const exportData = () => {
    // Simple CSV export
    const csvData = dailyAnalytics.map(day => ({
      date: day.date,
      totalTime: formatTimeFromSeconds(day.totalTime),
      billableTime: formatTimeFromSeconds(day.billableTime),
      entries: day.entries
    }))
    
    const csv = [
      'Date,Total Time,Billable Time,Entries',
      ...csvData.map(row => `${row.date},${row.totalTime},${row.billableTime},${row.entries}`)
    ].join('\n')
    
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `time-report-${new Date().toISOString().split('T')[0]}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  const handleApplyFilters = async () => {
    setApplyingFilters(true)
    setFilters(prev => ({
      ...prev,
      projectIds: tempFilters.projectIds.length > 0 ? tempFilters.projectIds : undefined,
      clientIds: tempFilters.clientIds.length > 0 ? tempFilters.clientIds : undefined, // Add clientIds filter
      billableOnly: tempFilters.billableFilter === 'billable',
      nonBillableOnly: tempFilters.billableFilter === 'non-billable',
      startDate: tempFilters.startDate,
      endDate: tempFilters.endDate
    }))
    // Small delay to show the loading state
    await new Promise(resolve => setTimeout(resolve, 500))
    setApplyingFilters(false)
  }

  const resetFilters = () => {
    setTempFilters({
      projectIds: [],
      clientIds: [], // Add clientIds to reset
      billableFilter: 'all',
      startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000),
      endDate: new Date()
    })
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading reports...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Reports & Analytics</h1>
          <p className="text-gray-600 dark:text-gray-400">Track your productivity and time insights</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={() => setShowFilters(!showFilters)}
            className="btn-secondary flex items-center space-x-2"
          >
            <Filter className="h-4 w-4" />
            <span>Filters</span>
          </button>
          
          <button
            onClick={exportData}
            className="btn-secondary flex items-center space-x-2"
          >
            <Download className="h-4 w-4" />
            <span>Export</span>
          </button>
          
          <button
            onClick={loadData}
            className="btn-primary flex items-center space-x-2"
          >
            <RefreshCw className="h-4 w-4" />
            <span>Refresh</span>
          </button>
        </div>
      </div>

      {/* Period Selector */}
      <div className="flex space-x-2">
        {(['week', 'month', 'quarter', 'year'] as const).map((period) => (
          <button
            key={period}
            onClick={() => handlePeriodChange(period)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
              selectedPeriod === period
                ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300 border border-primary-200 dark:border-primary-700'
                : 'bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600'
            }`}
          >
            {period.charAt(0).toUpperCase() + period.slice(1)}
          </button>
        ))}
      </div>

      {/* Filters */}
      {showFilters && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Projects
              </label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto scrollbar-visible">
                {projects.map(project => (
                  <div key={project.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`project-${project.id}`}
                      checked={tempFilters.projectIds.includes(project.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempFilters(prev => ({
                            ...prev,
                            projectIds: [...prev.projectIds, project.id]
                          }))
                        } else {
                          setTempFilters(prev => ({
                            ...prev,
                            projectIds: prev.projectIds.filter(id => id !== project.id)
                          }))
                        }
                      }}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label
                      htmlFor={`project-${project.id}`}
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {project.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {tempFilters.projectIds.length} of {projects.length} selected
                </span>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setTempFilters(prev => ({ ...prev, projectIds: [] }))}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempFilters(prev => ({ ...prev, projectIds: projects.map(p => p.id) }))}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Select All
                  </button>
                </div>
              </div>
              {projects.length > 0 && (
                <>
                  {tempFilters.projectIds.length === projects.length && (
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                      All projects selected
                    </div>
                  )}
                  {tempFilters.projectIds.length === 0 && (
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      No projects selected - showing all projects
                    </div>
                  )}
                </>
              )}
            </div>
            
            {/* Add Clients filter section */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Clients
              </label>
              <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-3 max-h-40 overflow-y-auto scrollbar-visible">
                {clients.map(client => (
                  <div key={client.id} className="flex items-center mb-2">
                    <input
                      type="checkbox"
                      id={`client-${client.id}`}
                      checked={tempFilters.clientIds.includes(client.id)}
                      onChange={(e) => {
                        if (e.target.checked) {
                          setTempFilters(prev => ({
                            ...prev,
                            clientIds: [...prev.clientIds, client.id]
                          }))
                        } else {
                          setTempFilters(prev => ({
                            ...prev,
                            clientIds: prev.clientIds.filter(id => id !== client.id)
                          }))
                        }
                      }}
                      className="h-4 w-4 text-primary-600 rounded border-gray-300 focus:ring-primary-500"
                    />
                    <label
                      htmlFor={`client-${client.id}`}
                      className="ml-2 text-sm text-gray-700 dark:text-gray-300"
                    >
                      {client.name}
                    </label>
                  </div>
                ))}
              </div>
              <div className="flex items-center justify-between mt-2">
                <span className="text-xs text-gray-500 dark:text-gray-400">
                  {tempFilters.clientIds.length} of {clients.length} selected
                </span>
                <div className="space-x-2">
                  <button
                    type="button"
                    onClick={() => setTempFilters(prev => ({ ...prev, clientIds: [] }))}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Clear All
                  </button>
                  <button
                    type="button"
                    onClick={() => setTempFilters(prev => ({ ...prev, clientIds: clients.map(c => c.id) }))}
                    className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300"
                  >
                    Select All
                  </button>
                </div>
              </div>
              {clients.length > 0 && (
                <>
                  {tempFilters.clientIds.length === clients.length && (
                    <div className="mt-1 text-xs text-green-600 dark:text-green-400">
                      All clients selected
                    </div>
                  )}
                  {tempFilters.clientIds.length === 0 && (
                    <div className="mt-1 text-xs text-blue-600 dark:text-blue-400">
                      No clients selected - showing all clients
                    </div>
                  )}
                </>
              )}
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Type
              </label>
              <select
                className="input"
                value={tempFilters.billableFilter}
                onChange={(e) => setTempFilters(prev => ({
                  ...prev,
                  billableFilter: e.target.value as 'all' | 'billable' | 'non-billable'
                }))}
              >
                <option value="all">All Time</option>
                <option value="billable">Billable Only</option>
                <option value="non-billable">Non-Billable Only</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Date Range
              </label>
              <div className="space-y-2">
                <input
                  type="date"
                  value={tempFilters.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    startDate: new Date(e.target.value)
                  }))}
                  className="input w-full"
                />
                <input
                  type="date"
                  value={tempFilters.endDate.toISOString().split('T')[0]}
                  onChange={(e) => setTempFilters(prev => ({
                    ...prev,
                    endDate: new Date(e.target.value)
                  }))}
                  className="input w-full"
                />
              </div>
            </div>
          </div>
          
          <div className="flex justify-end space-x-3 mt-6">
            <button
              onClick={resetFilters}
              className="btn-secondary"
              disabled={applyingFilters}
            >
              Reset Filters
            </button>
            <button
              onClick={handleApplyFilters}
              className="btn-primary flex items-center space-x-2"
              disabled={applyingFilters}
            >
              {applyingFilters ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  <span>Applying...</span>
                </>
              ) : (
                <span>Apply Filters</span>
              )}
            </button>
          </div>
        </div>
      )}

      {/* Analytics Cards */}
      {timeAnalytics && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <AnalyticsCard
            title="Total Time"
            value={timeAnalytics.totalTime}
            subtitle={`${timeAnalytics.totalEntries} entries`}
            icon={Clock}
            color="blue"
            format="time"
          />
          
          <AnalyticsCard
            title="Billable Time"
            value={timeAnalytics.billableTime}
            subtitle={`${((timeAnalytics.billableTime / timeAnalytics.totalTime) * 100).toFixed(1)}% of total`}
            icon={DollarSign}
            color="green"
            format="time"
          />
          
          <AnalyticsCard
            title="Average Session"
            value={timeAnalytics.averageSessionLength}
            subtitle="Per time entry"
            icon={Target}
            color="purple"
            format="time-precise"
          />
          
          <AnalyticsCard
            title="Total Earnings"
            value={timeAnalytics.totalEarnings}
            subtitle="At $25/hour"
            icon={TrendingUp}
            color="orange"
            format="currency"
          />
        </div>
      )}

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Project Distribution */}
        <SimpleChart
          data={reportsService.generateProjectChartData(projectAnalytics || [])}
          type="doughnut"
          title="Time by Project"
          height={300}
        />
        
        {/* Daily Time Trend */}
        <SimpleChart
          data={reportsService.generateDailyChartData((dailyAnalytics || []).slice(-14))} // Last 14 days
          type="line"
          title="Daily Time Trend"
          height={300}
        />
      </div>

      {/* Project Breakdown */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Project Breakdown</h3>
        <div className="space-y-4">
          {(projectAnalytics || []).map((project) => (
            <div key={project.projectId} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div
                  className="w-4 h-4 rounded-full"
                  style={{ backgroundColor: project.color || '#6B7280' }}
                />
                <div>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100">{project.projectName || 'Unknown Project'}</h4>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{project.entries || 0} entries</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatTimeFromSeconds(project.totalTime || 0)}</p>
                <p className="text-sm text-gray-500 dark:text-gray-400">{(project.percentage || 0).toFixed(1)}%</p>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Productivity Insights */}
      {timeAnalytics && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Productivity Insights</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center">
              <div className="p-4 bg-blue-100 dark:bg-blue-900 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Calendar className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Most Productive Day</h4>
              <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{timeAnalytics.mostProductiveDay}</p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-green-100 dark:bg-green-900 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Clock className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Peak Hour</h4>
              <p className="text-2xl font-bold text-green-600 dark:text-green-400">
                {timeAnalytics.mostProductiveHour}:00
              </p>
            </div>
            
            <div className="text-center">
              <div className="p-4 bg-purple-100 dark:bg-purple-900 rounded-lg w-16 h-16 mx-auto mb-3 flex items-center justify-center">
                <Award className="h-8 w-8 text-purple-600 dark:text-purple-400" />
              </div>
              <h4 className="font-semibold text-gray-900 dark:text-gray-100">Efficiency</h4>
              <p className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {((timeAnalytics.billableTime / timeAnalytics.totalTime) * 100).toFixed(0)}%
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Recent Activity */}
      <div className="card">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Recent Activity</h3>
        <div className="space-y-3">
          {(dailyAnalytics || []).slice(-7).reverse().map((day) => (
            <div key={day.date} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
              <div className="flex items-center space-x-3">
                <div className="w-2 h-2 bg-primary-500 rounded-full" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-gray-100">
                    {day.date ? new Date(day.date).toLocaleDateString('en-US', { 
                      weekday: 'long', 
                      month: 'short', 
                      day: 'numeric' 
                    }) : 'Unknown Date'}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{day.entries || 0} entries</p>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-gray-900 dark:text-gray-100">{formatTimeFromSeconds(day.totalTime || 0)}</p>
                <p className="text-sm text-green-600 dark:text-green-400">{formatTimeFromSeconds(day.billableTime || 0)} billable</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}