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
  Project
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
  const [selectedPeriod, setSelectedPeriod] = useState<'week' | 'month' | 'quarter' | 'year'>('month')
  const [filters, setFilters] = useState<ReportFilters>({
    startDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000), // 30 days ago
    endDate: new Date(),
    billableOnly: false,
    userId: currentUser?.uid
  })
  const [showFilters, setShowFilters] = useState(false)

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

  const loadData = async () => {
    if (!currentUser) return
    
    setLoading(true)
    try {
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
    setFilters(prev => ({
      ...prev,
      projectIds: projectIds.length > 0 ? projectIds : undefined
    }))
  }

  const handleBillableFilter = (billableOnly: boolean) => {
    setFilters(prev => ({
      ...prev,
      billableOnly
    }))
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
              <select
                multiple
                className="input"
                onChange={(e) => {
                  const selectedIds = Array.from(e.target.selectedOptions, option => option.value)
                  handleProjectFilter(selectedIds)
                }}
              >
                <option value="">All Projects</option>
                {projects.map(project => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Time Type
              </label>
              <select
                className="input"
                onChange={(e) => handleBillableFilter(e.target.value === 'billable')}
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
              <div className="flex space-x-2">
                <input
                  type="date"
                  value={filters.startDate.toISOString().split('T')[0]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    startDate: new Date(e.target.value)
                  }))}
                  className="input"
                />
                <input
                  type="date"
                  value={filters.endDate.toISOString().split('T')[0]}
                  onChange={(e) => setFilters(prev => ({
                    ...prev,
                    endDate: new Date(e.target.value)
                  }))}
                  className="input"
                />
              </div>
            </div>
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
