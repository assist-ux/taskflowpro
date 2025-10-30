import { useState, useEffect } from 'react'
import { 
  Plus, 
  Search, 
  Grid, 
  List, 
  MoreVertical, 
  Edit, 
  Trash2, 
  Archive,
  Calendar,
  DollarSign,
  AlertCircle
} from 'lucide-react'
import { Project, Client } from '../types'
import { projectService } from '../services/projectService'
import ProjectModal from '../components/projects/ProjectModal'
import { useAuth } from '../contexts/AuthContext'
import { canAccessFeature } from '../utils/permissions'
import { formatDate } from '../utils'

const STATUS_COLORS = {
  active: 'bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-300',
  'on-hold': 'bg-yellow-100 dark:bg-yellow-900 text-yellow-800 dark:text-yellow-300',
  completed: 'bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-300',
  cancelled: 'bg-red-100 dark:bg-red-900 text-red-800 dark:text-red-300'
}

const PRIORITY_COLORS = {
  low: 'text-gray-600 dark:text-gray-400',
  medium: 'text-yellow-600 dark:text-yellow-400',
  high: 'text-orange-600 dark:text-orange-400',
  urgent: 'text-red-600 dark:text-red-400'
}

export default function Projects() {
  const { currentUser } = useAuth()
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [error, setError] = useState('')
  const [openProjectId, setOpenProjectId] = useState<string | null>(null)
  const [showArchived, setShowArchived] = useState(false)

  useEffect(() => {
    loadData()
  }, [showArchived, currentUser?.companyId])

  const loadData = async () => {
    setLoading(true)
    try {
      // Use company-scoped data loading for multi-tenant isolation
      let projectsData: Project[] = [];
      const [clientsData] = await Promise.all([
        currentUser?.companyId 
          ? projectService.getClientsForCompany(currentUser.companyId)
          : projectService.getClients()
      ])
      
      if (showArchived) {
        projectsData = currentUser?.companyId 
          ? await projectService.getArchivedProjectsForCompany(currentUser.companyId)
          : await projectService.getArchivedProjects()
      } else {
        projectsData = currentUser?.companyId 
          ? await projectService.getProjectsForCompany(currentUser.companyId)
          : await projectService.getProjects()
      }
      
      setProjects(projectsData)
      setClients(clientsData)
    } catch (error) {
      setError('Failed to load projects')
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleCreateProject = () => {
    setSelectedProject(null)
    setShowProjectModal(true)
  }

  const handleEditProject = (project: Project) => {
    setSelectedProject(project)
    setShowProjectModal(true)
    setOpenProjectId(null) // Close dropdown after selection
  }

  const handleDeleteProject = async (project: Project) => {
    if (window.confirm(`Are you sure you want to delete "${project.name}"?`)) {
      try {
        await projectService.deleteProject(project.id)
        loadData()
      } catch (error) {
        setError('Failed to delete project')
      }
    }
    setOpenProjectId(null) // Close dropdown after selection
  }

  const handleArchiveProject = async (project: Project) => {
    try {
      await projectService.archiveProject(project.id)
      loadData()
    } catch (error) {
      setError('Failed to archive project')
    }
    setOpenProjectId(null) // Close dropdown after selection
  }

  const handleUnarchiveProject = async (project: Project) => {
    try {
      await projectService.unarchiveProject(project.id)
      loadData()
    } catch (error) {
      setError('Failed to unarchive project')
    }
    setOpenProjectId(null) // Close dropdown after selection
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    const matchesArchived = showArchived ? project.isArchived : !project.isArchived
    return matchesSearch && matchesStatus && matchesArchived
  })

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'No client'
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Unknown client'
  }

  // Permission check
  if (!currentUser?.role || !canAccessFeature(currentUser.role, 'projects')) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-gray-100">
        <div className="text-center p-8 bg-white rounded-lg shadow-md">
          <h1 className="text-3xl font-bold text-red-600 mb-4">Access Denied</h1>
          <p className="text-gray-700">You do not have permission to view this page.</p>
        </div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600 dark:text-gray-400">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6 scrollbar-visible">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">Projects</h1>
          <p className="text-gray-600 dark:text-gray-400">Manage your projects</p>
        </div>
        
        <div className="flex space-x-3">
          {currentUser?.role && canAccessFeature(currentUser.role, 'projects') && (
            <button
              onClick={handleCreateProject}
              className="btn-primary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>New Project</span>
            </button>
          )}
        </div>
      </div>

      {/* Error Message */}
      {error && (
        <div className="flex items-center space-x-2 p-3 bg-red-50 border border-red-200 rounded-lg">
          <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0" />
          <p className="text-sm text-red-700">{error}</p>
        </div>
      )}

      {/* Filters and Search */}
      <div className="flex flex-col sm:flex-row gap-4">
        <div className="flex-1">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-gray-500" />
            <input
              type="text"
              placeholder="Search projects..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="input pl-10"
            />
          </div>
        </div>
        
        <div className="flex space-x-3">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="input"
          >
            <option value="all">All Status</option>
            <option value="active">Active</option>
            <option value="on-hold">On Hold</option>
            <option value="completed">Completed</option>
            <option value="cancelled">Cancelled</option>
          </select>
          
          <div className="flex border border-gray-300 dark:border-gray-600 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 dark:bg-primary-900 text-primary-700 dark:text-primary-300' : 'text-gray-600 dark:text-gray-400'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
          
          <button
            onClick={() => setShowArchived(!showArchived)}
            className={`px-3 rounded-lg border ${
              showArchived 
                ? 'bg-primary-100 dark:bg-primary-900 border-primary-300 dark:border-primary-700 text-primary-700 dark:text-primary-300' 
                : 'bg-white dark:bg-gray-800 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300'
            }`}
          >
            {showArchived ? 'Showing Archived' : 'Show Archived'}
          </button>
        </div>
      </div>

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 dark:bg-gray-700 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-gray-400 dark:text-gray-500" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 dark:text-gray-100 mb-2">
            {showArchived ? 'No archived projects found' : 'No projects found'}
          </h3>
          <p className="text-gray-500 dark:text-gray-400 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : showArchived 
                ? 'There are no archived projects yet'
                : 'Get started by creating your first project'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && !showArchived && (
            <button
              onClick={handleCreateProject}
              className="btn-primary"
            >
              Create Project
            </button>
          )}
        </div>
      ) : (
        <div className={viewMode === 'grid' 
          ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6' 
          : 'space-y-4'
        }>
          {filteredProjects.map((project) => (
            <div
              key={project.id}
              className={`card hover:shadow-md transition-shadow ${
                viewMode === 'list' ? 'flex items-center justify-between' : ''
              }`}
            >
              {viewMode === 'grid' ? (
                <>
                  {/* Grid View */}
                  <div className="flex items-start justify-between mb-4">
                    <div className="flex items-center space-x-3">
                      <div 
                        className="w-4 h-4 rounded-full"
                        style={{ backgroundColor: project.color }}
                      />
                      <div>
                        <h3 className="font-semibold text-gray-900 dark:text-gray-100">{project.name}</h3>
                        <p className="text-sm text-gray-500 dark:text-gray-400">{getClientName(project.clientId)}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button 
                        onClick={(e) => {
                          e.stopPropagation();
                          setOpenProjectId(openProjectId === project.id ? null : project.id);
                        }}
                        className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                      >
                        <MoreVertical className="h-4 w-4 text-gray-500 dark:text-gray-400" />
                      </button>
                      
                      {/* Dropdown Menu */}
                      {openProjectId === project.id && (
                        <div 
                          className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700"
                          onClick={(e) => e.stopPropagation()}
                        >
                          <button
                            onClick={() => handleEditProject(project)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </button>
                          {showArchived ? (
                            <button
                              onClick={() => handleUnarchiveProject(project)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Unarchive
                            </button>
                          ) : (
                            <button
                              onClick={() => handleArchiveProject(project)}
                              className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                            >
                              <Archive className="h-4 w-4 mr-2" />
                              Archive
                            </button>
                          )}
                          <button
                            onClick={() => handleDeleteProject(project)}
                            className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </button>
                        </div>
                      )}
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mb-4 line-clamp-2">
                      {project.description}
                    </p>
                  )}

                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>
                        {project.status.replace('-', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[project.priority]}`}>
                        {project.priority}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-sm text-gray-500 dark:text-gray-400">
                      {project.startDate && (
                        <div className="flex items-center space-x-1">
                          <Calendar className="h-3 w-3" />
                          <span>{formatDate(project.startDate)}</span>
                        </div>
                      )}
                      {project.budget && (
                        <div className="flex items-center space-x-1">
                          <DollarSign className="h-3 w-3" />
                          <span>${project.budget.toLocaleString()}</span>
                        </div>
                      )}
                    </div>
                  </div>
                </>
              ) : (
                <>
                  {/* List View */}
                  <div className="flex items-center space-x-4">
                    <div 
                      className="w-4 h-4 rounded-full flex-shrink-0"
                      style={{ backgroundColor: project.color }}
                    />
                    <div className="flex-1 min-w-0">
                      <h3 className="font-semibold text-gray-900 dark:text-gray-100 truncate">{project.name}</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400">{getClientName(project.clientId)}</p>
                    </div>
                    <div className="flex items-center space-x-2">
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${STATUS_COLORS[project.status]}`}>
                        {project.status.replace('-', ' ')}
                      </span>
                      <span className={`text-xs font-medium ${PRIORITY_COLORS[project.priority]}`}>
                        {project.priority}
                      </span>
                    </div>
                  </div>
                  
                  {/* Action Menu for List View */}
                  <div className="relative">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setOpenProjectId(openProjectId === project.id ? null : project.id);
                      }}
                      className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                    >
                      <MoreVertical className="h-4 w-4" />
                    </button>
                    
                    {/* Dropdown Menu */}
                    {openProjectId === project.id && (
                      <div 
                        className="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-md shadow-lg py-1 z-10 border border-gray-200 dark:border-gray-700"
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button
                          onClick={() => handleEditProject(project)}
                          className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Edit className="h-4 w-4 mr-2" />
                          Edit
                        </button>
                        {showArchived ? (
                          <button
                            onClick={() => handleUnarchiveProject(project)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Unarchive
                          </button>
                        ) : (
                          <button
                            onClick={() => handleArchiveProject(project)}
                            className="flex items-center w-full px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700"
                          >
                            <Archive className="h-4 w-4 mr-2" />
                            Archive
                          </button>
                        )}
                        <button
                          onClick={() => handleDeleteProject(project)}
                          className="flex items-center w-full px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700"
                        >
                          <Trash2 className="h-4 w-4 mr-2" />
                          Delete
                        </button>
                      </div>
                    )}
                  </div>
                </>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Modals */}
      <ProjectModal
        isOpen={showProjectModal}
        onClose={() => setShowProjectModal(false)}
        project={selectedProject}
        onSuccess={loadData}
      />
    </div>
  )
}