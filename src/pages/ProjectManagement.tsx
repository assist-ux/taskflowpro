import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { taskService } from '../services/taskService'
import { Task, TaskStatus, TaskPriority, CreateTaskData, UpdateTaskData } from '../types'
import TaskBoard from '../components/taskManagement/TaskBoard'
import TaskModal from '../components/taskManagement/TaskModal'

export default function TaskManagement() {
  const { currentUser } = useAuth()
  const [loading, setLoading] = useState(true)
  const [tasks, setTasks] = useState<Task[]>([])
  const [statuses, setStatuses] = useState<TaskStatus[]>([])
  const [priorities, setPriorities] = useState<TaskPriority[]>([])
  const [showTaskModal, setShowTaskModal] = useState(false)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      setLoading(true)
      const [tasksData, statusesData, prioritiesData] = await Promise.all([
        taskService.getTasks(undefined, currentUser?.uid), // Only get current user's tasks
        taskService.getTaskStatuses(),
        taskService.getTaskPriorities()
      ])
      
      setTasks(tasksData)
      setStatuses(statusesData)
      setPriorities(prioritiesData)
    } catch (error) {
      console.error('Error loading data:', error)
    } finally {
      setLoading(false)
    }
  }

  const handleTaskUpdate = async (taskId: string, updates: Partial<Task>) => {
    try {
      // Create updateData with only the fields that should be updated
      const updateData: UpdateTaskData = {}
      
      // Copy over non-status/priority fields that are in UpdateTaskData
      if (updates.title !== undefined) updateData.title = updates.title
      if (updates.description !== undefined) updateData.description = updates.description
      if (updates.assigneeId !== undefined) updateData.assigneeId = updates.assigneeId
      if (updates.dueDate !== undefined) updateData.dueDate = updates.dueDate
      if (updates.estimatedHours !== undefined) updateData.estimatedHours = updates.estimatedHours
      if (updates.actualHours !== undefined) updateData.actualHours = updates.actualHours
      if (updates.tags !== undefined) updateData.tags = updates.tags
      if (updates.isCompleted !== undefined) updateData.isCompleted = updates.isCompleted
      
      // Handle status and priority
      if (updates.status) {
        updateData.status = typeof updates.status === 'string' ? updates.status : updates.status.id
      }
      
      if (updates.priority) {
        updateData.priority = typeof updates.priority === 'string' ? updates.priority : updates.priority.id
      }
      
      await taskService.updateTask(taskId, updateData)
      
      // Update local state with the new status object
      setTasks(prev => 
        prev.map(task => {
          if (task.id === taskId) {
            const newStatus = updates.status || task.status
            const newPriority = updates.priority || task.priority
            
            return { 
              ...task, 
              ...updates, 
              status: newStatus,
              priority: newPriority,
              updatedAt: new Date() 
            }
          }
          return task
        })
      )
    } catch (error) {
      console.error('Error updating task:', error)
    }
  }

  const handleCreateTask = () => {
    setSelectedTask(null)
    setShowTaskModal(true)
  }

  const handleEditTask = (task: Task) => {
    setSelectedTask(task)
    setShowTaskModal(true)
  }

  const handleTaskSave = async (taskData: CreateTaskData | UpdateTaskData) => {
    try {
      if (selectedTask) {
        // Update existing task
        await taskService.updateTask(selectedTask.id, taskData as UpdateTaskData)
      } else {
        // Create new task
        if (currentUser) {
          await taskService.createTask(
            taskData as CreateTaskData, 
            currentUser.uid, 
            currentUser.name || 'Unknown User'
          )
        }
      }
      
      await loadData()
      setShowTaskModal(false)
      setSelectedTask(null)
    } catch (error) {
      console.error('Error saving task:', error)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    )
  }

  return (
    <div className="h-screen flex flex-col">
      <TaskBoard
        tasks={tasks}
        statuses={statuses}
        priorities={priorities}
        onTaskUpdate={handleTaskUpdate}
        onCreateTask={handleCreateTask}
        onEditTask={handleEditTask}
      />
      
      {/* Task Modal */}
      {showTaskModal && (
        <TaskModal
          isOpen={showTaskModal}
          onClose={() => {
            setShowTaskModal(false)
            setSelectedTask(null)
          }}
          onSave={handleTaskSave}
          task={selectedTask}
          statuses={statuses}
          priorities={priorities}
        />
      )}
    </div>
  )
}