import { useState } from 'react'
import { 
  Plus, 
  MoreHorizontal, 
  Calendar, 
  User, 
  Clock,
  CheckCircle2,
  Circle,
  AlertCircle,
  Play,
  Flag
} from 'lucide-react'
import { Task, TaskStatus, TaskPriority } from '../../types'

interface TaskBoardProps {
  tasks: Task[]
  statuses: TaskStatus[]
  priorities: TaskPriority[]
  onTaskUpdate: (taskId: string, updates: Partial<Task>) => void
  onCreateTask: () => void
  onEditTask: (task: Task) => void
}

const PRIORITY_ICONS = {
  low: Circle,
  medium: Play,
  high: AlertCircle,
  urgent: Flag
}

const PRIORITY_COLORS = {
  low: 'text-gray-500',
  medium: 'text-blue-500',
  high: 'text-orange-500',
  urgent: 'text-red-500'
}

export default function TaskBoard({ 
  tasks, 
  statuses, 
  priorities, 
  onTaskUpdate, 
  onCreateTask, 
  onEditTask 
}: TaskBoardProps) {
  const [draggedTask, setDraggedTask] = useState<string | null>(null)

  const getTasksForStatus = (statusId: string) => {
    return tasks.filter(task => {
      // Handle both object and string status formats
      if (typeof task.status === 'string') {
        return task.status === statusId
      }
      return task.status.id === statusId
    })
  }

  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    setDraggedTask(taskId)
    e.dataTransfer.effectAllowed = 'move'
  }

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'move'
  }

  const handleDrop = (e: React.DragEvent, statusId: string) => {
    e.preventDefault()
    
    if (!draggedTask) return
    
    const newStatus = statuses.find(s => s.id === statusId)
    if (!newStatus) return
    
    onTaskUpdate(draggedTask, { status: newStatus.id })
    setDraggedTask(null)
  }

  const formatDate = (date: Date | undefined) => {
    if (!date) return ''
    return new Date(date).toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric' 
    })
  }

  const getPriorityIcon = (priority: TaskPriority | string) => {
    const priorityName = typeof priority === 'string' ? priority : priority.name
    const IconComponent = PRIORITY_ICONS[priorityName.toLowerCase() as keyof typeof PRIORITY_ICONS] || Circle
    return <IconComponent className={`h-4 w-4 ${PRIORITY_COLORS[priorityName.toLowerCase() as keyof typeof PRIORITY_COLORS] || 'text-gray-500'}`} />
  }

  const getStatusColor = (status: TaskStatus) => {
    return `bg-${status.color.replace('#', '')} border-${status.color.replace('#', '')}`
  }

  return (
    <div className="flex-1 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Task Management</h1>
            <p className="text-gray-600">Organize and track your tasks</p>
          </div>
          
          <button 
            onClick={onCreateTask}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors flex items-center space-x-2"
          >
            <Plus className="h-4 w-4" />
            <span>New Task</span>
          </button>
        </div>
      </div>

      {/* Board */}
      <div className="flex overflow-x-auto p-6 space-x-6">
        {statuses.map((status) => {
          const statusTasks = getTasksForStatus(status.id)
          
          return (
            <div
              key={status.id}
              className="flex-shrink-0 w-80"
              onDragOver={handleDragOver}
              onDrop={(e) => handleDrop(e, status.id)}
            >
              {/* Status Header */}
              <div className={`${status.color} border rounded-lg p-4 mb-4`} style={{ backgroundColor: status.color + '20', borderColor: status.color }}>
                <div className="flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{status.name}</h3>
                  <span className="text-sm text-gray-600 bg-white px-2 py-1 rounded-full">
                    {statusTasks.length}
                  </span>
                </div>
              </div>

              {/* Tasks */}
              <div className="space-y-3">
                {statusTasks.map((task) => {
                  const priority = typeof task.priority === 'string' 
                    ? priorities.find(p => p.id === task.priority) || { name: task.priority, color: '#6B7280' }
                    : task.priority
                  
                  return (
                    <div
                      key={task.id}
                      draggable
                      onDragStart={(e) => handleDragStart(e, task.id)}
                      onClick={() => onEditTask(task)}
                      className="bg-white border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow cursor-pointer group"
                    >
                      {/* Task Header */}
                      <div className="flex items-start justify-between mb-3">
                        <div className="flex items-center space-x-2">
                          <div 
                            className="w-3 h-3 rounded-full"
                            style={{ backgroundColor: priority.color }}
                          />
                          <h4 className="font-medium text-gray-900">
                            {task.title}
                          </h4>
                        </div>
                        <button 
                          onClick={(e) => {
                            e.stopPropagation()
                            onEditTask(task)
                          }}
                          className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-gray-600 transition-all"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>
                      </div>

                      {/* Task Description */}
                      {task.description && (
                        <p className="text-sm text-gray-600 mb-3 line-clamp-2">
                          {task.description}
                        </p>
                      )}

                      {/* Task Meta */}
                      <div className="space-y-2">
                        {/* Priority */}
                        <div className="flex items-center space-x-2">
                          {getPriorityIcon(priority)}
                          <span className="text-sm text-gray-600">
                            {priority.name} priority
                          </span>
                        </div>

                      {/* Project */}
                      {task.projectName && (
                        <div className="flex items-center space-x-2">
                          <div className="w-2 h-2 rounded-full bg-blue-500" />
                          <span className="text-sm text-gray-600">
                            {task.projectName}
                          </span>
                        </div>
                      )}

                      {/* Assignee */}
                      {task.assigneeName && (
                        <div className="flex items-center space-x-2">
                          <User className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {task.assigneeName}
                          </span>
                        </div>
                      )}

                      {/* Due Date */}
                      {task.dueDate && (
                        <div className="flex items-center space-x-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            Due {formatDate(task.dueDate)}
                          </span>
                        </div>
                      )}

                      {/* Estimated Hours */}
                      {task.estimatedHours && (
                        <div className="flex items-center space-x-2">
                          <Clock className="h-4 w-4 text-gray-400" />
                          <span className="text-sm text-gray-600">
                            {task.estimatedHours}h estimated
                          </span>
                        </div>
                      )}

                      {/* Actual Hours */}
                      {task.actualHours && task.actualHours > 0 && (
                        <div className="flex items-center space-x-2">
                          <CheckCircle2 className="h-4 w-4 text-green-500" />
                          <span className="text-sm text-gray-600">
                            {task.actualHours}h logged
                          </span>
                        </div>
                      )}
                    </div>

                    {/* Tags */}
                    {task.tags && task.tags.length > 0 && (
                      <div className="mt-3 pt-3 border-t border-gray-100">
                        <div className="flex flex-wrap gap-1">
                          {task.tags.map((tag, index) => (
                            <span
                              key={index}
                              className="px-2 py-1 text-xs bg-gray-100 text-gray-600 rounded-full"
                            >
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    </div>
                  )
                })}

                {/* Add New Task Button */}
                <button
                  onClick={onCreateTask}
                  className="w-full p-4 border-2 border-dashed border-gray-300 rounded-lg text-gray-500 hover:border-gray-400 hover:text-gray-600 transition-colors group"
                >
                  <div className="flex items-center justify-center space-x-2">
                    <Plus className="h-4 w-4" />
                    <span className="text-sm font-medium">Add Task</span>
                  </div>
                </button>
              </div>
            </div>
          )
        })}
      </div>
    </div>
  )
}
