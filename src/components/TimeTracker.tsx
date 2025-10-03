import { useState, useEffect, useRef } from 'react'
import { Play, Square, Clock, DollarSign, Tag, FileText, Building2 } from 'lucide-react'
import { TimeEntry, CreateTimeEntryData, Project, Client } from '../types'
import { timeEntryService } from '../services/timeEntryService'
import { projectService } from '../services/projectService'
import { useAuth } from '../contexts/AuthContext'
import { formatDateTime } from '../utils'

interface TimeTrackerProps {
  onTimeUpdate?: (timeSummary: any) => void
}

export default function TimeTracker({ onTimeUpdate }: TimeTrackerProps) {
  const { currentUser } = useAuth()
  const [isRunning, setIsRunning] = useState(false)
  const [elapsedTime, setElapsedTime] = useState(0)
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null)
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [selectedClientId, setSelectedClientId] = useState<string>('')
  const [formData, setFormData] = useState<CreateTimeEntryData>({
    projectId: '',
    description: '',
    isBillable: false,
    tags: []
  })
  const [newTag, setNewTag] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  
  const intervalRef = useRef<NodeJS.Timeout | null>(null)
  const startTimeRef = useRef<Date | null>(null)

  // Filter projects based on selected client
  const filteredProjects = selectedClientId 
    ? projects.filter(project => project.clientId === selectedClientId)
    : projects

  useEffect(() => {
    loadInitialData()
    // Subscribe to real-time running time entry updates
    let unsubscribe: (() => void) | null = null
    
    if (currentUser) {
      // Cast to any to access the real-time method added via Object.assign
      const realtimeService = timeEntryService as any
      unsubscribe = realtimeService.subscribeToRunningTimeEntry(currentUser.uid, (runningEntry: TimeEntry | null) => {
        if (runningEntry) {
          // If projectName is missing but projectId exists, try to get it from projects
          if (!runningEntry.projectName && runningEntry.projectId) {
            const project = projects.find(p => p.id === runningEntry.projectId)
            if (project) {
              runningEntry.projectName = project.name
            }
          }
          
          setCurrentEntry(runningEntry)
          setIsRunning(true)
          const startTime = new Date(runningEntry.startTime)
          startTimeRef.current = startTime
          const now = new Date()
          const elapsed = Math.floor((now.getTime() - startTime.getTime()) / 1000)
          setElapsedTime(Math.max(0, elapsed))
          
          // Set the selected client from the running entry
          if (runningEntry.clientId) {
            setSelectedClientId(runningEntry.clientId)
          }
          
          // Update form data from the running entry
          setFormData(prev => ({
            projectId: runningEntry.projectId || prev.projectId || '',
            description: runningEntry.description || prev.description || '',
            isBillable: runningEntry.isBillable !== undefined ? runningEntry.isBillable : (prev.isBillable || false),
            tags: runningEntry.tags || prev.tags || []
          }))
        } else {
          // No running entry found - timer was stopped
          setCurrentEntry(null)
          setIsRunning(false)
          setElapsedTime(0)
          startTimeRef.current = null
          // Reset all form data for next entry
          setSelectedClientId('')
          setFormData({
            projectId: '',
            description: '',
            isBillable: false,
            tags: []
          })
        }
      })
    }
    
    return () => {
      if (unsubscribe) {
        unsubscribe()
      }
    }
  }, [currentUser, projects])

  useEffect(() => {
    if (isRunning && startTimeRef.current) {
      intervalRef.current = setInterval(() => {
        const now = new Date()
        const elapsed = Math.floor((now.getTime() - startTimeRef.current!.getTime()) / 1000)
        setElapsedTime(Math.max(0, elapsed)) // Ensure non-negative
      }, 1000)
    } else {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
        intervalRef.current = null
      }
    }

    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current)
      }
    }
  }, [isRunning])

  // Update document title with running time
  useEffect(() => {
    if (isRunning) {
      document.title = `${formatElapsedTime(elapsedTime)} - TaskFlowPro`
    } else {
      // Reset to default title when timer is not running
      document.title = 'Task Flow Pro - Time Tracking & Project Management'
    }
  }, [isRunning, elapsedTime])

  const loadInitialData = async () => {
    if (!currentUser) return
    
    try {
      // Load both clients and projects
      const [clientsData, projectsData] = await Promise.all([
        currentUser?.companyId 
          ? projectService.getClientsForCompany(currentUser.companyId)
          : projectService.getClients(),
        currentUser?.companyId 
          ? projectService.getProjectsForCompany(currentUser.companyId)
          : projectService.getProjects()
      ])
      
      setClients(clientsData)
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading data:', error)
    }
  }

  const startTimer = async () => {
    if (!currentUser) return
    
    setLoading(true)
    setError('')
    
    try {
      // Check if there's already a running timer before creating a new one
      const existingRunningEntry = await timeEntryService.getRunningTimeEntry(currentUser.uid)
      if (existingRunningEntry) {
        setError('Timer is already running. Please stop the current timer before starting a new one.')
        setLoading(false)
        return
      }
      
      // Create entry with minimal data - project and description can be added later
      const minimalEntryData: CreateTimeEntryData = {
        projectId: formData.projectId || undefined,
        description: formData.description || undefined,
        isBillable: formData.isBillable || false,
        tags: formData.tags || [],
        clientId: selectedClientId || undefined // Add clientId
      }
      
      // Get the project name if project is selected
      const selectedProject = formData.projectId ? projects.find(p => p.id === formData.projectId) : undefined
      const projectName = selectedProject?.name
      
      // Get the client name
      const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : undefined
      const clientName = selectedClient?.name
      
      const entryId = await timeEntryService.createTimeEntry(minimalEntryData, currentUser.uid, projectName, currentUser.companyId, clientName)
      
      // Real-time subscription will handle the state updates
      // No need to manually set state here
      
      if (onTimeUpdate) {
        const summary = await timeEntryService.getTimeSummary(currentUser.uid)
        onTimeUpdate(summary)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to start timer')
    } finally {
      setLoading(false)
    }
  }

  const stopTimer = async () => {
    if (!currentEntry) return
    
    // Validate required fields before stopping
    if (!selectedClientId) {
      setError('Please select a client before stopping the timer')
      return
    }
    
    if (!formData.projectId) {
      setError('Please select a project before stopping the timer')
      return
    }
    
    if (!formData.description || !formData.description.trim()) {
      setError('Please enter a description before stopping the timer')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Update the entry with the final project and description before stopping
      const selectedProject = formData.projectId ? projects.find(p => p.id === formData.projectId) : undefined
      const projectName = selectedProject?.name
      
      // Get the client name
      const selectedClient = selectedClientId ? clients.find(c => c.id === selectedClientId) : undefined
      const clientName = selectedClient?.name
      
      await timeEntryService.updateTimeEntry(currentEntry.id, {
        projectId: formData.projectId,
        description: formData.description.trim(),
        isBillable: formData.isBillable,
        tags: formData.tags,
        projectName: projectName,
        clientId: selectedClientId, // Add clientId
        clientName: clientName // Add clientName
      })
      
      await timeEntryService.stopTimeEntry(currentEntry.id)
      
      // Real-time subscription will handle state updates automatically
      // No need to manually reset state here
      
      if (onTimeUpdate) {
        const summary = await timeEntryService.getTimeSummary(currentUser!.uid)
        onTimeUpdate(summary)
      }
    } catch (error: any) {
      setError(error.message || 'Failed to stop timer')
    } finally {
      setLoading(false)
    }
  }

  const formatElapsedTime = (seconds: number): string => {
    // Handle NaN, undefined, or negative values
    if (!seconds || isNaN(seconds) || seconds < 0) {
      return '00:00:00'
    }
    
    const hours = Math.floor(seconds / 3600)
    const minutes = Math.floor((seconds % 3600) / 60)
    const secs = Math.floor(seconds % 60)
    
    return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  const addTag = () => {
    if (newTag.trim() && !formData.tags?.includes(newTag.trim())) {
      setFormData(prev => ({
        ...prev,
        tags: [...(prev.tags || []), newTag.trim()]
      }))
      setNewTag('')
    }
  }

  const removeTag = (tagToRemove: string) => {
    setFormData(prev => ({
      ...prev,
      tags: prev.tags?.filter(tag => tag !== tagToRemove) || []
    }))
  }

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'No client'
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Unknown client'
  }

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'No project'
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown project'
  }

  return (
    <div className="space-y-6">

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 dark:bg-red-900 border border-red-200 dark:border-red-700 rounded-lg">
          <Clock className="h-5 w-5 text-red-500 dark:text-red-400 flex-shrink-0" />
          <p className="text-sm text-red-700 dark:text-red-300">{error}</p>
        </div>
      )}

      {/* Timer Display */}
      <div className="card text-center">
        <div className="mb-6">
          <div className="text-6xl font-mono font-bold text-primary-600 dark:text-primary-400 mb-2">
            {formatElapsedTime(elapsedTime)}
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            {isRunning ? 'Timer is running...' : 'Ready to track time'}
          </p>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={loading || isRunning}
              className="btn-primary flex items-center space-x-2 px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={isRunning ? "Timer is already running" : "Start tracking time"}
            >
              <Play className="h-5 w-5" />
              <span>Start Timer</span>
            </button>
          ) : (
            <button
              onClick={stopTimer}
              disabled={loading || !selectedClientId || !formData.projectId || !formData.description || !formData.description.trim()}
              className="btn-danger flex items-center space-x-2 px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
              title={!selectedClientId || !formData.projectId || !formData.description || !formData.description.trim() ? "Please fill in all required fields" : "Stop tracking time"}
            >
              <Square className="h-5 w-5" />
              <span>Stop Timer</span>
            </button>
          )}
        </div>
      </div>

      {/* Current Entry Info */}
      {currentEntry && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">Current Entry</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <Building2 className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Client:</strong> {currentEntry.clientName || getClientName(currentEntry.clientId)}
              </span>
            </div>
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Project:</strong> {currentEntry.projectName || getProjectName(currentEntry.projectId)}
              </span>
            </div>
            {currentEntry.description && (
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <span className="text-sm text-gray-600 dark:text-gray-400">
                  <strong>Description:</strong> {currentEntry.description}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500 dark:text-gray-400" />
              <span className="text-sm text-gray-600 dark:text-gray-400">
                <strong>Started:</strong> {currentEntry.startTime ? formatDateTime(currentEntry.startTime) : '--'}
              </span>
            </div>
            {currentEntry.isBillable && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-500 dark:text-green-400" />
                <span className="text-sm text-green-600 dark:text-green-400 font-medium">Billable</span>
              </div>
            )}
            {currentEntry.tags && currentEntry.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                <div className="flex flex-wrap gap-1">
                  {currentEntry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 text-xs rounded-full"
                    >
                      {tag}
                    </span>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Timer Setup Form - Hidden by default, shown when timer is running */}
      {isRunning && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Complete Timer Details
          </h3>
          <div className="mb-4 p-3 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Timer is running!</strong> Please fill in all details before stopping.
            </p>
          </div>
          <div className="space-y-4">
            {/* Client Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Client <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Building2 className="h-4 w-4 text-gray-400" />
                </div>
                <select
                  value={selectedClientId}
                  onChange={(e) => {
                    setSelectedClientId(e.target.value)
                    // Don't automatically reset project selection
                    // Only reset if the selected project is not valid for the new client
                    const newClientId = e.target.value
                    if (newClientId && formData.projectId) {
                      // Check if the currently selected project belongs to the new client
                      const projectBelongsToClient = projects.some(
                        p => p.id === formData.projectId && p.clientId === newClientId
                      )
                      if (!projectBelongsToClient) {
                        // Only reset project if it doesn't belong to the new client
                        setFormData(prev => ({ ...prev, projectId: '' }))
                      }
                    } else if (!newClientId) {
                      // If no client is selected, reset project selection
                      setFormData(prev => ({ ...prev, projectId: '' }))
                    }
                  }}
                  className="input pl-10"
                  required
                >
                  <option value="">Select a client</option>
                  {clients.map((client) => (
                    <option key={client.id} value={client.id}>
                      {client.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Project <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <select
                value={formData.projectId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value || undefined }))}
                className="input"
                required
                disabled={!selectedClientId} // Disable project selection until client is selected
              >
                <option value="">Select a project</option>
                {filteredProjects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
              {!selectedClientId && (
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Please select a client first
                </p>
              )}
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Description <span className="text-red-500 dark:text-red-400">*</span>
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value || undefined }))}
                className="input"
                placeholder="What are you working on? (required to stop)"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Tags (Optional)
              </label>
              <div className="flex space-x-2 mb-2">
                <input
                  type="text"
                  value={newTag}
                  onChange={(e) => setNewTag(e.target.value)}
                  className="input flex-1"
                  placeholder="Add a tag"
                  onKeyPress={(e) => e.key === 'Enter' && addTag()}
                />
                <button
                  type="button"
                  onClick={addTag}
                  className="btn-secondary"
                >
                  Add
                </button>
              </div>
              {formData.tags && formData.tags.length > 0 && (
                <div className="flex flex-wrap gap-2">
                  {formData.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-primary-100 dark:bg-primary-800 text-primary-700 dark:text-primary-300 text-sm rounded-full"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-primary-900 dark:hover:text-primary-200"
                      >
                        ×
                      </button>
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Billable Toggle */}
            <div className="flex items-center space-x-2">
              <input
                type="checkbox"
                id="isBillable"
                checked={formData.isBillable || false}
                onChange={async (e) => {
                  const newBillableValue = e.target.checked;
                  setFormData(prev => ({ ...prev, isBillable: newBillableValue }));
                  
                  // If there's a current running entry, update it immediately
                  if (currentEntry) {
                    try {
                      await timeEntryService.updateTimeEntry(currentEntry.id, {
                        isBillable: newBillableValue
                      });
                    } catch (error) {
                      console.error('Error updating billable status:', error);
                      // Revert the local state if the update fails
                      setFormData(prev => ({ ...prev, isBillable: !newBillableValue }));
                    }
                  }
                }}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
              />
              <label htmlFor="isBillable" className="text-sm font-medium text-gray-700 dark:text-gray-300">
                This is billable time
              </label>
              {isRunning && formData.isBillable && (
                <span className="ml-2 inline-flex items-center px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 text-xs font-medium rounded-full">
                  <DollarSign className="h-3 w-3 mr-1" />
                  Billable
                </span>
              )}
            </div>
          </div>
        </div>
      )}


    </div>
  )
}