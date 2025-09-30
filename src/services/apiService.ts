import { TimeEntry, Project, CreateTimeEntryData, CreateProjectData, TimeSummary } from '../types'

// API Configuration
const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:3001/api'

// Get Firebase ID token for authentication
const getAuthToken = async (): Promise<string | null> => {
  try {
    const { auth } = await import('../config/firebase')
    const user = auth.currentUser
    if (user) {
      return await user.getIdToken()
    }
    return null
  } catch (error) {
    console.error('Error getting auth token:', error)
    return null
  }
}

// Generic API request function
const apiRequest = async <T>(
  endpoint: string,
  options: RequestInit = {}
): Promise<T> => {
  const token = await getAuthToken()
  
  if (!token) {
    throw new Error('Authentication required')
  }

  const url = `${API_BASE_URL}${endpoint}`
  
  const config: RequestInit = {
    ...options,
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${token}`,
      ...options.headers,
    },
  }

  try {
    const response = await fetch(url, config)
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `HTTP error! status: ${response.status}`)
    }

    const data = await response.json()
    return data
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error)
    throw error
  }
}

// Time Entries API
export const timeEntriesAPI = {
  // Get all time entries with optional filters
  async getTimeEntries(filters?: {
    startDate?: string
    endDate?: string
    projectId?: string
    billableOnly?: boolean
  }) {
    const queryParams = new URLSearchParams()
    
    if (filters?.startDate) queryParams.append('startDate', filters.startDate)
    if (filters?.endDate) queryParams.append('endDate', filters.endDate)
    if (filters?.projectId) queryParams.append('projectId', filters.projectId)
    if (filters?.billableOnly) queryParams.append('billableOnly', 'true')
    
    const queryString = queryParams.toString()
    const endpoint = `/time-entries${queryString ? `?${queryString}` : ''}`
    
    return apiRequest<{
      success: boolean
      data: TimeEntry[]
      count: number
    }>(endpoint)
  },

  // Create a new time entry
  async createTimeEntry(entryData: CreateTimeEntryData) {
    return apiRequest<{
      success: boolean
      data: TimeEntry
      message: string
    }>('/time-entries', {
      method: 'POST',
      body: JSON.stringify(entryData),
    })
  },

  // Update an existing time entry
  async updateTimeEntry(id: string, updates: Partial<CreateTimeEntryData>) {
    return apiRequest<{
      success: boolean
      message: string
    }>(`/time-entries/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete a time entry
  async deleteTimeEntry(id: string) {
    return apiRequest<{
      success: boolean
      message: string
    }>(`/time-entries/${id}`, {
      method: 'DELETE',
    })
  },

  // Get time summary for a specific period
  async getTimeSummary(period: 'today' | 'week' | 'month' = 'month') {
    return apiRequest<{
      success: boolean
      data: TimeSummary
    }>(`/time-summary?period=${period}`)
  },
}

// Projects API
export const projectsAPI = {
  // Get all active projects
  async getProjects() {
    return apiRequest<{
      success: boolean
      data: Project[]
      count: number
    }>('/projects')
  },

  // Create a new project
  async createProject(projectData: CreateProjectData) {
    return apiRequest<{
      success: boolean
      data: Project
      message: string
    }>('/projects', {
      method: 'POST',
      body: JSON.stringify(projectData),
    })
  },

  // Update an existing project
  async updateProject(id: string, updates: Partial<CreateProjectData>) {
    return apiRequest<{
      success: boolean
      message: string
    }>(`/projects/${id}`, {
      method: 'PUT',
      body: JSON.stringify(updates),
    })
  },

  // Delete a project
  async deleteProject(id: string) {
    return apiRequest<{
      success: boolean
      message: string
    }>(`/projects/${id}`, {
      method: 'DELETE',
    })
  },
}

// Calendar API
export const calendarAPI = {
  // Get calendar data for a specific month
  async getCalendarData(filters?: {
    year?: number
    month?: number
    projectId?: string
    billableOnly?: boolean
  }) {
    const queryParams = new URLSearchParams()
    
    if (filters?.year) queryParams.append('year', filters.year.toString())
    if (filters?.month !== undefined) queryParams.append('month', filters.month.toString())
    if (filters?.projectId) queryParams.append('projectId', filters.projectId)
    if (filters?.billableOnly) queryParams.append('billableOnly', 'true')
    
    const queryString = queryParams.toString()
    const endpoint = `/calendar${queryString ? `?${queryString}` : ''}`
    
    return apiRequest<{
      success: boolean
      data: Array<{
        date: string
        events: TimeEntry[]
        totalDuration: number
        billableDuration: number
      }>
      month: number
      year: number
    }>(endpoint)
  },
}

// Health Check API
export const healthAPI = {
  // Check API health status
  async checkHealth() {
    return apiRequest<{
      status: string
      timestamp: string
      version: string
    }>('/health')
  },
}

// Export all APIs as a single object
export const api = {
  timeEntries: timeEntriesAPI,
  projects: projectsAPI,
  calendar: calendarAPI,
  health: healthAPI,
}

// Export default
export default api
