import { ref, set, get, push, remove, update } from 'firebase/database'
import { database } from '../config/firebase'
import { Task, CreateTaskData, UpdateTaskData, TaskStatus, TaskPriority } from '../types'

export const taskService = {
  // Tasks
  async createTask(taskData: CreateTaskData, userId: string, userName: string): Promise<Task> {
    const taskRef = push(ref(database, 'tasks'))
    
    // Convert string IDs to objects for the Task type
    const status = { id: taskData.status, name: '', color: '#6B7280', order: 0, isCompleted: false }
    const priority = { id: taskData.priority, name: '', color: '#6B7280', level: 1 }
    
    const newTask: Task = {
      ...taskData,
      id: taskRef.key!,
      projectName: '', // Will be set when project is loaded
      status,
      priority,
      isCompleted: false,
      createdBy: userId,
      createdByName: userName,
      createdAt: new Date(),
      updatedAt: new Date(),
      tags: [],
      attachments: [],
      comments: [],
      timeEntries: []
    }
    
    await set(taskRef, newTask)
    return newTask
  },

  async getTasks(projectId?: string, userId?: string): Promise<Task[]> {
    const tasksRef = ref(database, 'tasks')
    const snapshot = await get(tasksRef)
    
    if (snapshot.exists()) {
      const tasks = snapshot.val()
      let taskList = Object.values(tasks).map((task: any) => {
        // Get default statuses and priorities
        const defaultStatuses = [
          { id: 'status_0', name: 'To Do', color: '#6B7280', order: 0, isCompleted: false },
          { id: 'status_1', name: 'In Progress', color: '#3B82F6', order: 1, isCompleted: false },
          { id: 'status_2', name: 'Review', color: '#F59E0B', order: 2, isCompleted: false },
          { id: 'status_3', name: 'Done', color: '#10B981', order: 3, isCompleted: true }
        ]
        
        const defaultPriorities = [
          { id: 'priority_0', name: 'Low', color: '#6B7280', level: 1 },
          { id: 'priority_1', name: 'Medium', color: '#F59E0B', level: 2 },
          { id: 'priority_2', name: 'High', color: '#EF4444', level: 3 },
          { id: 'priority_3', name: 'Urgent', color: '#DC2626', level: 4 }
        ]
        
        // Convert status and priority from Firebase format to our format
        const statusId = task.status?.statusId || task.status
        const priorityId = task.priority?.priorityId || task.priority
        
        const status = defaultStatuses.find(s => s.id === statusId) || defaultStatuses[0]
        const priority = defaultPriorities.find(p => p.id === priorityId) || defaultPriorities[0]
        
        return {
          ...task,
          status,
          priority,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }
      }) as Task[]
      
      // Filter by user - users can only see their own tasks
      if (userId) {
        taskList = taskList.filter(task => task.createdBy === userId)
      }
      
      // Filter by project
      if (projectId) {
        taskList = taskList.filter(task => task.projectId === projectId)
      }
      
      return taskList
    }
    
    return []
  },

  // Get tasks for team members (for team leaders)
  async getTeamTasks(teamId: string, projectId?: string): Promise<Task[]> {
    const { teamService } = await import('./teamService')
    const teamMembers = await teamService.getTeamMembers(teamId)
    const teamMemberIds = teamMembers.map(member => member.userId)
    
    const tasksRef = ref(database, 'tasks')
    const snapshot = await get(tasksRef)
    
    if (snapshot.exists()) {
      const tasks = snapshot.val()
      let taskList = Object.values(tasks).map((task: any) => {
        // Get default statuses and priorities
        const defaultStatuses = [
          { id: 'status_0', name: 'To Do', color: '#6B7280', order: 0, isCompleted: false },
          { id: 'status_1', name: 'In Progress', color: '#3B82F6', order: 1, isCompleted: false },
          { id: 'status_2', name: 'Review', color: '#F59E0B', order: 2, isCompleted: false },
          { id: 'status_3', name: 'Done', color: '#10B981', order: 3, isCompleted: true }
        ]
        
        const defaultPriorities = [
          { id: 'priority_0', name: 'Low', color: '#6B7280', level: 1 },
          { id: 'priority_1', name: 'Medium', color: '#F59E0B', level: 2 },
          { id: 'priority_2', name: 'High', color: '#EF4444', level: 3 },
          { id: 'priority_3', name: 'Urgent', color: '#DC2626', level: 4 }
        ]
        
        // Convert status and priority from Firebase format to our format
        const statusId = task.status?.statusId || task.status
        const priorityId = task.priority?.priorityId || task.priority
        
        const status = defaultStatuses.find(s => s.id === statusId) || defaultStatuses[0]
        const priority = defaultPriorities.find(p => p.id === priorityId) || defaultPriorities[0]
        
        return {
          ...task,
          status,
          priority,
          createdAt: new Date(task.createdAt),
          updatedAt: new Date(task.updatedAt),
          dueDate: task.dueDate ? new Date(task.dueDate) : undefined,
          completedAt: task.completedAt ? new Date(task.completedAt) : undefined
        }
      }) as Task[]
      
      // Filter by team members
      taskList = taskList.filter(task => teamMemberIds.includes(task.createdBy))
      
      // Filter by project
      if (projectId) {
        taskList = taskList.filter(task => task.projectId === projectId)
      }
      
      return taskList
    }
    
    return []
  },

  async updateTask(taskId: string, updates: UpdateTaskData): Promise<void> {
    const taskRef = ref(database, `tasks/${taskId}`)
    
    // Convert status and priority objects to Firebase format
    const firebaseUpdates: any = { ...updates }
    
    // Remove status and priority from the main updates object
    delete firebaseUpdates.status
    delete firebaseUpdates.priority
    
    // Add them back in Firebase format if they exist
    if (updates.status) {
      firebaseUpdates.status = { statusId: updates.status }
    }
    
    if (updates.priority) {
      firebaseUpdates.priority = { priorityId: updates.priority }
    }
    
    await update(taskRef, {
      ...firebaseUpdates,
      updatedAt: new Date().toISOString()
    })
  },

  async deleteTask(taskId: string): Promise<void> {
    const taskRef = ref(database, `tasks/${taskId}`)
    await remove(taskRef)
  },

  // Task Statuses
  async getTaskStatuses(): Promise<TaskStatus[]> {
    // Return default statuses since Firebase doesn't have this collection yet
    return [
      { id: 'status_0', name: 'To Do', color: '#6B7280', order: 0, isCompleted: false },
      { id: 'status_1', name: 'In Progress', color: '#3B82F6', order: 1, isCompleted: false },
      { id: 'status_2', name: 'Review', color: '#F59E0B', order: 2, isCompleted: false },
      { id: 'status_3', name: 'Done', color: '#10B981', order: 3, isCompleted: true }
    ]
  },

  // Task Priorities
  async getTaskPriorities(): Promise<TaskPriority[]> {
    // Return default priorities since Firebase doesn't have this collection yet
    return [
      { id: 'priority_0', name: 'Low', color: '#6B7280', level: 1 },
      { id: 'priority_1', name: 'Medium', color: '#F59E0B', level: 2 },
      { id: 'priority_2', name: 'High', color: '#EF4444', level: 3 },
      { id: 'priority_3', name: 'Urgent', color: '#DC2626', level: 4 }
    ]
  }
}
