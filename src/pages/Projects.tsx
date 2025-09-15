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
  User,
  AlertCircle
} from 'lucide-react'
import { Project, Client } from '../types'
import { projectService } from '../services/projectService'
import ProjectModal from '../components/projects/ProjectModal'
import ClientModal from '../components/projects/ClientModal'
import { formatDate } from '../utils'

const STATUS_COLORS = {
  active: 'bg-green-100 text-green-800',
  'on-hold': 'bg-yellow-100 text-yellow-800',
  completed: 'bg-blue-100 text-blue-800',
  cancelled: 'bg-red-100 text-red-800'
}

const PRIORITY_COLORS = {
  low: 'text-gray-600',
  medium: 'text-yellow-600',
  high: 'text-orange-600',
  urgent: 'text-red-600'
}

export default function Projects() {
  const [projects, setProjects] = useState<Project[]>([])
  const [clients, setClients] = useState<Client[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [statusFilter, setStatusFilter] = useState<string>('all')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [showProjectModal, setShowProjectModal] = useState(false)
  const [showClientModal, setShowClientModal] = useState(false)
  const [selectedProject, setSelectedProject] = useState<Project | null>(null)
  const [selectedClient, setSelectedClient] = useState<Client | null>(null)
  const [error, setError] = useState('')

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    setLoading(true)
    try {
      const [projectsData, clientsData] = await Promise.all([
        projectService.getProjects(),
        projectService.getClients()
      ])
      setProjects(projectsData)
      setClients(clientsData)
    } catch (error) {
      setError('Failed to load projects and clients')
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
  }

  const handleArchiveProject = async (project: Project) => {
    try {
      await projectService.archiveProject(project.id)
      loadData()
    } catch (error) {
      setError('Failed to archive project')
    }
  }

  const handleCreateClient = () => {
    setSelectedClient(null)
    setShowClientModal(true)
  }

  const handleEditClient = (client: Client) => {
    setSelectedClient(client)
    setShowClientModal(true)
  }

  const handleDeleteClient = async (client: Client) => {
    if (window.confirm(`Are you sure you want to delete "${client.name}"?`)) {
      try {
        await projectService.deleteClient(client.id)
        loadData()
      } catch (error) {
        setError('Failed to delete client')
      }
    }
  }

  const filteredProjects = projects.filter(project => {
    const matchesSearch = project.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.description?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         project.clientName?.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === 'all' || project.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getClientName = (clientId?: string) => {
    if (!clientId) return 'No client'
    const client = clients.find(c => c.id === clientId)
    return client?.name || 'Unknown client'
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading projects...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Projects</h1>
          <p className="text-gray-600">Manage your projects and clients</p>
        </div>
        
        <div className="flex space-x-3">
          <button
            onClick={handleCreateClient}
            className="btn-secondary flex items-center space-x-2"
          >
            <User className="h-4 w-4" />
            <span>Add Client</span>
          </button>
          <button
            onClick={handleCreateProject}
            className="btn-primary flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Project</span>
          </button>
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
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
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
          
          <div className="flex border border-gray-300 rounded-lg">
            <button
              onClick={() => setViewMode('grid')}
              className={`p-2 ${viewMode === 'grid' ? 'bg-primary-100 text-primary-700' : 'text-gray-600'}`}
            >
              <Grid className="h-4 w-4" />
            </button>
            <button
              onClick={() => setViewMode('list')}
              className={`p-2 ${viewMode === 'list' ? 'bg-primary-100 text-primary-700' : 'text-gray-600'}`}
            >
              <List className="h-4 w-4" />
            </button>
          </div>
        </div>
      </div>

      {/* Clients Section */}
      {clients.length > 0 && (
        <div className="card">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold text-gray-900">Clients</h2>
            <button
              onClick={handleCreateClient}
              className="btn-secondary flex items-center space-x-2"
            >
              <Plus className="h-4 w-4" />
              <span>Add Client</span>
            </button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {clients.map((client) => (
              <div key={client.id} className="p-4 border border-gray-200 rounded-lg hover:bg-gray-50">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="font-medium text-gray-900">{client.name}</h3>
                    {client.company && (
                      <p className="text-sm text-gray-500">{client.company}</p>
                    )}
                    {client.email && (
                      <p className="text-sm text-gray-500">{client.email}</p>
                    )}
                  </div>
                  <div className="flex items-center space-x-1">
                    <button
                      onClick={() => handleEditClient(client)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                    >
                      <Edit className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => handleDeleteClient(client)}
                      className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-700"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Projects Grid/List */}
      {filteredProjects.length === 0 ? (
        <div className="text-center py-12">
          <div className="p-4 bg-gray-100 rounded-full w-16 h-16 mx-auto mb-4 flex items-center justify-center">
            <Plus className="h-8 w-8 text-gray-400" />
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No projects found</h3>
          <p className="text-gray-500 mb-4">
            {searchTerm || statusFilter !== 'all' 
              ? 'Try adjusting your search or filters'
              : 'Get started by creating your first project'
            }
          </p>
          {!searchTerm && statusFilter === 'all' && (
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
                        <h3 className="font-semibold text-gray-900">{project.name}</h3>
                        <p className="text-sm text-gray-500">{getClientName(project.clientId)}</p>
                      </div>
                    </div>
                    <div className="relative">
                      <button className="p-1 hover:bg-gray-100 rounded">
                        <MoreVertical className="h-4 w-4 text-gray-500" />
                      </button>
                    </div>
                  </div>

                  {project.description && (
                    <p className="text-sm text-gray-600 mb-4 line-clamp-2">
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

                    <div className="flex items-center justify-between text-sm text-gray-500">
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
                      <h3 className="font-semibold text-gray-900 truncate">{project.name}</h3>
                      <p className="text-sm text-gray-500">{getClientName(project.clientId)}</p>
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
                </>
              )}

              {/* Action Menu */}
              <div className="flex items-center space-x-2">
                <button
                  onClick={() => handleEditProject(project)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleArchiveProject(project)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-gray-700"
                >
                  <Archive className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDeleteProject(project)}
                  className="p-1 hover:bg-gray-100 rounded text-gray-500 hover:text-red-700"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
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
      
      <ClientModal
        isOpen={showClientModal}
        onClose={() => setShowClientModal(false)}
        client={selectedClient}
        onSuccess={loadData}
      />
    </div>
  )
}
