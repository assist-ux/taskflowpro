import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { 
  Users, 
  Clock, 
  TrendingUp, 
  Building2, 
  Search, 
  Eye, 
  Edit, 
  Trash2, 
  Plus, 
  Filter,
  Calendar,
  DollarSign,
  Shield,
  FolderOpen,
  Activity,
  X,
  User as UserIcon
} from 'lucide-react'
import { format, parseISO, isValid, startOfWeek, endOfWeek, startOfMonth, endOfMonth, addDays, eachDayOfInterval } from 'date-fns'
import { useAuth } from '../contexts/AuthContext'
import { userService } from '../services/userService'
import { timeEntryService } from '../services/timeEntryService'
import { projectService } from '../services/projectService'
import { teamService } from '../services/teamService'
import { User, TimeEntry, Project, Client, Team } from '../types'
import UserDetailsModal from '../components/admin/UserDetailsModal'
import TimeEntryEditModal from '../components/admin/TimeEntryEditModal'
import UserCreateModal from '../components/admin/UserCreateModal'
import UserEditModal from '../components/admin/UserEditModal'
import SimpleChart from '../components/charts/SimpleChart'
import { formatDurationToHHMMSS } from '../utils'
import { canViewHourlyRates, getRoleDisplayName, canAccessFeature } from '../utils/permissions'

