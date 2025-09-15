import { ref, set, get, push, remove, update } from 'firebase/database'
import { database } from '../config/firebase'
import { Project, Client, CreateProjectData, CreateClientData } from '../types'

export const projectService = {
  // Projects
  async createProject(projectData: CreateProjectData, userId: string): Promise<string> {
    const projectRef = push(ref(database, 'projects'))
    const newProject: Project = {
      ...projectData,
      id: projectRef.key!,
      isArchived: false,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await set(projectRef, newProject)
    return projectRef.key!
  },

  async getProjects(): Promise<Project[]> {
    const projectsRef = ref(database, 'projects')
    const snapshot = await get(projectsRef)
    
    if (snapshot.exists()) {
      const projects = snapshot.val()
      return Object.values(projects)
        .map((project: any) => ({
          ...project,
          startDate: project.startDate ? new Date(project.startDate) : undefined,
          endDate: project.endDate ? new Date(project.endDate) : undefined,
          createdAt: new Date(project.createdAt),
          updatedAt: new Date(project.updatedAt)
        }))
        .filter((project: Project) => 
          !project.isArchived
        )
        .sort((a: Project, b: Project) => b.createdAt.getTime() - a.createdAt.getTime())
    }
    
    return []
  },

  async getProjectById(projectId: string): Promise<Project | null> {
    const projectRef = ref(database, `projects/${projectId}`)
    const snapshot = await get(projectRef)
    
    if (snapshot.exists()) {
      const project = snapshot.val()
      return {
        ...project,
        startDate: project.startDate ? new Date(project.startDate) : undefined,
        endDate: project.endDate ? new Date(project.endDate) : undefined,
        createdAt: new Date(project.createdAt),
        updatedAt: new Date(project.updatedAt)
      }
    }
    
    return null
  },

  async updateProject(projectId: string, updates: Partial<CreateProjectData>): Promise<void> {
    const projectRef = ref(database, `projects/${projectId}`)
    await update(projectRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  async deleteProject(projectId: string): Promise<void> {
    const projectRef = ref(database, `projects/${projectId}`)
    await remove(projectRef)
  },

  async archiveProject(projectId: string): Promise<void> {
    const projectRef = ref(database, `projects/${projectId}`)
    await update(projectRef, {
      isArchived: true,
      updatedAt: new Date()
    })
  },

  // Clients
  async createClient(clientData: CreateClientData, userId: string): Promise<string> {
    const clientRef = push(ref(database, 'clients'))
    const newClient: Client = {
      ...clientData,
      id: clientRef.key!,
      isArchived: false,
      createdBy: userId,
      createdAt: new Date(),
      updatedAt: new Date()
    }
    
    await set(clientRef, newClient)
    return clientRef.key!
  },

  async getClients(): Promise<Client[]> {
    const clientsRef = ref(database, 'clients')
    const snapshot = await get(clientsRef)
    
    if (snapshot.exists()) {
      const clients = snapshot.val()
      return Object.values(clients)
        .map((client: any) => ({
          ...client,
          createdAt: new Date(client.createdAt),
          updatedAt: new Date(client.updatedAt)
        }))
        .filter((client: Client) => 
          !client.isArchived
        )
        .sort((a: Client, b: Client) => a.name.localeCompare(b.name))
    }
    
    return []
  },

  async getClientById(clientId: string): Promise<Client | null> {
    const clientRef = ref(database, `clients/${clientId}`)
    const snapshot = await get(clientRef)
    
    if (snapshot.exists()) {
      const client = snapshot.val()
      return {
        ...client,
        createdAt: new Date(client.createdAt),
        updatedAt: new Date(client.updatedAt)
      }
    }
    
    return null
  },

  async updateClient(clientId: string, updates: Partial<CreateClientData>): Promise<void> {
    const clientRef = ref(database, `clients/${clientId}`)
    await update(clientRef, {
      ...updates,
      updatedAt: new Date()
    })
  },

  async deleteClient(clientId: string): Promise<void> {
    const clientRef = ref(database, `clients/${clientId}`)
    await remove(clientRef)
  },

  async archiveClient(clientId: string): Promise<void> {
    const clientRef = ref(database, `clients/${clientId}`)
    await update(clientRef, {
      isArchived: true,
      updatedAt: new Date()
    })
  }
}
