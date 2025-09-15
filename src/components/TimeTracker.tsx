import { useState, useEffect, useRef } from 'react'
import { Play, Square, Clock, DollarSign, Tag, FileText } from 'lucide-react'
import { TimeEntry, CreateTimeEntryData, Project } from '../types'
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

  useEffect(() => {
    loadInitialData()
    loadRunningEntry()
  }, [])

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

  const loadInitialData = async () => {
    if (!currentUser) return
    
    try {
      const projectsData = await projectService.getProjects()
      setProjects(projectsData)
    } catch (error) {
      console.error('Error loading projects:', error)
    }
  }

  const loadRunningEntry = async () => {
    if (!currentUser) return
    
    try {
      const runningEntry = await timeEntryService.getRunningTimeEntry(currentUser.uid)
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
        setElapsedTime(Math.max(0, elapsed)) // Ensure non-negative
      }
    } catch (error) {
      console.error('Error loading running entry:', error)
    }
  }

  const startTimer = async () => {
    if (!currentUser) return
    
    // Validate required fields
    if (!formData.projectId) {
      setError('Please select a project')
      return
    }
    
    if (!formData.description || !formData.description.trim()) {
      setError('Please enter a description')
      return
    }
    
    setLoading(true)
    setError('')
    
    try {
      // Get the project name before creating the entry
      const selectedProject = projects.find(p => p.id === formData.projectId)
      const projectName = selectedProject?.name
      
      const entryId = await timeEntryService.createTimeEntry(formData, currentUser.uid, projectName)
      const newEntry: TimeEntry = {
        id: entryId,
        userId: currentUser.uid,
        projectId: formData.projectId,
        projectName: projectName,
        description: formData.description,
        startTime: new Date(),
        duration: 0,
        isRunning: true,
        isBillable: formData.isBillable || false,
        tags: formData.tags,
        createdAt: new Date(),
        updatedAt: new Date()
      }
      
      setCurrentEntry(newEntry)
      setIsRunning(true)
      startTimeRef.current = new Date()
      setElapsedTime(0)
      
      // Reset form for next entry
      setFormData({
        projectId: '',
        description: '',
        isBillable: false,
        tags: []
      })
      
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
    
    setLoading(true)
    setError('')
    
    try {
      await timeEntryService.stopTimeEntry(currentEntry.id)
      setIsRunning(false)
      setCurrentEntry(null)
      setElapsedTime(0)
      startTimeRef.current = null
      
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

  const getProjectName = (projectId?: string) => {
    if (!projectId) return 'No project'
    const project = projects.find(p => p.id === projectId)
    return project?.name || 'Unknown project'
  }

  return (
    <div className="space-y-6">
      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <Clock className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Timer Display */}
      <div className="card text-center">
        <div className="mb-6">
          <div className="text-6xl font-mono font-bold text-primary-600 mb-2">
            {formatElapsedTime(elapsedTime)}
          </div>
          <p className="text-gray-600">
            {isRunning ? 'Timer is running...' : 'Ready to track time'}
          </p>
        </div>

        {/* Timer Controls */}
        <div className="flex justify-center space-x-4">
          {!isRunning ? (
            <button
              onClick={startTimer}
              disabled={loading || !formData.projectId || !formData.description || !formData.description.trim()}
              className="btn-primary flex items-center space-x-2 px-8 py-3 text-lg disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <Play className="h-5 w-5" />
              <span>Start Timer</span>
            </button>
          ) : (
            <button
              onClick={stopTimer}
              disabled={loading}
              className="btn-danger flex items-center space-x-2 px-8 py-3 text-lg"
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
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Current Entry</h3>
          <div className="space-y-3">
            <div className="flex items-center space-x-2">
              <FileText className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                <strong>Project:</strong> {getProjectName(currentEntry.projectId)}
              </span>
            </div>
            {currentEntry.description && (
              <div className="flex items-center space-x-2">
                <FileText className="h-4 w-4 text-gray-500" />
                <span className="text-sm text-gray-600">
                  <strong>Description:</strong> {currentEntry.description}
                </span>
              </div>
            )}
            <div className="flex items-center space-x-2">
              <Clock className="h-4 w-4 text-gray-500" />
              <span className="text-sm text-gray-600">
                <strong>Started:</strong> {currentEntry.startTime ? formatDateTime(currentEntry.startTime) : '--'}
              </span>
            </div>
            {currentEntry.isBillable && (
              <div className="flex items-center space-x-2">
                <DollarSign className="h-4 w-4 text-green-500" />
                <span className="text-sm text-green-600 font-medium">Billable</span>
              </div>
            )}
            {currentEntry.tags && currentEntry.tags.length > 0 && (
              <div className="flex items-center space-x-2">
                <Tag className="h-4 w-4 text-gray-500" />
                <div className="flex flex-wrap gap-1">
                  {currentEntry.tags.map((tag, index) => (
                    <span
                      key={index}
                      className="px-2 py-1 bg-primary-100 text-primary-700 text-xs rounded-full"
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

      {/* Timer Setup Form */}
      {!isRunning && (
        <div className="card">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Timer Setup</h3>
          <div className="space-y-4">
            {/* Project Selection */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Project <span className="text-red-500">*</span>
              </label>
              <select
                value={formData.projectId || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, projectId: e.target.value || undefined }))}
                className="input"
                required
              >
                <option value="">Select a project</option>
                {projects.map((project) => (
                  <option key={project.id} value={project.id}>
                    {project.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Description <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                value={formData.description || ''}
                onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value || undefined }))}
                className="input"
                placeholder="What are you working on?"
                required
              />
            </div>

            {/* Tags */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
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
                      className="inline-flex items-center space-x-1 px-2 py-1 bg-primary-100 text-primary-700 text-sm rounded-full"
                    >
                      <span>{tag}</span>
                      <button
                        type="button"
                        onClick={() => removeTag(tag)}
                        className="hover:text-primary-900"
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
                onChange={(e) => setFormData(prev => ({ ...prev, isBillable: e.target.checked }))}
                className="h-4 w-4 text-primary-600 focus:ring-primary-500 border-gray-300 rounded"
              />
              <label htmlFor="isBillable" className="text-sm font-medium text-gray-700">
                This is billable time
              </label>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