export default function AdminDashboard() {
  const { currentUser } = useAuth()
  const navigate = useNavigate()

  // Redirect root users to the root dashboard
  useEffect(() => {
    if (currentUser?.role === 'root') {
      navigate('/root')
    }
  }, [currentUser, navigate])
  const [users, setUsers] = useState<User[]>([])
  const [timeEntries, setTimeEntries] = useState<TimeEntry[]>([])
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [teams, setTeams] = useState<Team[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [selectedUser, setSelectedUser] = useState<string | null>(null)
  const [selectedClient, setSelectedClient] = useState<string | null>(null)
  const [selectedProject, setSelectedProject] = useState<string | null>(null)
  const [selectedTeam, setSelectedTeam] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<'week' | 'month' | 'all' | 'custom'>('week')
  const [customStartDate, setCustomStartDate] = useState('')
  const [customEndDate, setCustomEndDate] = useState('')
  const [activeTab, setActiveTab] = useState<'overview' | 'users' | 'time-entries' | 'projects' | 'billing'>('overview')
  const [selectedUserForDetails, setSelectedUserForDetails] = useState<User | null>(null)
  const [isUserDetailsModalOpen, setIsUserDetailsModalOpen] = useState(false)
  const [editingUser, setEditingUser] = useState<User | null>(null)
  const [isEditModalOpen, setIsEditModalOpen] = useState(false)
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false)
  const [editingTimeEntry, setEditingTimeEntry] = useState<TimeEntry | null>(null)
  const [isTimeEntryEditModalOpen, setIsTimeEntryEditModalOpen] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    if (currentUser?.role && ['admin', 'hr', 'super_admin', 'root'].includes(currentUser.role)) {
      loadData()
    }
  }, [currentUser])

  const loadData = async () => {
    try {
      setLoading(true)
      console.log('Loading admin data...')
      
      // Use company-scoped user fetching for proper multi-tenancy
      let usersData: User[]
      if (currentUser?.role === 'root') {
        // Root can see all users across all companies
        usersData = await userService.getAllUsers()
      } else {
        // Company admins can only see users from their company
        usersData = await userService.getUsersForCompany(currentUser?.companyId || null)
      }
      
      const [timeEntriesData, projectsData, clientsData, teamsData] = await Promise.all([
        timeEntryService.getAllTimeEntries(),
        projectService.getProjects(),
        currentUser?.role === 'root' && !currentUser?.companyId
          ? projectService.getClients() // Root can see all clients
          : projectService.getClientsForCompany(currentUser?.companyId || null), // Company admins see only their company's clients
        teamService.getTeams()
      ])
      
      // Company scoping for non-root roles: restrict to same company data
      let scopedTimeEntries = timeEntriesData
      let scopedProjects = projectsData
      let scopedClients = clientsData
      let scopedTeams = teamsData
      if (currentUser?.role !== 'root' && currentUser?.companyId) {
        const allowedUsers = new Set(usersData.map(u => u.id))
        scopedTimeEntries = timeEntriesData.filter(te => te.userId && allowedUsers.has(te.userId))
        // Prefer project.companyId if present; otherwise fall back to creator-based scoping
        scopedProjects = projectsData.filter(p => {
          // @ts-ignore allow optional fields
          const projectCompanyId = (p as any).companyId
          if (projectCompanyId) return projectCompanyId === currentUser.companyId
          return p.createdBy ? allowedUsers.has(p.createdBy as unknown as string) : true
        })
        
        // Filter clients and teams by company
        scopedClients = clientsData.filter(client => (client as any).companyId === currentUser.companyId)
        scopedTeams = teamsData.filter(team => team.companyId === currentUser.companyId)
      }

      // Filter out time entries with invalid dates
      const validTimeEntries = scopedTimeEntries.filter(entry => {
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
        timeEntries: scopedTimeEntries.length,
        validTimeEntries: validTimeEntries.length,
        projects: scopedProjects.length,
        clients: scopedClients.length,
        teams: scopedTeams.length
      })
      
      setUsers(usersData)
      setTimeEntries(validTimeEntries)
      setProjects(scopedProjects)
      setClients(scopedClients)
      setTeams(scopedTeams)
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
    
    // Filter by client
    if (selectedClient) {
      filtered = filtered.filter((entry: TimeEntry) => entry.clientId === selectedClient)
    }
    
    // Filter by project
    if (selectedProject) {
      filtered = filtered.filter((entry: TimeEntry) => entry.projectId === selectedProject)
    }
    
    // Filter by team (filter users in the team and then filter entries by those users)
    if (selectedTeam) {
      const teamMembers = users.filter(user => user.teamId === selectedTeam).map(user => user.id)
      filtered = filtered.filter((entry: TimeEntry) => teamMembers.includes(entry.userId))
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
      case 'custom': {
        if (customStartDate && customEndDate) {
          const startDate = new Date(customStartDate)
          const endDate = new Date(customEndDate)
          
          // Fix for date range filtering: set start date to beginning of day and end date to end of day
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          
          if (isValid(startDate) && isValid(endDate) && startDate <= endDate) {
            filtered = filtered.filter((entry: TimeEntry) => {
              const dateField = entry.startTime || entry.createdAt
              if (!dateField) return false
              const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
              return isValid(entryDate) && entryDate >= startDate && entryDate <= endDate
            })
          }
        }
        break
      }
      // 'all' shows all entries
    }

    return filtered
  }

  const handleDateFilterChange = (newFilter: 'week' | 'month' | 'all' | 'custom') => {
    setDateFilter(newFilter)
    
    if (newFilter === 'custom') {
      // Set default custom date range to last 30 days
      const endDate = new Date()
      const startDate = addDays(endDate, -29)
      setCustomStartDate(format(startDate, 'yyyy-MM-dd'))
      setCustomEndDate(format(endDate, 'yyyy-MM-dd'))
    }
  }

  const handleCustomDateChange = (field: 'start' | 'end', value: string) => {
    if (field === 'start') {
      setCustomStartDate(value)
      // If end date is before new start date, update end date
      if (customEndDate && value && new Date(value) > new Date(customEndDate)) {
        setCustomEndDate(value)
      }
    } else {
      setCustomEndDate(value)
      // If start date is after new end date, update start date
      if (customStartDate && value && new Date(customStartDate) > new Date(value)) {
        setCustomStartDate(value)
      }
    }
  }

  const getDailyTimeData = () => {
    const filteredEntries = getFilteredTimeEntries()
    
    if (!filteredEntries.length) {
      return {
        labels: [],
        datasets: [{
          label: 'Hours',
          data: [],
          backgroundColor: '#3B82F6',
          borderColor: '#3B82F6'
        }]
      }
    }

    // Get the date range based on the current filter
    let startDate: Date
    let endDate: Date

    switch (dateFilter) {
      case 'week': {
        const now = new Date()
        startDate = startOfWeek(now)
        endDate = endOfWeek(now)
        break
      }
      case 'month': {
        const now = new Date()
        startDate = startOfMonth(now)
        endDate = endOfMonth(now)
        break
      }
      case 'custom': {
        if (customStartDate && customEndDate) {
          startDate = new Date(customStartDate)
          endDate = new Date(customEndDate)
          
          // Fix for date range filtering: set start date to beginning of day and end date to end of day
          startDate.setHours(0, 0, 0, 0)
          endDate.setHours(23, 59, 59, 999)
          
          // Validate dates
          if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
            // Fallback to last 7 days if invalid dates
            endDate = new Date()
            startDate = addDays(endDate, -6)
          }
        } else {
          // Fallback to last 7 days if no custom dates
          endDate = new Date()
          startDate = addDays(endDate, -6)
        }
        break
      }
      default: {
        // For 'all' case, show last 30 days
        endDate = new Date()
        startDate = addDays(endDate, -29)
        break
      }
    }

    // Validate the date range before generating days
    if (!isValid(startDate) || !isValid(endDate) || startDate > endDate) {
      console.warn('Invalid date range, using fallback')
      endDate = new Date()
      startDate = addDays(endDate, -6)
    }

    // Generate array of days in the range with error handling
    let days: Date[]
    try {
      days = eachDayOfInterval({ start: startDate, end: endDate })
    } catch (error) {
      console.warn('Error generating day interval, using fallback:', error)
      // Fallback to last 7 days
      const fallbackEnd = new Date()
      const fallbackStart = addDays(fallbackEnd, -6)
      days = eachDayOfInterval({ start: fallbackStart, end: fallbackEnd })
    }
    
    // Create a map to store daily totals
    const dailyTotals = new Map<string, number>()
    
    // Initialize all days with 0
    days.forEach(day => {
      dailyTotals.set(format(day, 'yyyy-MM-dd'), 0)
    })

    // Sum up time entries for each day
    filteredEntries.forEach(entry => {
      const dateField = entry.startTime || entry.createdAt
      if (!dateField) return
      
      const entryDate = typeof dateField === 'string' ? parseISO(dateField) : new Date(dateField)
      if (!isValid(entryDate)) return
      
      const dayKey = format(entryDate, 'yyyy-MM-dd')
      if (dailyTotals.has(dayKey)) {
        dailyTotals.set(dayKey, (dailyTotals.get(dayKey) || 0) + entry.duration)
      }
    })

    // Convert to chart data format
    const labels = days.map(day => format(day, 'MMM dd'))
    const data = days.map(day => {
      const dayKey = format(day, 'yyyy-MM-dd')
      const totalSeconds = dailyTotals.get(dayKey) || 0
      // Convert seconds to hours for better chart display
      return totalSeconds / 3600
    })

    return {
      labels,
      datasets: [{
        label: 'Hours',
        data,
        backgroundColor: '#3B82F6',
        borderColor: '#3B82F6'
      }]
    }
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
        // Actually delete the user
        await userService.deleteUser(user.id)
        
        // Update local state to remove the user
        setUsers(prevUsers => prevUsers.filter(u => u.id !== user.id))
        
        // Also refresh the data to ensure consistency
        await loadData()
        
        console.log('User deletion process completed for:', user.id)
      } catch (error: any) {
        setError(`Failed to delete user: ${error.message || 'Unknown error'}`)
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
        isActive: updatedUser.isActive,
        timezone: updatedUser.timezone
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

  const handleUserCreate = async (userData: any) => {
    try {
      setError('')
      // Create user in the database with proper company isolation
      const newUser = await userService.createUser({
        name: userData.name,
        email: userData.email,
        password: userData.password,
        role: userData.role,
        hourlyRate: userData.hourlyRate,
        timezone: userData.timezone,
        companyId: currentUser?.companyId || null // Ensure user belongs to admin's company
      })
      
      // Add to local state
      setUsers(prevUsers => [...prevUsers, newUser])
      
      setIsCreateModalOpen(false)
    } catch (error) {
      setError('Failed to create user')
      console.error('Error creating user:', error)
    }
  }

  const handleEditTimeEntry = (timeEntry: TimeEntry) => {
    setEditingTimeEntry(timeEntry)
    setIsTimeEntryEditModalOpen(true)
  }

  const handleTimeEntrySave = (updatedEntry: TimeEntry) => {
    // Update local state
    setTimeEntries(prevEntries => 
      prevEntries.map(entry => 
        entry.id === updatedEntry.id ? updatedEntry : entry
      )
    )
  }

  const handleTimeEntryDelete = (entryId: string) => {
    setTimeEntries(prevEntries => 
      prevEntries.filter(entry => entry.id !== entryId)
    )
  }

  if (!currentUser?.role || !['admin', 'hr', 'super_admin', 'root'].includes(currentUser.role)) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100 mb-4">Access Denied</h1>
          <p className="text-gray-600 dark:text-gray-400">You need admin, HR, super admin, or root privileges to access this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading admin dashboard...</p>
        </div>
      </div>
    )
  }

  const totalHours = getTotalHours()
  const activeUsers = getActiveUsers()
  const projectStats = getProjectStats()
  const userStats = getUserStats()

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                {(currentUser?.role as string) === 'hr' ? 'HR Dashboard' : 
                 (currentUser?.role as string) === 'super_admin' ? 'Super Admin Dashboard' : 
                 'Admin Dashboard'}
              </h1>
              <p className="text-gray-600 dark:text-gray-400">
                {(currentUser?.role as string) === 'hr' ? 'Manage employees and view user details' :
                 (currentUser?.role as string) === 'super_admin' ? 'Complete system access and all permissions' :
                 'Manage users, monitor time entries, and view system analytics'}
              </p>
            </div>
            <div className="flex items-center space-x-2">
              <Shield className="h-5 w-5 text-gray-400 dark:text-gray-500" />
              <span className="text-sm text-gray-500 dark:text-gray-400">
                {getRoleDisplayName(currentUser?.role || 'employee')}
              </span>
            </div>
          </div>
        </div>

        {/* Navigation Tabs */}
        <div className="mb-8">
          <nav className="flex space-x-8">
            {([
              { id: 'overview', name: 'Overview', icon: Building2, requiredFeature: null },
              { id: 'users', name: 'Users', icon: Users, requiredFeature: 'users' },
              { id: 'time-entries', name: 'Time Entries', icon: Clock, requiredFeature: 'time-entries' },
              { id: 'projects', name: 'Projects', icon: FolderOpen, requiredFeature: 'projects' },
              { id: 'billing', name: 'Billing', icon: DollarSign, requiredFeature: 'billing' }
            ] as const)
              // If root, only show Overview and Users
              .filter(tab => currentUser?.role === 'root' ? ['overview', 'users'].includes(tab.id) : true)
              // Then apply permission feature filter for non-root
              .filter(tab =>
                !tab.requiredFeature || (currentUser?.role && canAccessFeature(currentUser.role, tab.requiredFeature))
              )
              .map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id as any)}
                className={`flex items-center space-x-2 px-3 py-2 border-b-2 font-medium text-sm ${
                  activeTab === tab.id
                    ? 'border-primary-500 text-primary-600 dark:text-primary-400'
                    : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300 dark:hover:border-gray-600'
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
              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-blue-100 dark:bg-blue-900 rounded-lg">
                    <Users className="h-6 w-6 text-blue-600 dark:text-blue-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{users.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-green-100 dark:bg-green-900 rounded-lg">
                    <Activity className="h-6 w-6 text-green-600 dark:text-green-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{activeUsers.length}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-yellow-100 dark:bg-yellow-900 rounded-lg">
                    <Clock className="h-6 w-6 text-yellow-600 dark:text-yellow-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{formatDurationToHHMMSS(totalHours)}</p>
                  </div>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
                <div className="flex items-center">
                  <div className="p-2 bg-purple-100 dark:bg-purple-900 rounded-lg">
                    <TrendingUp className="h-6 w-6 text-purple-600 dark:text-purple-400" />
                  </div>
                  <div className="ml-4">
                    <p className="text-sm font-medium text-gray-600 dark:text-gray-400">Projects</p>
                    <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{projects.length}</p>
                  </div>
                </div>
              </div>
            </div>

            {/* Top Users by Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Top Users by Hours</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {userStats.slice(0, 5).map((user) => (
                    <div key={user.id} className="flex items-center justify-between">
                      <div className="flex items-center space-x-3">
                        <div className="flex-shrink-0">
                          <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                            <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                              {user.name.charAt(0).toUpperCase()}
                            </span>
                          </div>
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</p>
                          <p className="text-sm text-gray-500 dark:text-gray-400">{user.email}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDurationToHHMMSS(user.totalHours)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{user.entryCount} entries</p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Top Projects by Hours */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Top Projects by Hours</h3>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {projectStats.slice(0, 5).map((project) => (
                    <div key={project.id} className="flex items-center justify-between">
                      <div>
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.name}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{project.clientName}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900 dark:text-gray-100">{formatDurationToHHMMSS(project.totalHours)}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{project.entryCount} entries</p>
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="flex-1">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
                    <input
                      type="text"
                      placeholder="Search users..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="w-full pl-10 pr-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 placeholder-gray-500 dark:placeholder-gray-400"
                    />
                  </div>
                </div>
                {currentUser?.role && canAccessFeature(currentUser.role, 'create-users') && (
                  <button 
                    onClick={() => setIsCreateModalOpen(true)}
                    className="btn-primary flex items-center space-x-2"
                  >
                    <Plus className="h-4 w-4" />
                    <span>Add User</span>
                  </button>
                )}
              </div>
            </div>

            {/* Users Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Role
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Team
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Last Activity
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {getFilteredUsers().map((user) => {
                      const userEntries = timeEntries.filter((entry: TimeEntry) => entry.userId === user.id)
        const lastActivity = userEntries.length > 0 ? 
          Math.max(...userEntries.map((entry: TimeEntry) => new Date(entry.startTime).getTime())) : null
                      
                      return (
                        <tr key={user.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-10 w-10 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-sm font-medium text-gray-600 dark:text-gray-400">
                                  {user.name.charAt(0).toUpperCase()}
                                </span>
                              </div>
                              <div className="ml-4">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user.name}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user.email}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.role === 'admin' 
                                ? 'bg-purple-100 dark:bg-purple-900 text-purple-800 dark:text-purple-300' 
                                : 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                            }`}>
                              {user.role}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {user.teamId ? (
                              <span className="text-sm text-gray-600 dark:text-gray-400">Team Member</span>
                            ) : (
                              <span className="text-sm text-gray-400 dark:text-gray-500">No Team</span>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                              user.isActive 
                                ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' 
                                : 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
                            }`}>
                              {user.isActive ? 'Active' : 'Inactive'}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
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
                              {currentUser?.role && canAccessFeature(currentUser.role, 'user-details') && (
                                <button 
                                  onClick={() => handleViewUser(user)}
                                  className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300"
                                  title="View user details"
                                >
                                  <Eye className="h-4 w-4" />
                                </button>
                              )}
                              {currentUser?.role && canAccessFeature(currentUser.role, 'canManageUsers') && (
                                <button 
                                  onClick={() => handleEditUser(user)}
                                  className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300"
                                  title="Edit user"
                                >
                                  <Edit className="h-4 w-4" />
                                </button>
                              )}
                              {currentUser?.role && canAccessFeature(currentUser.role, 'canManageUsers') && (
                                <button 
                                  onClick={() => handleDeleteUser(user)}
                                  className="text-red-600 dark:text-red-400 hover:text-red-900 dark:hover:text-red-300"
                                  title="Delete user"
                                >
                                  <Trash2 className="h-4 w-4" />
                                </button>
                              )}
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
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">User</label>
                  <select
                    value={selectedUser || ''}
                    onChange={(e) => setSelectedUser(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Users</option>
                    {users.map(user => (
                      <option key={user.id} value={user.id}>{user.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Client</label>
                  <select
                    value={selectedClient || ''}
                    onChange={(e) => setSelectedClient(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Clients</option>
                    {clients.map(client => (
                      <option key={client.id} value={client.id}>{client.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Project</label>
                  <select
                    value={selectedProject || ''}
                    onChange={(e) => setSelectedProject(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Projects</option>
                    {projects.map(project => (
                      <option key={project.id} value={project.id}>{project.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Team</label>
                  <select
                    value={selectedTeam || ''}
                    onChange={(e) => setSelectedTeam(e.target.value || null)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="">All Teams</option>
                    {teams.map(team => (
                      <option key={team.id} value={team.id}>{team.name}</option>
                    ))}
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Date Range</label>
                  <select
                    value={dateFilter}
                    onChange={(e) => handleDateFilterChange(e.target.value as any)}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100"
                  >
                    <option value="week">This Week</option>
                    <option value="month">This Month</option>
                    <option value="all">All Time</option>
                    <option value="custom">Custom Range</option>
                  </select>
                </div>
              </div>
            </div>

            {/* Custom Date Range Inputs */}
            {dateFilter === 'custom' && (
              <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4">
                <div className="flex items-center space-x-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
                    <input
                      type="date"
                      value={customStartDate}
                      onChange={(e) => handleCustomDateChange('start', e.target.value)}
                      className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate)
                          ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
                    <input
                      type="date"
                      value={customEndDate}
                      onChange={(e) => handleCustomDateChange('end', e.target.value)}
                      className={`px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 bg-white dark:bg-gray-800 text-gray-900 dark:text-gray-100 ${
                        customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate)
                          ? 'border-red-300 dark:border-red-600 bg-red-50 dark:bg-red-900'
                          : 'border-gray-300 dark:border-gray-600'
                      }`}
                    />
                  </div>
                </div>
                {customStartDate && customEndDate && new Date(customStartDate) > new Date(customEndDate) && (
                  <p className="text-red-600 dark:text-red-400 text-sm mt-2">Start date must be before end date</p>
                )}
              </div>
            )}

            {/* Daily Time Chart */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="mb-6">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Daily Time Tracking</h3>
                <p className="text-sm text-gray-500 dark:text-gray-400">
                  {selectedUser ? 
                    `Time tracked by ${users.find(u => u.id === selectedUser)?.name || 'selected user'} for ${dateFilter === 'week' ? 'this week' : dateFilter === 'month' ? 'this month' : dateFilter === 'custom' ? 'custom range' : 'last 30 days'}` :
                    `Time tracked by all users for ${dateFilter === 'week' ? 'this week' : dateFilter === 'month' ? 'this month' : dateFilter === 'custom' ? 'custom range' : 'last 30 days'}`
                  }
                </p>
              </div>
              
              <div className="w-full overflow-x-auto">
                <div className="min-w-full" style={{ minWidth: `${Math.max(400, getDailyTimeData().labels.length * 60)}px` }}>
                  <SimpleChart
                    data={getDailyTimeData()}
                    type="bar"
                    height={350}
                  />
                </div>
              </div>
            </div>

            {/* Time Entries Table */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 dark:border-gray-700">
                <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                  Time Entries ({getFilteredTimeEntries().length})
                </h3>
              </div>
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        User
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Date
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Duration
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Description
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {getFilteredTimeEntries().map((entry: TimeEntry) => {
                      const user = users.find(u => u.id === entry.userId)
                      const project = projects.find(p => p.id === entry.projectId)
                      
                      return (
                        <tr key={entry.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="flex items-center">
                              <div className="h-8 w-8 bg-gray-200 dark:bg-gray-700 rounded-full flex items-center justify-center">
                                <span className="text-xs font-medium text-gray-600 dark:text-gray-300">
                                  {user?.name.charAt(0).toUpperCase() || '?'}
                                </span>
                              </div>
                              <div className="ml-3">
                                <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{user?.name || 'Unknown'}</div>
                                <div className="text-sm text-gray-500 dark:text-gray-400">{user?.email || ''}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900 dark:text-gray-100">{project?.name || 'Unknown Project'}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{project?.clientName || ''}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
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
                          <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                            {formatDurationToHHMMSS(entry.duration)}
                          </td>
                          <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100">
                            {entry.description || '-'}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                            <div className="flex items-center space-x-2">
                              <button
                                onClick={() => handleEditTimeEntry(entry)}
                                className="text-primary-600 hover:text-primary-900 dark:text-primary-400 dark:hover:text-primary-300"
                                title="Edit time entry"
                              >
                                <Edit className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleTimeEntryDelete(entry.id)}
                                className="text-red-600 hover:text-red-900 dark:text-red-400 dark:hover:text-red-300"
                                title="Delete time entry"
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

        {/* Projects Tab */}
        {activeTab === 'projects' && (
          <div className="space-y-6">
            {/* Projects Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Projects Overview</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Manage and monitor all projects</p>
                </div>
                <button className="btn-primary flex items-center space-x-2">
                  <FolderOpen className="h-4 w-4" />
                  <span>Add Project</span>
                </button>
              </div>

              {/* Projects Stats */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <FolderOpen className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Total Projects</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">{projects.length}</p>
                    </div>
                  </div>
                </div>
                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <Activity className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Active Projects</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">
                        {projects.filter(p => p.status === 'active').length}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Total Hours</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {formatDurationToHHMMSS(projectStats.reduce((total, p) => total + p.totalHours, 0))}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Projects Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Total Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Entries
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {projectStats.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div>
                            <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.name}</div>
                            <div className="text-sm text-gray-500 dark:text-gray-400">{project.description || 'No description'}</div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{project.clientName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            project.status === 'active' 
                              ? 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300' 
                              : project.status === 'completed'
                              ? 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300'
                              : 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300'
                          }`}>
                            {project.status || 'Unknown'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDurationToHHMMSS(project.totalHours)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-gray-400">
                          {project.entryCount}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          <div className="flex space-x-2">
                            <button className="text-primary-600 dark:text-primary-400 hover:text-primary-900 dark:hover:text-primary-300">
                              <Eye className="h-4 w-4" />
                            </button>
                            <button className="text-indigo-600 dark:text-indigo-400 hover:text-indigo-900 dark:hover:text-indigo-300">
                              <Edit className="h-4 w-4" />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* Billing Tab */}
        {activeTab === 'billing' && (
          <div className="space-y-6">
            {/* Billing Overview */}
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow p-6">
              <div className="flex items-center justify-between mb-6">
                <div>
                  <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100">Billing Overview</h3>
                  <p className="text-sm text-gray-500 dark:text-gray-400">Track revenue and billing information</p>
                </div>
                <button className="btn-primary flex items-center space-x-2">
                  <DollarSign className="h-4 w-4" />
                  <span>Create Invoice</span>
                </button>
              </div>

              {/* Billing Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 dark:bg-green-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <DollarSign className="h-8 w-8 text-green-600 dark:text-green-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-green-600 dark:text-green-400">Total Revenue</p>
                      <p className="text-2xl font-bold text-green-900 dark:text-green-100">$0.00</p>
                    </div>
                  </div>
                </div>
                <div className="bg-blue-50 dark:bg-blue-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <Building2 className="h-8 w-8 text-blue-600 dark:text-blue-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-blue-600 dark:text-blue-400">Active Clients</p>
                      <p className="text-2xl font-bold text-blue-900 dark:text-blue-100">
                        {new Set(projects.map(p => p.clientName)).size}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-yellow-50 dark:bg-yellow-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <Clock className="h-8 w-8 text-yellow-600 dark:text-yellow-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-yellow-600 dark:text-yellow-400">Billable Hours</p>
                      <p className="text-2xl font-bold text-yellow-900 dark:text-yellow-100">
                        {formatDurationToHHMMSS(totalHours)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="bg-purple-50 dark:bg-purple-900 rounded-lg p-4">
                  <div className="flex items-center">
                    <TrendingUp className="h-8 w-8 text-purple-600 dark:text-purple-400" />
                    <div className="ml-3">
                      <p className="text-sm font-medium text-purple-600 dark:text-purple-400">Avg. Rate</p>
                      <p className="text-2xl font-bold text-purple-900 dark:text-purple-100">
                        $0.00/hr
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Billing Table */}
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                  <thead className="bg-gray-50 dark:bg-gray-700">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Client
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Project
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Hours
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Rate
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Amount
                      </th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                        Status
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                    {projectStats.map((project) => (
                      <tr key={project.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{project.clientName}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900 dark:text-gray-100">{project.name}</div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDurationToHHMMSS(project.totalHours)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          $0.00/hr
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          $0.00
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                            Not Billed
                          </span>
                        </td>
                      </tr>
                    ))}
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
          currentUserRole={currentUser?.role || 'employee'}
        />

        {/* User Create Modal */}
        <UserCreateModal
          isOpen={isCreateModalOpen}
          onClose={() => setIsCreateModalOpen(false)}
          onSave={handleUserCreate}
          currentUserRole={currentUser?.role || 'employee'}
        />

        {/* Time Entry Edit Modal */}
        <TimeEntryEditModal
          isOpen={isTimeEntryEditModalOpen}
          onClose={() => setIsTimeEntryEditModalOpen(false)}
          timeEntry={editingTimeEntry}
          onSave={handleTimeEntrySave}
          onDelete={handleTimeEntryDelete}
        />

        {/* Error Message */}
        {error && (
          <div className="fixed top-4 right-4 bg-red-100 dark:bg-red-900 border border-red-400 dark:border-red-700 text-red-700 dark:text-red-300 px-4 py-3 rounded-lg shadow-lg z-50">
            <div className="flex items-center space-x-2">
              <span>{error}</span>
              <button
                onClick={() => setError('')}
                className="text-red-500 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300"
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
